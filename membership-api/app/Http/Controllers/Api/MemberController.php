<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Transaction;
use App\Models\Reward;
use App\Models\Redemption;
use App\Models\Trip;
use App\Models\TripStep;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class MemberController extends Controller
{
    /**
     * GET /api/member/profile
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json([
            'success' => true,
            'data'    => $this->formatUser($user),
        ]);
    }

    /**
     * PUT /api/member/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name'      => 'sometimes|string|max:255',
            'phone'     => 'sometimes|string|max:20',
            'city'      => 'sometimes|string|max:100',
            'address'   => 'sometimes|string',
            'birthdate' => 'sometimes|string',
            'avatar'    => 'sometimes|string|nullable',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user->fill($request->only(['name', 'phone', 'city', 'address', 'birthdate']));

        if ($request->has('avatar')) {
            $avatarData = $request->input('avatar');
            if ($avatarData && preg_match('/^data:image\/(\w+);base64,/', $avatarData, $type)) {
                $avatarData = substr($avatarData, strpos($avatarData, ',') + 1);
                $type = strtolower($type[1]);

                if (in_array($type, ['jpg', 'jpeg', 'gif', 'png', 'webp'])) {
                    $avatarData = base64_decode($avatarData);

                    if ($avatarData !== false) {
                        $fileName = 'avatars/' . $user->id . '_' . time() . '.' . $type;
                        Storage::disk('public')->put($fileName, $avatarData);
                        
                        if ($user->avatar && str_contains($user->avatar, 'storage/avatars/')) {
                            $oldPath = str_replace(asset('storage/'), '', $user->avatar);
                            Storage::disk('public')->delete($oldPath);
                        }

                        $user->avatar = asset('storage/' . $fileName);
                    }
                }
            } else if (is_null($avatarData) || $avatarData === '') {
                $user->avatar = null;
            }
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'data'    => $this->formatUser($user->fresh()),
        ]);
    }

    /**
     * GET /api/member/invoices
     */
    public function invoices(Request $request): JsonResponse
    {
        // Prune invoices that were rejected/cancelled more than 30 seconds ago
        Invoice::where('user_id', $request->user()->id)
            ->where('status', 'rejected')
            ->where('updated_at', '<', now()->subSeconds(30))
            ->delete();

        $invoices = Invoice::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        foreach ($invoices as $inv) {
            if ($inv->status === 'pending-payment' && !$inv->snap_token) {
                $this->getOrCreateMidtransSnapToken($inv);
            }
        }

        $formatted = $invoices->map(fn($inv) => $this->formatInvoice($inv));
        $isProduction = filter_var(config('services.midtrans.is_production'), FILTER_VALIDATE_BOOLEAN);

        return response()->json([
            'success' => true,
            'data'    => $formatted,
            'midtrans_client_key' => config('services.midtrans.client_key'),
            'midtrans_is_production' => $isProduction,
        ]);
    }

    /**
     * POST /api/member/invoices/{id}/pay
     * Upload bukti transfer
     */
    public function payInvoice(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($invoice->status !== 'pending-payment') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice ini tidak dalam status menunggu pembayaran',
            ], 400);
        }

        if ($invoice->created_at->addHours(24)->isPast()) {
            $invoice->update(['status' => 'rejected']);
            return response()->json([
                'success' => false,
                'message' => 'Tagihan ini telah kadaluarsa (melebihi batas waktu 24 jam). Silakan lakukan pemesanan ulang.',
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'proof' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $path = $request->file('proof')->store('payment-proofs', 'public');

        // Update invoice status
        $invoice->update([
            'status'     => 'waiting-verification',
            'proof_path' => $path,
        ]);

        // Create or update linked transaction
        Transaction::updateOrCreate(
            ['invoice_id' => $invoice->id],
            [
                'user_id'            => $request->user()->id,
                'transaction_number' => 'TRX-' . strtoupper(\Illuminate\Support\Str::random(6)),
                'service'            => $invoice->service,
                'amount'             => $invoice->amount,
                'points_earned'      => $invoice->points,
                'status'             => 'pending',
                'proof_path'         => $path,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Bukti transfer berhasil dikirim. Menunggu verifikasi admin.',
            'data'    => $this->formatInvoice($invoice->fresh()),
        ]);
    }

    /**
     * GET /api/member/transactions
     */
    public function transactions(Request $request): JsonResponse
    {
        $txs = Transaction::where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn($t) => [
                'id'                 => $t->id,
                'transaction_number' => $t->transaction_number,
                'service'            => $t->service,
                'amount'             => $t->amount,
                'formatted_amount'   => 'Rp ' . number_format($t->amount, 0, ',', '.'),
                'points_earned'      => $t->points_earned,
                'status'             => $t->status,
                'date'               => $t->created_at->translatedFormat('d M Y'),
            ]);

        return response()->json([
            'success' => true,
            'data'    => $txs,
        ]);
    }

    /**
     * GET /api/member/rewards
     */
    public function rewards(): JsonResponse
    {
        $rewards = Reward::where('active', true)
            ->get()
            ->map(fn($r) => [
                'id'              => $r->id,
                'name'            => $r->name,
                'desc'            => $r->description,
                'points'          => $r->points_required,
                'category'        => $r->category,
                'icon'            => $r->icon,
            ]);

        return response()->json([
            'success' => true,
            'data'    => $rewards,
        ]);
    }

    /**
     * POST /api/member/rewards/{id}/redeem
     */
    public function redeemReward(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        // Strict profile validation check during reward / benefit redemption
        if (empty($user->birthdate) || $user->birthdate === 'Belum diatur' ||
            empty($user->city) || $user->city === 'Belum diatur' ||
            empty($user->address) || $user->address === 'Belum diatur') {
            return response()->json([
                'success' => false,
                'message' => 'Lengkapi Tanggal Lahir, Kota Domisili, dan Alamat Anda terlebih dahulu di profil untuk klaim benefit.',
            ], 422);
        }

        $reward = Reward::where('id', $id)->where('active', true)->firstOrFail();

        if ($user->points < $reward->points_required) {
            return response()->json([
                'success' => false,
                'message' => 'Poin Anda tidak mencukupi untuk menukarkan reward ini.',
            ], 400);
        }

        $voucherCode = 'RT-RWD-' . strtoupper(\Illuminate\Support\Str::random(6));

        Redemption::create([
            'user_id'      => $user->id,
            'reward_id'    => $reward->id,
            'points_spent' => $reward->points_required,
            'voucher_code' => $voucherCode,
            'status'       => 'active',
        ]);

        // Deduct points
        $user->decrement('points', $reward->points_required);

        return response()->json([
            'success'      => true,
            'message'      => "Reward \"{$reward->name}\" berhasil ditukar!",
            'voucher_code' => $voucherCode,
            'points_left'  => $user->fresh()->points,
        ]);
    }

    /**
     * POST /api/member/upgrade
     */
    public function upgrade(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'tier' => 'required|string|in:Silver,Gold,Platinum',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $tier = $request->input('tier');

        // Check if there is already a pending invoice for the exact same membership tier
        $existingInvoice = Invoice::where('user_id', $user->id)
            ->where('service', 'Membership ' . $tier . ' — Ranata Tour')
            ->where('status', 'pending-payment')
            ->first();

        if ($existingInvoice) {
            return response()->json([
                'success' => true,
                'message' => 'Anda sudah memiliki tagihan pending untuk tier ini.',
                'data'    => $this->formatInvoice($existingInvoice),
            ]);
        }

        // Tier prices and points
        $prices = [
            'Silver'   => 2500000,
            'Gold'     => 5000000,
            'Platinum' => 10000000,
        ];

        $points = [
            'Silver'   => 500,
            'Gold'     => 1200,
            'Platinum' => 3000,
        ];

        $invoice = Invoice::create([
            'user_id'        => $user->id,
            'invoice_number' => 'INV-MEMB-' . strtoupper(\Illuminate\Support\Str::random(8)),
            'service'        => 'Membership ' . $tier . ' — Ranata Tour',
            'amount'         => $prices[$tier],
            'points'         => $points[$tier],
            'status'         => 'pending-payment',
            'detail'         => 'Aktivasi membership paket ' . $tier . ' selama 1 tahun.',
        ]);

        // Generate Midtrans Snap token immediately
        $this->getOrCreateMidtransSnapToken($invoice);

        return response()->json([
            'success' => true,
            'message' => 'Tagihan upgrade membership berhasil dibuat.',
            'data'    => $this->formatInvoice($invoice->fresh()),
        ]);
    }

    /**
     * POST /api/member/invoices/{id}/cancel
     */
    public function cancelInvoice(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($invoice->status !== 'pending-payment') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya tagihan yang belum dibayar yang dapat dibatalkan.',
            ], 400);
        }

        $invoice->update(['status' => 'rejected']);

        return response()->json([
            'success' => true,
            'message' => 'Tagihan berhasil dibatalkan.',
            'data'    => $this->formatInvoice($invoice->fresh()),
        ]);
    }

    /**
     * POST /api/member/invoices/{id}/process-payment
     */
    public function processPayment(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($invoice->status === 'lunas') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice ini sudah lunas.',
            ], 400);
        }

        if ($invoice->created_at->addHours(24)->isPast()) {
            $invoice->update(['status' => 'rejected']);
            return response()->json([
                'success' => false,
                'message' => 'Tagihan ini telah kadaluarsa (melebihi batas waktu 24 jam). Silakan lakukan pemesanan ulang.',
            ], 400);
        }

        // Update invoice status to lunas
        $invoice->update([
            'status' => 'lunas',
        ]);

        // Find or create transaction
        $tx = Transaction::updateOrCreate(
            ['invoice_id' => $invoice->id],
            [
                'user_id'            => $request->user()->id,
                'transaction_number' => 'TRX-' . strtoupper(\Illuminate\Support\Str::random(6)),
                'service'            => $invoice->service,
                'amount'             => $invoice->amount,
                'points_earned'      => $invoice->points,
                'status'             => 'verified', // Directly verified!
            ]
        );

        // Upgrade user's membership tier and add points
        $user = $request->user();
        $user->increment('points', $invoice->points);

        // Check tier type from invoice service name
        if (str_contains($invoice->service, 'Membership Silver')) {
            $user->update(['tier' => 'Silver']);
        } elseif (str_contains($invoice->service, 'Membership Gold')) {
            $user->update(['tier' => 'Gold']);
        } elseif (str_contains($invoice->service, 'Membership Platinum')) {
            $user->update(['tier' => 'Platinum']);
        } else {
            // Fallback: update tier based on total points
            $this->updateUserTier($user->fresh());
        }

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil diproses secara otomatis.',
            'data'    => [
                'invoice' => $this->formatInvoice($invoice->fresh()),
                'user'    => $this->formatUser($user->fresh()),
            ],
        ]);
    }

    private function updateUserTier($user): void
    {
        $tier = 'Bronze';
        if ($user->points >= 12000) {
            $tier = 'Platinum';
        } elseif ($user->points >= 6000) {
            $tier = 'Gold';
        } elseif ($user->points >= 2000) {
            $tier = 'Silver';
        }
        $user->update(['tier' => $tier]);
    }

    private function formatUser($user): array
    {
        return [
            'id'             => $user->id,
            'member_id'      => $user->member_id,
            'name'           => $user->name,
            'email'          => $user->email,
            'phone'          => $user->phone,
            'role'           => $user->role,
            'tier'           => $user->tier,
            'points'         => $user->points,
            'city'           => $user->city,
            'address'        => $user->address,
            'birthdate'      => $user->birthdate,
            'avatar'         => $user->avatar,
            'joined_date'    => $user->created_at->format('M Y'),
            'total_services' => $user->transactions()->where('status', 'verified')->count(),
        ];
    }

    private function formatInvoice($inv): array
    {
        return [
            'id'              => $inv->id,
            'invoice_number'  => $inv->invoice_number,
            'service'         => $inv->service,
            'amount'          => $inv->amount,
            'formatted_amount' => 'Rp ' . number_format($inv->amount, 0, ',', '.'),
            'points'          => $inv->points,
            'status'          => $inv->status,
            'detail'          => $inv->detail,
            'proof_url'       => $inv->proof_path ? asset('storage/' . $inv->proof_path) : null,
            'date'            => $inv->created_at->translatedFormat('d M Y'),
            'snap_token'      => $inv->snap_token,
            'payment_url'     => $inv->payment_url,
            'created_at'      => $inv->created_at->toIso8601String(),
            'updated_at'      => $inv->updated_at->toIso8601String(),
        ];
    }

    private function getOrCreateMidtransSnapToken(Invoice $invoice)
    {
        if ($invoice->snap_token) {
            return [
                'token' => $invoice->snap_token,
                'redirect_url' => $invoice->payment_url
            ];
        }

        $serverKey = config('services.midtrans.server_key');
        $isProduction = filter_var(config('services.midtrans.is_production'), FILTER_VALIDATE_BOOLEAN);
        
        $baseUrl = $isProduction 
            ? 'https://app.midtrans.com/snap/v1/transactions' 
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        $user = $invoice->user;

        // Prepare request body
        $body = [
            'transaction_details' => [
                'order_id' => $invoice->invoice_number . '-' . time(), // Unique transaction id
                'gross_amount' => (int) $invoice->amount
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? '08123456789'
            ],
            'expiry' => [
                'start_time' => now()->format('Y-m-d H:i:s O'),
                'unit' => 'hour',
                'duration' => 24
            ]
        ];

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->withBasicAuth($serverKey, '')
            ->post($baseUrl, $body);

            if ($response->successful()) {
                $data = $response->json();
                $invoice->update([
                    'snap_token' => $data['token'],
                    'payment_url' => $data['redirect_url']
                ]);

                return [
                    'token' => $data['token'],
                    'redirect_url' => $data['redirect_url']
                ];
            } else {
                \Illuminate\Support\Facades\Log::error('Midtrans Response Error: ' . $response->body());
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Midtrans Exception Error: ' . $e->getMessage());
        }

        return null;
    }

    public function midtransCallback(Request $request): JsonResponse
    {
        $serverKey = config('services.midtrans.server_key');
        $orderId = $request->input('order_id');
        $statusCode = $request->input('status_code');
        $grossAmount = $request->input('gross_amount');
        $transactionStatus = $request->input('transaction_status');
        $signatureKey = $request->input('signature_key');

        // Verify signature key
        $localSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

        if ($localSignature !== $signatureKey) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid signature key.',
            ], 403);
        }

        // Find invoice
        $parts = explode('-', $orderId);
        if (count($parts) < 3) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid order ID format.',
            ], 400);
        }

        $invoiceNo = implode('-', array_slice($parts, 0, 3));
        $invoice = Invoice::where('invoice_number', $invoiceNo)->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found.',
            ], 404);
        }

        if ($transactionStatus === 'settlement' || $transactionStatus === 'capture') {
            if ($invoice->status !== 'lunas') {
                $invoice->update(['status' => 'lunas']);

                $tx = Transaction::updateOrCreate(
                    ['invoice_id' => $invoice->id],
                    [
                        'user_id'          => $invoice->user_id,
                        'transaction_no'   => 'TX-' . strtoupper(\Illuminate\Support\Str::random(10)),
                        'service'          => $invoice->service,
                        'amount'           => $invoice->amount,
                        'points'           => $invoice->points,
                        'status'           => 'verified',
                        'verified_at'      => now(),
                    ]
                );

                $user = $invoice->user;
                $user->increment('points', $invoice->points);
                $this->updateUserTier($user);
            }
        } elseif (in_array($transactionStatus, ['deny', 'expire', 'cancel'])) {
            $invoice->update(['status' => 'rejected']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Callback processed successfully.',
        ]);
    }

    /**
     * GET /api/member/trips
     * Return user's current trip with details. If none exists, seed a default for demo/testing.
     */
    public function trips(Request $request): JsonResponse
    {
        $user = $request->user();
        $tier = strtolower($user->tier ?? 'bronze');

        // Bronze gets no travel tracking feature
        if ($tier === 'bronze') {
            return response()->json([
                'success' => true,
                'message' => 'Layanan Status Perjalanan Live hanya tersedia untuk member Silver, Gold, dan Platinum. Silakan tingkatkan keanggotaan Anda di menu Beli Membership.',
                'data'    => null,
            ]);
        }

        // Find user's active/waiting/in-progress trip
        $trip = Trip::where('user_id', $user->id)
            ->with('steps')
            ->first();

        // Check if existing trip has a mismatch in step count compared to current tier (e.g. upgraded tier)
        $expectedCount = 5; // platinum
        if ($tier === 'silver') {
            $expectedCount = 2;
        } elseif ($tier === 'gold') {
            $expectedCount = 4;
        }

        if ($trip && $trip->steps->count() !== $expectedCount) {
            $trip->steps()->delete();
            $trip->delete();
            $trip = null;
        }

        // If no trip exists, let's seed a default demo trip based on the user's tier
        if (!$trip) {
            $trip = Trip::create([
                'user_id'     => $user->id,
                'title'       => 'Tiket CGK → DPS • 10 Okt 2026',
                'description' => 'Garuda Indonesia GA-403 • 2 Penumpang (' . ($user->name ?? 'Ahmad Fauzi') . ' & Pasangan)',
                'flight_date' => '2026-10-10',
                'status'      => 'waiting',
            ]);

            // Determine steps based on tier
            $steps = [];

            if ($tier === 'silver') {
                // Silver: Sewa Transportasi ke Bandara & Penerbangan
                $steps = [
                    [
                        'label'      => 'Jemput Rumah',
                        'officer'    => 'Bapak Bagus (Driver)',
                        'time'       => '04:30 WIB',
                        'status'     => 'waiting',
                        'step_order' => 1,
                    ],
                    [
                        'label'      => 'Flight CGK → DPS',
                        'officer'    => 'Captain GA-403 (Pilot)',
                        'time'       => '08:00 WIB',
                        'status'     => 'waiting',
                        'step_order' => 2,
                    ],
                ];
            } elseif ($tier === 'gold') {
                // Gold: Silver + Airport Handling + Jemput Bandara Tujuan
                $steps = [
                    [
                        'label'      => 'Jemput Rumah',
                        'officer'    => 'Bapak Bagus (Driver)',
                        'time'       => '04:30 WIB',
                        'status'     => 'waiting',
                        'step_order' => 1,
                    ],
                    [
                        'label'      => 'Handling CGK',
                        'officer'    => 'Ibu Diana (Airport Handling)',
                        'time'       => '06:00 WIB',
                        'status'     => 'waiting',
                        'step_order' => 2,
                    ],
                    [
                        'label'      => 'Flight CGK → DPS',
                        'officer'    => 'Captain GA-403 (Pilot)',
                        'time'       => '08:00 WIB',
                        'status'     => 'waiting',
                        'step_order' => 3,
                    ],
                    [
                        'label'      => 'Jemput DPS',
                        'officer'    => 'Bapak Ketut (Driver Bali)',
                        'time'       => '11:30 WITA',
                        'status'     => 'waiting',
                        'step_order' => 4,
                    ],
                ];
            } else { // platinum
                // Platinum: Full end-to-end handling
                $steps = [
                    [
                        'label'      => 'Jemput Rumah',
                        'officer'    => 'Bapak Bagus (Driver)',
                        'time'       => '04:30 WIB',
                        'status'     => 'waiting',
                        'step_order' => 1,
                    ],
                    [
                        'label'      => 'Handling CGK',
                        'officer'    => 'Ibu Diana (Airport Handling)',
                        'time'       => '06:00 WIB',
                        'status'     => 'waiting',
                        'step_order' => 2,
                    ],
                    [
                        'label'      => 'Flight CGK → DPS',
                        'officer'    => 'Captain GA-403 (Pilot)',
                        'time'       => '08:00 WIB',
                        'status'     => 'waiting',
                        'step_order' => 3,
                    ],
                    [
                        'label'      => 'Jemput DPS',
                        'officer'    => 'Bapak Ketut (Driver Bali)',
                        'time'       => '11:30 WITA',
                        'status'     => 'waiting',
                        'step_order' => 4,
                    ],
                    [
                        'label'      => 'Check-in Hotel',
                        'officer'    => 'Ibu Putu (Hotel Assistant)',
                        'time'       => '13:00 WITA',
                        'status'     => 'waiting',
                        'step_order' => 5,
                    ],
                ];
            }

            foreach ($steps as $s) {
                $trip->steps()->create($s);
            }

            // Reload trip with steps
            $trip = $trip->fresh('steps');
        }

        return response()->json([
            'success' => true,
            'data'    => $trip,
        ]);
    }
}
