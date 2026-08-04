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
