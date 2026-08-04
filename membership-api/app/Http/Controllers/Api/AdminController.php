<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Transaction;
use App\Models\Invoice;
use App\Models\Reward;
use App\Models\Trip;
use App\Models\TripStep;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    /**
     * GET /api/admin/members
     */
    public function members(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $query  = User::where('role', 'customer');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('member_id', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $members = $query->latest()->get()->map(fn($m) => [
            'id'        => $m->id,
            'member_id' => $m->member_id,
            'name'      => $m->name,
            'email'     => $m->email,
            'phone'     => $m->phone,
            'tier'      => $m->tier,
            'points'    => $m->points,
            'status'    => $m->email_verified_at ? 'Active' : 'Inactive',
            'joined'    => $m->created_at->format('M Y'),
        ]);

        return response()->json([
            'success' => true,
            'data'    => $members,
        ]);
    }

    /**
     * GET /api/admin/transactions
     */
    public function transactions(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $query  = Transaction::with('user');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        $txs = $query->latest()->get()->map(fn($t) => [
            'id'                 => $t->id,
            'transaction_number' => $t->transaction_number,
            'member'             => $t->user?->name ?? 'Unknown',
            'member_id'          => $t->user?->member_id,
            'service'            => $t->service,
            'amount'             => $t->amount,
            'formatted_amount'   => 'Rp ' . number_format($t->amount, 0, ',', '.'),
            'points'             => $t->points_earned,
            'status'             => $t->status,
            'proof_url'          => $t->proof_path ? asset('storage/' . $t->proof_path) : null,
            'date'               => $t->created_at->translatedFormat('d M Y'),
        ]);

        return response()->json([
            'success' => true,
            'data'    => $txs,
        ]);
    }

    /**
     * PUT /api/admin/transactions/{id}/verify
     */
    public function verifyTransaction(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:verified,rejected',
            'notes'  => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $tx = Transaction::with('user', 'invoice')->findOrFail($id);

        $tx->update([
            'status' => $request->status,
            'notes'  => $request->notes,
        ]);

        // Update linked invoice status
        if ($tx->invoice) {
            $invStatus = $request->status === 'verified' ? 'lunas' : 'pending-payment';
            $tx->invoice->update(['status' => $invStatus]);
        }

        // Add points to member if verified
        if ($request->status === 'verified' && $tx->user) {
            $tx->user->increment('points', $tx->points_earned);
            
            // Check if this transaction is for a membership upgrade
            if (str_contains($tx->service, 'Membership Silver')) {
                $tx->user->update(['tier' => 'Silver']);
            } elseif (str_contains($tx->service, 'Membership Gold')) {
                $tx->user->update(['tier' => 'Gold']);
            } elseif (str_contains($tx->service, 'Membership Platinum')) {
                $tx->user->update(['tier' => 'Platinum']);
            } else {
                // Update tier based on total points
                $this->updateUserTier($tx->user->fresh());
            }
        }

        return response()->json([
            'success' => true,
            'message' => $request->status === 'verified'
                ? "Transaksi diverifikasi. +{$tx->points_earned} poin ditambahkan ke {$tx->user?->name}."
                : 'Transaksi ditolak.',
        ]);
    }

    /**
     * GET /api/admin/rewards
     */
    public function rewards(): JsonResponse
    {
        $rewards = Reward::latest()->get()->map(fn($r) => [
            'id'       => $r->id,
            'name'     => $r->name,
            'desc'     => $r->description,
            'points'   => $r->points_required,
            'category' => $r->category,
            'icon'     => $r->icon,
            'active'   => $r->active,
        ]);

        return response()->json(['success' => true, 'data' => $rewards]);
    }

    /**
     * POST /api/admin/rewards
     */
    public function storeReward(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'            => 'required|string|max:255',
            'description'     => 'required|string',
            'points_required' => 'required|integer|min:1',
            'category'        => 'required|string',
            'icon'            => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $reward = Reward::create([
            'name'            => $request->name,
            'description'     => $request->description,
            'points_required' => $request->points_required,
            'category'        => $request->category,
            'icon'            => $request->icon ?? 'Star',
            'active'          => true,
        ]);

        return response()->json(['success' => true, 'data' => $reward], 201);
    }

    /**
     * PUT /api/admin/rewards/{id}
     */
    public function updateReward(Request $request, int $id): JsonResponse
    {
        $reward = Reward::findOrFail($id);
        $reward->update($request->only(['name', 'description', 'points_required', 'category', 'icon', 'active']));

        return response()->json(['success' => true, 'message' => 'Reward diperbarui', 'data' => $reward]);
    }

    /**
     * DELETE /api/admin/rewards/{id}
     */
    public function deleteReward(int $id): JsonResponse
    {
        Reward::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Reward dihapus']);
    }

    /**
     * GET /api/admin/stats (overview dashboard)
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'total_members'   => User::where('role', 'customer')->count(),
                'pending_verify'  => Transaction::where('status', 'pending')->count(),
                'total_rewards'   => Reward::where('active', true)->count(),
                'total_points'    => User::where('role', 'customer')->sum('points'),
                'recent_txs'      => Transaction::with('user')->latest()->limit(5)->get()->map(fn($t) => [
                    'id'               => $t->id,
                    'member'           => $t->user?->name,
                    'service'          => $t->service,
                    'formatted_amount' => 'Rp ' . number_format($t->amount, 0, ',', '.'),
                    'points'           => $t->points_earned,
                    'status'           => $t->status,
                ]),
            ],
        ]);
    }

    private function updateUserTier(User $user): void
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

    /**
     * GET /api/admin/trips
     */
    public function trips(Request $request): JsonResponse
    {
        $trips = Trip::with(['user', 'steps'])->latest()->get();
        return response()->json([
            'success' => true,
            'data'    => $trips,
        ]);
    }

    /**
     * PUT /api/admin/trip-steps/{id}/status
     */
    public function updateStepStatus(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:waiting,in-progress,done',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $step = TripStep::findOrFail($id);
        $step->update(['status' => $request->status]);

        // Automatically update the main Trip status based on steps
        $trip = $step->trip;
        $allSteps = $trip->steps;

        $overallStatus = 'waiting';
        
        $allDone = true;
        $anyProgress = false;

        foreach ($allSteps as $s) {
            if ($s->status !== 'done') {
                $allDone = false;
            }
            if ($s->status === 'in-progress' || $s->status === 'done') {
                $anyProgress = true;
            }
        }

        if ($allDone) {
            $overallStatus = 'done';
        } elseif ($anyProgress) {
            $overallStatus = 'in-progress';
        }

        $trip->update(['status' => $overallStatus]);

        return response()->json([
            'success' => true,
            'message' => 'Status tahapan perjalanan berhasil diperbarui.',
            'data'    => $trip->fresh('steps'),
        ]);
    }
}
