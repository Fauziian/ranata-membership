<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ChatController;
use Illuminate\Support\Facades\Route;

// ─── Public Routes (No Auth) ─────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('register',         [AuthController::class, 'register']);
    Route::post('login',            [AuthController::class, 'login']);
    Route::get('google',            [AuthController::class, 'redirectToGoogle']);
    Route::get('google/callback',   [AuthController::class, 'handleGoogleCallback']);
    Route::get('google/mock',       [AuthController::class, 'handleGoogleMock']);
});

// ─── Midtrans Callback Route ──────────────────────────────────────────────────
Route::post('payment/midtrans/callback', [MemberController::class, 'midtransCallback']);

// ─── Authenticated Routes ─────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me',      [AuthController::class, 'me']);

    // ── Member Routes ─────────────────────────────────────────────────────────
    Route::prefix('member')->group(function () {
        Route::get('profile',                    [MemberController::class, 'profile']);
        Route::put('profile',                    [MemberController::class, 'updateProfile']);
        Route::post('upgrade',                   [MemberController::class, 'upgrade']);
        Route::get('invoices',                   [MemberController::class, 'invoices']);
        Route::post('invoices/{id}/pay',         [MemberController::class, 'payInvoice']);
        Route::post('invoices/{id}/cancel',      [MemberController::class, 'cancelInvoice']);
        Route::post('invoices/{id}/process-payment', [MemberController::class, 'processPayment']);
        Route::get('transactions',               [MemberController::class, 'transactions']);
        Route::get('rewards',                    [MemberController::class, 'rewards']);
        Route::post('rewards/{id}/redeem',       [MemberController::class, 'redeemReward']);
        Route::get('trips',                      [MemberController::class, 'trips']);

        // Chat routes
        Route::get('chat',                       [ChatController::class, 'getMemberChat']);
        Route::post('chat',                      [ChatController::class, 'sendMemberMessage']);
        Route::post('chat/select-service',       [ChatController::class, 'selectService']);
    });

    // ── Admin Routes ──────────────────────────────────────────────────────────
    Route::middleware('App\Http\Middleware\AdminMiddleware')->prefix('admin')->group(function () {
        Route::get('stats',                              [AdminController::class, 'stats']);
        Route::get('members',                            [AdminController::class, 'members']);
        Route::put('members/{id}',                       [AdminController::class, 'updateMember']);
        Route::get('transactions',                       [AdminController::class, 'transactions']);
        Route::put('transactions/{id}/verify',           [AdminController::class, 'verifyTransaction']);
        Route::get('rewards',                            [AdminController::class, 'rewards']);
        Route::post('rewards',                           [AdminController::class, 'storeReward']);
        Route::put('rewards/{id}',                       [AdminController::class, 'updateReward']);
        Route::delete('rewards/{id}',                    [AdminController::class, 'deleteReward']);
        Route::get('trips',                              [AdminController::class, 'trips']);
        Route::put('trip-steps/{id}/status',             [AdminController::class, 'updateStepStatus']);

        // Chat routes
        Route::get('chats',                      [ChatController::class, 'getAdminChats']);
        Route::get('chats/{member_id}',          [ChatController::class, 'getAdminChatSession']);
        Route::post('chats/{member_id}/message', [ChatController::class, 'sendAdminMessage']);
        Route::post('chats/{member_id}/toggle-ai', [ChatController::class, 'toggleAI']);
        Route::post('chats/{member_id}/simulate-idle', [ChatController::class, 'simulateIdle']);
    });
});
