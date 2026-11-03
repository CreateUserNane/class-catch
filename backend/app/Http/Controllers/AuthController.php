<?php

namespace App\Http\Controllers;

use Closure;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const COMMON_MISTYPED_EMAIL_DOMAINS = [
        'gnail.com', 'gmai.com', 'gmal.com', 'gmial.com', 'gmail.con', 'gmail.cmo', 'gmail.comm', 'gmail.coms',
        'yaho.com', 'yahoo.con', 'yahoo.comm', 'outlok.com', 'outlook.con', 'hotmial.com', 'hotmail.con',
    ];

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'string', 'email:rfc,dns', 'max:255', 'unique:users,email',
                function (string $attribute, mixed $value, Closure $fail): void {
                    $domain = strtolower(substr(strrchr((string) $value, '@') ?: '', 1));
                    if (in_array($domain, self::COMMON_MISTYPED_EMAIL_DOMAINS, true)) {
                        $fail('Please check the spelling of your email domain.');
                    }
                },
            ],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => ['required', 'in:teacher,student'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'],
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}
