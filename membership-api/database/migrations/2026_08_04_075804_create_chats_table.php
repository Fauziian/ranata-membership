<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('chat_sessions', function (Blueprint $table) {
            $table->string('member_id')->primary();
            $table->string('user_name');
            $table->string('user_tier');
            $table->string('active_service')->nullable();
            $table->boolean('is_handled_by_ai')->default(true);
            $table->bigInteger('last_message_time');
            $table->bigInteger('last_admin_reply_time')->nullable();
            $table->timestamps();
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->string('member_id');
            $table->string('sender'); // customer, admin, system
            $table->text('text');
            $table->string('image_url')->nullable();
            $table->string('time');
            $table->timestamps();

            $table->foreign('member_id')->references('member_id')->on('chat_sessions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_sessions');
    }
};
