<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatSession;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ChatController extends Controller
{
    private function getInitMessages($userName): array
    {
        return [
            [
                'sender' => 'admin',
                'text' => 'Selamat datang di Ranata Tour! Saya Rina, siap membantu Anda. Ada yang bisa kami bantu hari ini?',
                'time' => date('H:i'),
            ]
        ];
    }

    /**
     * GET /api/member/chat
     */
    public function getMemberChat(Request $request): JsonResponse
    {
        $user = $request->user();
        $memberId = $user->member_id ?? 'RT-XXXX-XXX';

        $session = ChatSession::with('messages')->find($memberId);

        if (!$session) {
            $session = ChatSession::create([
                'member_id'             => $memberId,
                'user_name'             => $user->name,
                'user_tier'             => $user->tier ?? 'Bronze',
                'active_service'        => null,
                'is_handled_by_ai'      => true,
                'last_message_time'     => round(microtime(true) * 1000),
                'last_admin_reply_time' => null,
            ]);

            $initMsgs = $this->getInitMessages($user->name);
            foreach ($initMsgs as $m) {
                $session->messages()->create([
                    'sender'    => $m['sender'],
                    'text'      => $m['text'],
                    'time'      => $m['time'],
                ]);
            }

            // Reload session with newly created messages
            $session = ChatSession::with('messages')->find($memberId);
        } else {
            // Update user details if changed
            $session->update([
                'user_name' => $user->name,
                'user_tier' => $user->tier ?? 'Bronze',
            ]);
        }

        return response()->json([
            'success' => true,
            'data'    => $session,
        ]);
    }

    /**
     * Generate context-aware AI response based on user inquiry text
     */
    private function generateAiResponse(string $userText, string $userName): string
    {
        $lowerText = strtolower($userText);
        $nameParts = explode(' ', $userName);
        $firstName = $nameParts[0];

        $reply = "";

        // 1. Greetings
        if (str_contains($lowerText, 'sore')) {
            $reply = "Selamat Sore Bapak / Ibu {$firstName}, ada yang bisa kami bantu?";
        } elseif (str_contains($lowerText, 'pagi')) {
            $reply = "Selamat Pagi Bapak / Ibu {$firstName}, ada yang bisa kami bantu?";
        } elseif (str_contains($lowerText, 'siang')) {
            $reply = "Selamat Siang Bapak / Ibu {$firstName}, ada yang bisa kami bantu?";
        } elseif (str_contains($lowerText, 'malam')) {
            $reply = "Selamat Malam Bapak / Ibu {$firstName}, ada yang bisa kami bantu?";
        } elseif (str_contains($lowerText, 'halo') || str_contains($lowerText, 'hai') || str_contains($lowerText, 'helo') || str_contains($lowerText, 'assalamualaikum') || str_contains($lowerText, 'permisi') || str_contains($lowerText, 'p ')) {
            $reply = "Halo Bapak / Ibu {$firstName}! Ada yang bisa kami bantu hari ini?";
        }
        
        // 2. Check Ranata Tour info
        elseif (str_contains($lowerText, 'ranata') || str_contains($lowerText, 'profil') || str_contains($lowerText, 'siapa') || str_contains($lowerText, 'tentang')) {
            $reply = "Ranata Tour & Travel adalah agen perjalanan premium tepercaya dengan pengalaman lebih dari 15 tahun dan telah melayani 10,000+ member aktif ke 50+ destinasi global. Kami menyediakan penjemputan dari rumah, airport handling, dan check-in hotel yang mulus agar perjalanan Anda nyaman tanpa hambatan.";
        }
        
        // 3. Check membership packages / tier / benefits
        elseif (str_contains($lowerText, 'member') || str_contains($lowerText, 'tier') || str_contains($lowerText, 'benefit') || str_contains($lowerText, 'keuntungan') || str_contains($lowerText, 'paket') || str_contains($lowerText, 'silver') || str_contains($lowerText, 'gold') || str_contains($lowerText, 'platinum')) {
            $reply = "Ranata Tour memiliki 3 tier membership eksklusif:\n" .
                     "1. **Silver** (Rp 2.500.000/tahun): Termasuk sewa transportasi ke bandara, 24/7 chat support, & welcome bonus 500 poin.\n" .
                     "2. **Gold** (Rp 5.000.000/tahun): Semua benefit Silver + Airport Handling (check-in & boarding), penjemputan bandara tujuan, & diskon 10% semua layanan.\n" .
                     "3. **Platinum** (Rp 10.000.000/tahun): Semua benefit Gold + Penjemputan dari rumah, full handling bandara & hotel (check-in hotel diurus tim), personal consultant, & diskon 15% semua layanan.";
        }
        
        // 4. Check points / reward
        elseif (str_contains($lowerText, 'poin') || str_contains($lowerText, 'reward') || str_contains($lowerText, 'tukar') || str_contains($lowerText, 'hadiah')) {
            $reply = "Setiap transaksi di Ranata Tour menghasilkan poin reward yang terkumpul di dashboard. Poin ini dapat ditukarkan dengan berbagai rewards eksklusif, seperti upgrade kamar suite hotel, airport transfer gratis, diskon tiket pesawat, Fast Track dokumen perjalanan, hingga potongan harga paket Umroh!";
        }

        // 5. Check contact info / address
        elseif (str_contains($lowerText, 'kontak') || str_contains($lowerText, 'alamat') || str_contains($lowerText, 'lokasi') || str_contains($lowerText, 'kantor') || str_contains($lowerText, 'nomor') || str_contains($lowerText, 'telepon') || str_contains($lowerText, 'email') || str_contains($lowerText, 'cs')) {
            $reply = "Kantor Ranata Tour berlokasi di Jl. Sudirman No. 45, Jakarta Pusat. Anda juga dapat menghubungi kami via telepon di (021) 5555-7890 atau email ke info@ranatatour.co.id.";
        }

        // 6. Check flight ticket / pesawat
        elseif (str_contains($lowerText, 'pesawat') || str_contains($lowerText, 'tiket') || str_contains($lowerText, 'flight') || str_contains($lowerText, 'terbang') || str_contains($lowerText, 'maskapai')) {
            $reply = "Tentu Bapak/Ibu {$firstName}, kami siap membantu pemesanan tiket pesawat domestik maupun internasional. Silakan infokan kota keberangkatan, kota tujuan, tanggal keberangkatan, serta jumlah penumpang agar kami carikan opsi terbaik.";
        }
        
        // 7. Check hotel / villa / stay
        elseif (str_contains($lowerText, 'hotel') || str_contains($lowerText, 'villa') || str_contains($lowerText, 'menginap') || str_contains($lowerText, 'penginapan') || str_contains($lowerText, 'kamar')) {
            $reply = "Tentu Bapak/Ibu {$firstName}, kami dapat membantu mencarikan hotel & villa terbaik bintang 1-5 sesuai budget Anda. Silakan infokan kota tujuan, tanggal check-in & check-out, jumlah kamar, serta perkiraan budget Anda.";
        }
        
        // 8. Check transport / vehicle
        elseif (str_contains($lowerText, 'sewa') || str_contains($lowerText, 'mobil') || str_contains($lowerText, 'bus') || str_contains($lowerText, 'minibus') || str_contains($lowerText, 'transport') || str_contains($lowerText, 'kendaraan') || str_contains($lowerText, 'sopir') || str_contains($lowerText, 'driver')) {
            $reply = "Ranata Tour menyediakan sewa kendaraan (mobil, minibus, bus pariwisata) lengkap dengan driver profesional. Silakan beri tahu kami tanggal sewa, jenis kendaraan yang diinginkan, serta rute penjemputan & tujuan Anda.";
        }
        
        // 9. Check visa / documents
        elseif (str_contains($lowerText, 'visa') || str_contains($lowerText, 'paspor') || str_contains($lowerText, 'passport') || str_contains($lowerText, 'dokumen') || str_contains($lowerText, 'asuransi')) {
            $reply = "Kami melayani pengurusan dokumen perjalanan seperti paspor baru/perpanjangan, visa kunjungan ke berbagai negara, serta asuransi perjalanan. Silakan infokan jenis dokumen yang ingin Anda urus.";
        }
        
        // 10. Check Umroh
        elseif (str_contains($lowerText, 'umroh') || str_contains($lowerText, 'umrah') || str_contains($lowerText, 'ibadah') || str_contains($lowerText, 'makkah') || str_contains($lowerText, 'madinah')) {
            $reply = "Kami menyediakan paket Umroh Regular & Premium dengan fasilitas hotel dekat Masjidil Haram. Boleh kami tahu rencana bulan keberangkatan Anda dan jumlah jamaah yang ikut serta?";
        }
        
        // 11. Check Wisata / Holiday / Paket Tour
        elseif (str_contains($lowerText, 'wisata') || str_contains($lowerText, 'liburan') || str_contains($lowerText, 'tour') || str_contains($lowerText, 'jalan-jalan') || str_contains($lowerText, 'destinasi')) {
            $reply = "Kami menawarkan berbagai paket wisata menarik baik domestik (Bali, Lombok, Labuan Bajo) maupun mancanegara (Asia, Eropa). Silakan beri tahu destinasi impian Anda, durasi liburan, dan jumlah peserta.";
        }
        
        // 12. Check payment / billing
        elseif (str_contains($lowerText, 'bayar') || str_contains($lowerText, 'tagihan') || str_contains($lowerText, 'invoice') || str_contains($lowerText, 'qris') || str_contains($lowerText, 'va') || str_contains($lowerText, 'virtual account') || str_contains($lowerText, 'midtrans')) {
            $reply = "Untuk pembayaran, Anda dapat membayar tagihan/invoice langsung melalui menu 'Tagihan & Bayar' di dashboard Anda via Virtual Account (VA) atau QRIS melalui Midtrans.";
        }

        // 13. Context check for prices/budget/details
        elseif (str_contains($lowerText, 'budget') || str_contains($lowerText, 'harga') || str_contains($lowerText, 'rp') || preg_match('/[0-9]+/', $lowerText)) {
            $reply = "Baik Bapak/Ibu {$firstName}, budget/rincian Anda telah kami catat. Kami akan segera menyusun penawaran terbaik yang sesuai dengan detail tersebut. Mohon tunggu informasi selanjutnya dari tim kami.";
        }

        // Fallback
        else {
            $reply = "Terima kasih atas pesan Anda! Sebagai AI Agent Ranata Tour, saya siap membantu. Boleh kami tahu lebih detail mengenai rencana perjalanan, pemesanan tiket, hotel, atau informasi membership yang ingin Anda tanyakan?";
        }

        // Append the AI banner request by the user
        return $reply . "\n\n( Balasan otomatis oleh AI Agent. Jika ingin jawaban lebih spesifik dari pihak Ranata, silakan tunggu beberapa saat hingga Admin mengambil alih percakapan. )";
    }

    /**
     * POST /api/member/chat
     */
    public function sendMemberMessage(Request $request): JsonResponse
    {
        $user = $request->user();
        $memberId = $user->member_id ?? 'RT-XXXX-XXX';

        $validator = Validator::make($request->all(), [
            'text'      => 'required_without:image_url|string',
            'image_url' => 'nullable|string',
            'time'      => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $session = ChatSession::findOrFail($memberId);

        $msg = $session->messages()->create([
            'sender'    => 'customer',
            'text'      => $request->input('text') ?? '',
            'image_url' => $request->input('image_url'),
            'time'      => $request->input('time'),
        ]);

        $session->update([
            'last_message_time' => round(microtime(true) * 1000),
        ]);

        // Trigger AI Agent auto-reply if enabled
        if ($session->is_handled_by_ai) {
            $aiTime = date('H:i');
            $aiText = $this->generateAiResponse($request->input('text') ?? '', $user->name);
            $session->messages()->create([
                'sender' => 'admin',
                'text'   => $aiText,
                'time'   => $aiTime,
            ]);
        }

        return response()->json([
            'success' => true,
            'data'    => ChatSession::with('messages')->find($memberId),
        ]);
    }

    /**
     * POST /api/member/chat/select-service
     */
    public function selectService(Request $request): JsonResponse
    {
        $user = $request->user();
        $memberId = $user->member_id ?? 'RT-XXXX-XXX';

        $validator = Validator::make($request->all(), [
            'service' => 'required|string',
            'time'    => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $session = ChatSession::findOrFail($memberId);
        $service = $request->input('service');

        $session->messages()->create([
            'sender' => 'customer',
            'text'   => "Saya ingin request layanan: {$service}",
            'time'   => $request->input('time'),
        ]);

        $session->update([
            'active_service'    => $service,
            'last_message_time' => round(microtime(true) * 1000),
        ]);

        if ($session->is_handled_by_ai) {
            $firstName = explode(' ', $user->name)[0];
            $aiTime = date('H:i');
            $session->messages()->create([
                'sender' => 'admin',
                'text'   => "Baik Kak {$firstName}! Silakan kirimkan detail untuk request \"{$service}\" Anda (seperti tanggal keberangkatan, jumlah orang, kota tujuan, kelas maskapai/bintang hotel, dll). Tim kami akan segera mencarikan opsi terbaik untuk Anda.",
                'time'   => $aiTime,
            ]);
        }

        return response()->json([
            'success' => true,
            'data'    => ChatSession::with('messages')->find($memberId),
        ]);
    }

    /**
     * GET /api/admin/chats
     */
    public function getAdminChats(Request $request): JsonResponse
    {
        // Load all sessions ordered by last message time descending
        $sessions = ChatSession::with('messages')
            ->orderBy('last_message_time', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $sessions,
        ]);
    }

    /**
     * GET /api/admin/chats/{member_id}
     */
    public function getAdminChatSession(string $memberId): JsonResponse
    {
        $session = ChatSession::with('messages')->findOrFail($memberId);
        return response()->json([
            'success' => true,
            'data'    => $session,
        ]);
    }

    /**
     * POST /api/admin/chats/{member_id}/message
     */
    public function sendAdminMessage(Request $request, string $memberId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'text' => 'required|string',
            'time' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $session = ChatSession::findOrFail($memberId);

        $msg = $session->messages()->create([
            'sender' => 'admin',
            'text'   => $request->input('text'),
            'time'   => $request->input('time'),
        ]);

        $session->update([
            'is_handled_by_ai'      => false, // Turn off AI manually
            'last_admin_reply_time' => round(microtime(true) * 1000),
            'last_message_time'     => round(microtime(true) * 1000),
        ]);

        return response()->json([
            'success' => true,
            'data'    => ChatSession::with('messages')->find($memberId),
        ]);
    }

    /**
     * POST /api/admin/chats/{member_id}/toggle-ai
     */
    public function toggleAI(Request $request, string $memberId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'is_handled_by_ai' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $session = ChatSession::findOrFail($memberId);
        $setAI = (bool) $request->input('is_handled_by_ai');

        $session->update([
            'is_handled_by_ai' => $setAI,
        ]);

        $timeStr = date('H:i');
        $session->messages()->create([
            'sender' => 'system',
            'text'   => $setAI 
                ? '🤖 Kontrol dikembalikan ke AI Agent.' 
                : '👤 Admin mengambil alih percakapan secara manual.',
            'time'   => $timeStr,
        ]);

        return response()->json([
            'success' => true,
            'data'    => ChatSession::with('messages')->find($memberId),
        ]);
    }

    /**
     * POST /api/admin/chats/{member_id}/simulate-idle
     */
    public function simulateIdle(string $memberId): JsonResponse
    {
        $session = ChatSession::findOrFail($memberId);
        $timeStr = date('H:i');

        $session->update([
            'is_handled_by_ai'  => true,
            // Force last_message_time back 1 hour (3600000 ms)
            'last_message_time' => round(microtime(true) * 1000) - 3600000 - 1000,
        ]);

        $session->messages()->create([
            'sender' => 'system',
            'text'   => '🤖 AI Agent diaktifkan kembali otomatis karena tidak ada respons admin dalam 1 jam (Simulasi).',
            'time'   => $timeStr,
        ]);

        return response()->json([
            'success' => true,
            'data'    => ChatSession::with('messages')->find($memberId),
        ]);
    }
}
