<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TripStep extends Model
{
    protected $fillable = [
        'trip_id', 'label', 'officer', 'time', 'status', 'step_order',
    ];

    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }
}
