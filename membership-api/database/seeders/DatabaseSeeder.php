<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Invoice;
use App\Models\Transaction;
use App\Models\Reward;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        $admin = User::create([
            'name'      => 'Admin Ranata',
            'email'     => 'admin@ranatatour.com',
            'password'  => Hash::make('admin123'),
            'role'      => 'admin',
            'tier'      => 'Platinum',
            'points'    => 0,
            'member_id' => 'ADMIN-001',
            'email_verified_at' => now(),
        ]);

        // Sample customer
        $customer = User::create([
            'name'      => 'Ahmad Fauzi',
            'email'     => 'ahmad@example.com',
            'password'  => Hash::make('password123'),
            'phone'     => '0812-3456-7890',
            'role'      => 'customer',
            'tier'      => 'Platinum',
            'points'    => 12450,
            'city'      => 'Jakarta Selatan',
            'email_verified_at' => now(),
        ]);

        $customer2 = User::create([
            'name'      => 'Siti Rahayu',
            'email'     => 'siti@example.com',
            'password'  => Hash::make('password123'),
            'phone'     => '0813-4567-8901',
            'role'      => 'customer',
            'tier'      => 'Gold',
            'points'    => 7820,
            'email_verified_at' => now(),
        ]);

        // Sample Invoices for Ahmad
        $inv1 = Invoice::create([
            'user_id'        => $customer->id,
            'invoice_number' => 'INV-' . date('Y') . '-001',
            'service'        => 'Paket Umroh Premium — Nov 2026',
            'amount'         => 28500000,
            'points'         => 285,
            'status'         => 'waiting-verification',
            'detail'         => '2 orang dewasa • Keberangkatan 10 Nov 2026 • Makkah & Madinah 12 hari',
        ]);

        $inv2 = Invoice::create([
            'user_id'        => $customer->id,
            'invoice_number' => 'INV-' . date('Y') . '-002',
            'service'        => 'Tiket CGK-DPS 10-15 Okt, 2 orang',
            'amount'         => 2700000,
            'points'         => 27,
            'status'         => 'pending-payment',
            'detail'         => 'Garuda GA-403 • Berangkat 06:30 WIB • Pulang DPS-CGK 18:45 WITA',
        ]);

        // Sample Transactions
        Transaction::create([
            'user_id'            => $customer->id,
            'transaction_number' => 'TRX-001',
            'invoice_id'         => $inv1->id,
            'service'            => 'Paket Umroh Premium',
            'amount'             => 28500000,
            'points_earned'      => 285,
            'status'             => 'pending',
        ]);

        Transaction::create([
            'user_id'            => $customer2->id,
            'transaction_number' => 'TRX-002',
            'service'            => 'Tiket Pesawat CGK-DPS',
            'amount'             => 1250000,
            'points_earned'      => 12,
            'status'             => 'verified',
        ]);

        // Rewards Catalog
        $rewards = [
            ['name' => 'Upgrade Kamar Suite',      'description' => 'Upgrade hotel ke Suite 1 malam di hotel partner',      'points_required' => 1500, 'category' => 'Hotel',     'icon' => 'Hotel'],
            ['name' => 'Transportasi Bandara',      'description' => 'Antar-jemput bandara gratis dengan kendaraan ber-AC',  'points_required' => 500,  'category' => 'Transport', 'icon' => 'Car'],
            ['name' => 'Diskon Tiket 20%',          'description' => 'Potongan 20% pembelian tiket pesawat rute domestik',   'points_required' => 800,  'category' => 'Tiket',     'icon' => 'Plane'],
            ['name' => 'City Tour 1 Hari',          'description' => 'Paket city tour lengkap dengan pemandu wisata profesional', 'points_required' => 1200, 'category' => 'Wisata', 'icon' => 'Globe'],
            ['name' => 'Voucher Kuliner Rp500K',    'description' => 'Voucher makan di 50+ restoran partner di seluruh Indonesia', 'points_required' => 600, 'category' => 'Kuliner', 'icon' => 'Coffee'],
            ['name' => 'Fast Track Dokumen',        'description' => 'Prioritas pengurusan visa & dokumen 2× lebih cepat', 'points_required' => 300,  'category' => 'Dokumen',  'icon' => 'FileText'],
            ['name' => 'Diskon Umroh 10%',          'description' => 'Diskon 10% dari harga paket Umroh reguler 1 orang',  'points_required' => 3000, 'category' => 'Umroh',    'icon' => 'Star'],
            ['name' => 'Lounge Bandara 3×',         'description' => 'Akses Premium Lounge di 8 bandara internasional',    'points_required' => 1800, 'category' => 'Fasilitas', 'icon' => 'Building'],
        ];

        foreach ($rewards as $r) {
            Reward::create(array_merge($r, ['active' => true]));
        }
    }
}
