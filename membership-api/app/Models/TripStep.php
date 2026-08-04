<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TripStep extends Model
{
    protected $fillable = [
        'trip_id', 'label', 'officer', 'time', 'status', 'step_order', 'driver_lat', 'driver_lng',
    ];

    protected $casts = [
        'driver_lat' => 'float',
        'driver_lng' => 'float',
    ];

    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }
}
