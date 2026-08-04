<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    protected $fillable = [
        'member_id',
        'sender',
        'text',
        'image_url',
        'time'
    ];

    public function session()
    {
        return $this->belongsTo(ChatSession::class, 'member_id', 'member_id');
    }
}
