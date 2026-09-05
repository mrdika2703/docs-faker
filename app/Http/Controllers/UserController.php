<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of users with search and pagination.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));

        $users = User::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString()
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'user',
                'email_verified_at' => $user->email_verified_at?->format('Y-m-d H:i'),
                'created_at' => $user->created_at?->format('Y-m-d H:i'),
                'created_at_human' => $user->created_at?->diffForHumans(),
            ]);

        return Inertia::render('users/index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
            ],
            'currentUserId' => $request->user()->id,
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', 'string', Rule::in(['admin', 'user'])],
            'password' => ['required', 'string', Password::default(), 'confirmed'],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => $validated['password'],
            'email_verified_at' => now(),
        ]);

        return redirect()->back()->with('success', "User '{$validated['name']}' berhasil ditambahkan.");
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['required', 'string', Rule::in(['admin', 'user'])],
            'password' => ['nullable', 'string', Password::default(), 'confirmed'],
        ]);

        if ($user->id === $request->user()->id && $validated['role'] !== 'admin') {
            return redirect()->back()->with('error', 'Anda tidak dapat mengubah role akun admin Anda sendiri.');
        }

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
        ];

        if (! empty($validated['password'])) {
            $userData['password'] = $validated['password'];
        }

        $user->update($userData);

        return redirect()->back()->with('success', "Data user '{$user->name}' berhasil diperbarui.");
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return redirect()->back()->with('error', 'Tidak dapat menghapus akun yang sedang Anda gunakan.');
        }

        $userName = $user->name;
        $user->delete();

        return redirect()->back()->with('success', "User '{$userName}' berhasil dihapus.");
    }
}
