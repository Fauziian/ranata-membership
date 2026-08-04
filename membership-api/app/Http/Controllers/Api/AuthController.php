<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * POST /api/auth/register
     * Daftar member baru
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'      => 'required|string|max:255',
            'email'     => 'required|email|unique:users,email',
            'password'  => 'required|string|min:8|confirmed',
            'phone'     => 'nullable|string|max:20',
            'google_id' => 'nullable|string',
            'avatar'    => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'name'      => $request->name,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'phone'     => $request->phone,
            'role'      => 'customer',
            'tier'      => 'Bronze',
            'points'    => 0,
            'google_id' => $request->google_id,
            'avatar'    => $request->avatar,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil! Selamat bergabung.',
            'data'    => [
                'user'  => $this->formatUser($user),
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * POST /api/auth/login
     * Login dengan email + password
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Email dan password wajib diisi',
                'errors'  => $validator->errors(),
            ], 422);
        }

        if (!Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah',
            ], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data'    => [
                'user'  => $this->formatUser($user),
                'token' => $token,
            ],
        ]);
    }

    /**
     * POST /api/auth/logout
     * Logout & revoke token
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil logout',
        ]);
    }

    /**
     * GET /api/auth/me
     * Get current user profile
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $this->formatUser($request->user()),
        ]);
    }

    public function redirectToGoogle(): JsonResponse
    {
        $clientId = config('services.google.client_id');
        if (empty($clientId) || $clientId === 'your_google_client_id_here') {
            return response()->json([
                'success' => true,
                'data'    => [
                    'url' => url('/api/auth/google/mock'),
                ],
            ]);
        }

        try {
            $url = Socialite::driver('google')
                ->stateless()
                ->redirect()
                ->getTargetUrl();

            return response()->json([
                'success' => true,
                'data'    => [
                    'url' => $url,
                ],
            ]);
        } catch (\Exception $e) {
            // Fallback to mock on any connection or driver exception
            return response()->json([
                'success' => true,
                'data'    => [
                    'url' => url('/api/auth/google/mock'),
                ],
            ]);
        }
    }

    /**
     * GET /api/auth/google/mock
     * Mock Google Login redirect callback
     */
    public function handleGoogleMock(): \Illuminate\Http\RedirectResponse
    {
        $email = 'rifqifauzii.an@gmail.com';
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

        // Check if user exists by email
        $user = User::where('email', $email)->first();

        if ($user) {
            // Check if they registered manually (no google_id)
            if (empty($user->google_id)) {
                return redirect($frontendUrl . '/auth?error=email_exists_manual');
            }

            // Otherwise, login immediately
            $token = $user->createToken('google_auth')->plainTextToken;
            return redirect($frontendUrl . '/auth/callback?token=' . $token . '&role=' . $user->role);
        }

        // If user does not exist: redirect to registration with params
        $name = 'Rifqi Fauzi';
        $googleId = 'mock_google_id_12345';
        $avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

        $query = http_build_query([
            'tab'       => 'register',
            'email'     => $email,
            'name'      => $name,
            'google_id' => $googleId,
            'avatar'    => $avatar,
        ]);

        return redirect($frontendUrl . '/auth?' . $query);
    }

    /**
     * GET /api/auth/google/callback
     * Handle callback dari Google
     */
    public function handleGoogleCallback(): \Illuminate\Http\RedirectResponse
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            return redirect($frontendUrl . '/auth?error=google_failed');
        }

        $email = $googleUser->getEmail();
        $googleId = $googleUser->getId();
        $name = $googleUser->getName();
        $avatar = $googleUser->getAvatar();

        // 1. Check if user exists with google_id
        $user = User::where('google_id', $googleId)->first();

        if ($user) {
            // Login immediately
            $token = $user->createToken('google_auth')->plainTextToken;
            return redirect($frontendUrl . '/auth/callback?token=' . $token . '&role=' . $user->role);
        }

        // 2. Check if user exists with email (registered manually)
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            if (empty($existingUser->google_id)) {
                return redirect($frontendUrl . '/auth?error=email_exists_manual');
            }

            // If google_id was updated/set
            $token = $existingUser->createToken('google_auth')->plainTextToken;
            return redirect($frontendUrl . '/auth/callback?token=' . $token . '&role=' . $existingUser->role);
        }

        // 3. User does not exist: redirect to registration with params
        $query = http_build_query([
            'tab'       => 'register',
            'email'     => $email,
            'name'      => $name,
            'google_id' => $googleId,
            'avatar'    => $avatar,
        ]);

        return redirect($frontendUrl . '/auth?' . $query);
    }

    private function formatUser(User $user): array
    {
        return [
            'id'        => $user->id,
            'member_id' => $user->member_id,
            'name'      => $user->name,
            'email'     => $user->email,
            'phone'     => $user->phone,
            'role'      => $user->role,
            'tier'      => $user->tier,
            'points'    => $user->points,
            'city'      => $user->city,
            'address'   => $user->address,
            'latitude'  => $user->latitude,
            'longitude' => $user->longitude,
            'birthdate' => $user->birthdate,
            'avatar'    => $user->avatar,
        ];
    }
}
