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
