<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reward extends Model
{
    protected $fillable = [
        'name', 'description', 'points_required', 'category', 'icon', 'active',
    ];

    protected $casts = [
        'points_required' => 'integer',
        'active' => 'boolean',
    ];

    public function redemptions()
    {
        return $this->hasMany(Redemption::class);
    }
}
