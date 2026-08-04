<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/migrate', function () {
    // Basic protection to prevent running migrations in unauthorized environments
    // The user can pass an optional ?token=... to protect this route or configure a secret.
    if (env('APP_ENV') === 'production' && request('token') !== env('MIGRATION_TOKEN', 'ranata_secret_123')) {
        return response()->json([
            'status' => 'error',
            'message' => 'Unauthorized: Invalid migration token'
        ], 401);
    }

    try {
        \Illuminate\Support\Facades\Artisan::call('migrate --force');
        $output = \Illuminate\Support\Facades\Artisan::output();
        
        if (request()->has('seed')) {
            \Illuminate\Support\Facades\Artisan::call('db:seed --force');
            $output .= "\n" . \Illuminate\Support\Facades\Artisan::output();
        }
        
        return response()->json([
            'status' => 'success',
            'message' => 'Migrations run successfully',
            'output' => $output
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ], 500);
    }
});

Route::get('/test-db', function () {
    return response()->json([
        'drivers' => \PDO::getAvailableDrivers(),
        'env' => [
            'DB_CONNECTION' => env('DB_CONNECTION'),
            'DB_HOST' => env('DB_HOST'),
            'DB_PORT' => env('DB_PORT'),
            'DB_DATABASE' => env('DB_DATABASE'),
            'DB_USERNAME' => env('DB_USERNAME'),
            'APP_DEBUG' => env('APP_DEBUG'),
            'APP_ENV' => env('APP_ENV'),
        ]
    ]);
});

Route::get('/cleanup-database', function () {
    // Basic protection to prevent running cleanup in unauthorized environments
    if (env('APP_ENV') === 'production' && request('token') !== env('MIGRATION_TOKEN', 'ranata_secret_123')) {
        return response()->json([
            'status' => 'error',
            'message' => 'Unauthorized: Invalid migration token'
        ], 401);
    }

    try {
        // Delete related child rows first to avoid foreign key errors
        if (\Schema::hasTable('chat_messages')) {
            \Illuminate\Support\Facades\DB::table('chat_messages')->delete();
        }
        if (\Schema::hasTable('chat_sessions')) {
            \Illuminate\Support\Facades\DB::table('chat_sessions')->delete();
        }
        if (\Schema::hasTable('trip_steps')) {
            \Illuminate\Support\Facades\DB::table('trip_steps')->delete();
        }
        if (\Schema::hasTable('trips')) {
            \Illuminate\Support\Facades\DB::table('trips')->delete();
        }
        
        $deletedTxs = \App\Models\Transaction::query()->delete();
        $deletedInvoices = \App\Models\Invoice::query()->delete();
        $deletedUsers = \App\Models\User::where('role', 'customer')->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Database cleaned successfully',
            'deleted' => [
                'users' => $deletedUsers,
                'transactions' => $deletedTxs,
                'invoices' => $deletedInvoices
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ], 500);
    }
});
