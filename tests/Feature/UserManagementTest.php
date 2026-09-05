<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->admin()->create();
        $this->regularUser = User::factory()->create(['role' => 'user']);
    }

    public function test_guest_cannot_access_user_management(): void
    {
        $response = $this->get('/users');
        $response->assertRedirect('/login');
    }

    public function test_regular_user_cannot_access_user_management(): void
    {
        $response = $this->actingAs($this->regularUser)->get('/users');
        $response->assertForbidden();
    }

    public function test_admin_can_view_user_management(): void
    {
        $response = $this->actingAs($this->admin)->get('/users');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('users/index')
            ->has('users.data')
        );
    }

    public function test_admin_can_create_new_user_with_role(): void
    {
        $response = $this->actingAs($this->admin)->post('/users', [
            'name' => 'Operator Satu',
            'email' => 'operator1@example.com',
            'role' => 'user',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'name' => 'Operator Satu',
            'email' => 'operator1@example.com',
            'role' => 'user',
        ]);
    }

    public function test_admin_can_create_new_admin(): void
    {
        $response = $this->actingAs($this->admin)->post('/users', [
            'name' => 'Admin Dua',
            'email' => 'admin2@example.com',
            'role' => 'admin',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'name' => 'Admin Dua',
            'email' => 'admin2@example.com',
            'role' => 'admin',
        ]);
    }

    public function test_admin_can_update_user(): void
    {
        $user = User::factory()->create(['name' => 'Old Name', 'role' => 'user']);

        $response = $this->actingAs($this->admin)->put("/users/{$user->id}", [
            'name' => 'Updated Name',
            'email' => $user->email,
            'role' => 'admin',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
            'role' => 'admin',
        ]);
    }

    public function test_admin_cannot_demote_themselves(): void
    {
        $response = $this->actingAs($this->admin)->put("/users/{$this->admin->id}", [
            'name' => $this->admin->name,
            'email' => $this->admin->email,
            'role' => 'user',
        ]);

        $response->assertRedirect();
        $this->assertEquals('admin', $this->admin->fresh()->role);
    }

    public function test_admin_can_delete_other_user(): void
    {
        $userToDelete = User::factory()->create();

        $response = $this->actingAs($this->admin)->delete("/users/{$userToDelete->id}");
        $response->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $userToDelete->id]);
    }

    public function test_admin_cannot_delete_themselves(): void
    {
        $response = $this->actingAs($this->admin)->delete("/users/{$this->admin->id}");
        $response->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
    }
}
