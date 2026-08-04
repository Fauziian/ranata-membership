<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('member_id')->unique()->nullable()->after('id');
            $table->string('phone')->nullable()->after('email');
            $table->string('role')->default('customer')->after('phone'); // customer | admin
            $table->string('tier')->default('Bronze')->after('role'); // Bronze|Silver|Gold|Platinum
            $table->integer('points')->default(0)->after('tier');
            $table->string('city')->nullable()->after('points');
            $table->string('address')->nullable()->after('city');
            $table->string('birthdate')->nullable()->after('address');
            $table->string('avatar')->nullable()->after('birthdate');
            $table->string('google_id')->nullable()->after('avatar');
            $table->string('google_token')->nullable()->after('google_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'member_id', 'phone', 'role', 'tier', 'points',
                'city', 'address', 'birthdate', 'avatar', 'google_id', 'google_token'
            ]);
        });
    }
};
