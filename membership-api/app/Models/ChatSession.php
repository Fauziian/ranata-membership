<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatSession extends Model
{
    protected $primaryKey = 'member_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'member_id',
        'user_name',
        'user_tier',
        'active_service',
        'is_handled_by_ai',
        'last_message_time',
        'last_admin_reply_time'
    ];

    protected $casts = [
        'is_handled_by_ai' => 'boolean',
        'last_message_time' => 'integer',
        'last_admin_reply_time' => 'integer'
    ];

    public function messages()
    {
        return $this->hasMany(ChatMessage::class, 'member_id', 'member_id');
    }
}
