<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'phone', 'role',
        'tier', 'points', 'member_id', 'city', 'address',
        'birthdate', 'avatar', 'google_id', 'google_token',
    ];

    protected $hidden = [
        'password', 'remember_token', 'google_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'points' => 'integer',
        ];
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function redemptions()
    {
        return $this->hasMany(Redemption::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    // Auto-generate member_id on creation
    protected static function boot()
    {
        parent::boot();
        static::creating(function ($user) {
            if (!$user->member_id && $user->role !== 'admin') {
                $year = date('Y');
                $count = User::where('role', 'customer')->count() + 1;
                $user->member_id = 'RT-' . $year . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
            }
        });
    }
}
