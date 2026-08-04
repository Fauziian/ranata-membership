# Panduan Lengkap: Login/Daftar dengan Google (Next.js + Laravel)

## 1. Gambaran Alur (Flow)

Pola yang paling umum dan aman untuk kombinasi **Next.js (frontend) + Laravel (backend API)** adalah:

```
[User] → klik "Login dengan Google" di Next.js
   ↓
[Next.js] → redirect ke endpoint Laravel: GET /api/auth/google/redirect
   ↓
[Laravel] → redirect ke Google OAuth (accounts.google.com)
   ↓
[User] → login & izinkan akses di halaman Google
   ↓
[Google] → redirect balik ke Laravel: GET /api/auth/google/callback?code=xxxxx
   ↓
[Laravel] → tukar "code" ke Google → dapat data user (email, nama, google_id)
   ↓
[Laravel] → cek/buat user di database → generate token (Sanctum/JWT)
   ↓
[Laravel] → redirect ke Next.js dengan token
   (contoh: https://yourapp.com/auth/callback?token=xxxxx)
   ↓
[Next.js] → simpan token → user berhasil login
```

**Penting:** "code" yang disebutkan di pertanyaan Anda sebelumnya itu ditangani otomatis oleh Laravel (lewat Socialite) — user tidak perlu mengetik kode apa pun.

---

## 2. Setup Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/) → buat project baru (atau pakai yang sudah ada).
2. Masuk ke **APIs & Services → OAuth consent screen** → isi nama aplikasi, email support, dll.
3. Masuk ke **APIs & Services → Credentials → Create Credentials → OAuth Client ID**.
4. Pilih tipe **Web application**.
5. Isi **Authorized redirect URIs** dengan URL callback Laravel, contoh:
   ```
   https://api.domainanda.com/api/auth/google/callback
   ```
   (untuk lokal: `http://localhost:8000/api/auth/google/callback`)
6. Simpan → catat **Client ID** dan **Client Secret**.

---

## 3. Backend: Laravel

### 3.1 Install Socialite

```bash
composer require laravel/socialite
```

### 3.2 Konfigurasi `.env`

```env
GOOGLE_CLIENT_ID=isi_client_id_anda
GOOGLE_CLIENT_SECRET=isi_client_secret_anda
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

FRONTEND_URL=http://localhost:3000
```

### 3.3 Konfigurasi `config/services.php`

```php
'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI'),
],
```

### 3.4 Migration — sesuaikan tabel `users`

Berdasarkan field di profil Anda (Nama, Email, No HP, Tanggal Lahir, Kota Domisili, Alamat, Nomor Member), tambahkan kolom untuk mendukung login Google:

```bash
php artisan make:migration add_google_fields_to_users_table
```

```php
// database/migrations/xxxx_xx_xx_add_google_fields_to_users_table.php
public function up()
{
    Schema::table('users', function (Blueprint $table) {
        $table->string('google_id')->nullable()->unique()->after('id');
        $table->string('provider')->default('local')->after('google_id'); // 'local' atau 'google'
        $table->string('avatar')->nullable()->after('provider');
        $table->string('password')->nullable()->change(); // password jadi opsional
    });
}

public function down()
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['google_id', 'provider', 'avatar']);
    });
}
```

```bash
php artisan migrate
```

> Catatan: kolom `password` harus dibuat **nullable**, karena user yang daftar lewat Google tidak akan pernah mengisi password lokal. Form "Ubah Password" di halaman profil sebaiknya disembunyikan untuk akun dengan `provider = google`.

### 3.5 Install Sanctum (untuk token API)

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

### 3.6 Routes — `routes/api.php`

```php
use App\Http\Controllers\Auth\GoogleAuthController;

Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);
```

### 3.7 Controller

```bash
php artisan make:controller Auth/GoogleAuthController
```

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    // Langkah 1: arahkan user ke halaman login Google
    public function redirect()
    {
        return Socialite::driver('google')
            ->stateless()
            ->redirect();
    }

    // Langkah 2: Google redirect balik ke sini dengan "code"
    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            Log::error('Google OAuth error: ' . $e->getMessage());
            return redirect(env('FRONTEND_URL') . '/login?error=google_auth_failed');
        }

        // Cari user berdasarkan google_id, atau berdasarkan email (jika sudah daftar manual)
        $user = User::where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        if ($user) {
            // Jika user sudah ada tapi belum pernah link dengan Google, link-kan sekarang
            if (!$user->google_id) {
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                ]);
            }
        } else {
            // User baru — buat akun otomatis
            $user = User::create([
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'provider' => 'google',
                'avatar' => $googleUser->getAvatar(),
                'password' => null,
                'email_verified_at' => now(), // email dari Google dianggap sudah terverifikasi
            ]);
        }

        // Generate token Sanctum
        $token = $user->createToken('auth_token')->plainTextToken;

        // Redirect ke frontend Next.js sambil membawa token
        return redirect(env('FRONTEND_URL') . '/auth/callback?token=' . $token);
    }
}
```

### 3.8 Middleware CORS

Pastikan `config/cors.php` mengizinkan domain Next.js Anda:

```php
'allowed_origins' => [env('FRONTEND_URL')],
'supports_credentials' => true,
```

---

## 4. Frontend: Next.js

### 4.1 Tombol "Login dengan Google"

Cukup arahkan browser langsung ke endpoint Laravel — **tidak perlu library Google di frontend** karena semua proses OAuth ditangani backend.

```tsx
// components/GoogleLoginButton.tsx
export default function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google/redirect`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex items-center justify-center gap-2 w-full border rounded-lg py-2 hover:bg-gray-50"
    >
      <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
      Masuk dengan Google
    </button>
  );
}
```

### 4.2 Halaman penerima token — `app/auth/callback/page.tsx`

Ini halaman yang dituju Laravel setelah login Google berhasil.

```tsx
// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      router.replace('/login?error=' + error);
      return;
    }

    if (token) {
      // Simpan token. Untuk keamanan lebih baik, idealnya token
      // disimpan sebagai httpOnly cookie dari sisi server (lihat catatan keamanan di bawah).
      localStorage.setItem('auth_token', token);
      router.replace('/dashboard');
    } else {
      router.replace('/login?error=missing_token');
    }
  }, [searchParams, router]);

  return <p>Memproses login...</p>;
}
```

### 4.3 Contoh pemakaian token untuk request ke API

```tsx
// lib/api.ts
export async function fetchProfile() {
  const token = localStorage.getItem('auth_token');

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) throw new Error('Gagal mengambil profil');
  return res.json();
}
```

### 4.4 Environment variable Next.js — `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 5. Penyesuaian di Halaman Profil (sesuai gambar Anda)

Beberapa hal yang perlu disesuaikan di UI "Data Profil" & "Ubah Password" agar mendukung dua jenis akun:

| Elemen | Akun Manual | Akun Google |
|---|---|---|
| Email | Bisa diedit saat daftar, dikunci setelahnya | Selalu dikunci (ambil dari Google) |
| Section "Ubah Password" | Ditampilkan | **Disembunyikan** (karena `password` = null) |
| Foto profil | Upload manual | Ambil dari `avatar` Google, tapi tetap bisa diganti manual |
| Nomor HP, Tanggal Lahir, Kota, Alamat | Diisi manual | Tetap diisi manual (Google tidak menyediakan data ini) |
| Badge asal akun | - | Tampilkan label kecil "Terhubung dengan Google" |

Contoh logika di frontend:

```tsx
{user.provider === 'local' && (
  <UbahPasswordSection />
)}

{user.provider === 'google' && (
  <p className="text-sm text-gray-500">
    Akun ini terhubung dengan Google. Password tidak digunakan.
  </p>
)}
```

---

## 6. Catatan Keamanan Penting

1. **Jangan taruh token sensitif di URL production tanpa proteksi tambahan.** Redirect dengan `?token=xxx` mudah diimplementasikan tapi berisiko token tersimpan di history browser / log server. Alternatif yang lebih aman:
   - Laravel set token sebagai **httpOnly cookie** langsung saat redirect (tidak lewat query string), lalu Next.js middleware membaca sesi dari cookie tersebut.
   - Atau gunakan **short-lived one-time code**: Laravel redirect dengan kode acak sekali pakai, lalu Next.js langsung tukar kode itu ke endpoint lain untuk dapat token asli (mirip pola "authorization code" tapi versi Anda sendiri).
2. Selalu pakai **HTTPS** di production untuk seluruh alur ini.
3. Set `SESSION_DRIVER` dan `stateless()` di Socialite dengan konsisten — karena request redirect dan callback biasanya lintas domain (Next.js di domain A, Laravel di domain B).
4. Validasi email dari Google (`getEmail()`) tidak kosong sebelum dipakai untuk pencocokan akun.
5. Pertimbangkan rate limiting di endpoint `/auth/google/callback` untuk mencegah penyalahgunaan.

---

## 7. Ringkasan Endpoint yang Dibutuhkan

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/auth/google/redirect` | Arahkan user ke Google |
| GET | `/api/auth/google/callback` | Terima balasan dari Google, buat/link user, redirect ke frontend |
| GET | `/api/user/profile` | Ambil data profil user yang sedang login (pakai token) |

Alur ini bisa berjalan **berdampingan** dengan sistem login/daftar manual yang sudah ada — user bebas pilih salah satu, dan sistem otomatis menghubungkan akun berdasarkan kecocokan email.
