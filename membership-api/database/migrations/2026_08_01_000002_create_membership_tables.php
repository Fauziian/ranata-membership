<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('invoice_number')->unique();
            $table->string('service');
            $table->bigInteger('amount');
            $table->integer('points')->default(0);
            $table->string('status')->default('pending-payment'); // pending-payment|waiting-verification|lunas
            $table->text('detail')->nullable();
            $table->string('proof_path')->nullable(); // upload bukti transfer
            $table->timestamps();
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('transaction_number')->unique();
            $table->foreignId('invoice_id')->nullable()->constrained()->nullOnDelete();
            $table->string('service');
            $table->bigInteger('amount');
            $table->integer('points_earned')->default(0);
            $table->string('status')->default('pending'); // pending|verified|rejected
            $table->string('proof_path')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('rewards', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->integer('points_required');
            $table->string('category');
            $table->string('icon')->default('Star');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('reward_id')->constrained()->onDelete('cascade');
            $table->integer('points_spent');
            $table->string('voucher_code')->unique();
            $table->string('status')->default('active'); // active|used|expired
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('redemptions');
        Schema::dropIfExists('rewards');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('invoices');
    }
};
