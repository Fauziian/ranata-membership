<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('description')->nullable();
            $table->date('flight_date');
            $table->string('status')->default('waiting'); // waiting|in-progress|done
            $table->timestamps();
        });

        Schema::create('trip_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trip_id')->constrained()->onDelete('cascade');
            $table->string('label'); // e.g. Jemput Rumah, Handling CGK
            $table->string('officer')->nullable(); // e.g. Bapak Bagus
            $table->string('time')->nullable(); // e.g. 04:30 WIB
            $table->string('status')->default('waiting'); // waiting|in-progress|done
            $table->integer('step_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_steps');
        Schema::dropIfExists('trips');
    }
};
