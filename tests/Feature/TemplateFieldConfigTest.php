<?php

namespace Tests\Feature;

use App\Models\Template;
use App\Models\TemplateField;
use App\Models\User;
use Database\Seeders\DocumentTemplateSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TemplateFieldConfigTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->admin()->create();
        (new DocumentTemplateSeeder)->run();
    }

    public function test_guest_cannot_access_template_fields_page(): void
    {
        $response = $this->get('/templates/fields');
        $response->assertRedirect('/login');
    }

    public function test_regular_user_cannot_access_template_fields_page(): void
    {
        $regularUser = User::factory()->create(['role' => 'user']);
        $response = $this->actingAs($regularUser)->get('/templates/fields');
        $response->assertForbidden();
    }

    public function test_authenticated_admin_can_view_template_fields_page(): void
    {
        $response = $this->actingAs($this->user)->get('/templates/fields');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('documents/template-fields')
            ->has('templates')
        );
    }

    public function test_user_can_update_single_template_field(): void
    {
        $field = TemplateField::first();
        $this->assertNotNull($field);

        $response = $this->actingAs($this->user)->putJson("/templates/fields/{$field->id}", [
            'default_value' => 'TEST CUSTOM VALUE',
            'max_chars' => 88,
        ]);

        $response->assertOk()
            ->assertJson([
                'status' => 'success',
            ]);

        $field->refresh();
        $this->assertEquals('TEST CUSTOM VALUE', $field->default_value);
        $this->assertEquals(88, $field->max_chars);
    }

    public function test_user_can_bulk_update_template_fields(): void
    {
        $fields = TemplateField::take(3)->get();
        $this->assertCount(3, $fields);

        $payload = [
            'fields' => [
                [
                    'id' => $fields[0]->id,
                    'default_value' => 'VAL 1',
                    'max_chars' => 15,
                ],
                [
                    'id' => $fields[1]->id,
                    'default_value' => 'VAL 2',
                    'max_chars' => 25,
                ],
                [
                    'id' => $fields[2]->id,
                    'default_value' => 'VAL 3',
                    'max_chars' => 35,
                ],
            ],
        ];

        $response = $this->actingAs($this->user)->postJson('/templates/fields/bulk-update', $payload);

        $response->assertOk()
            ->assertJson([
                'status' => 'success',
            ]);

        $this->assertEquals('VAL 1', $fields[0]->fresh()->default_value);
        $this->assertEquals(15, $fields[0]->fresh()->max_chars);
        $this->assertEquals('VAL 2', $fields[1]->fresh()->default_value);
        $this->assertEquals(25, $fields[1]->fresh()->max_chars);
        $this->assertEquals('VAL 3', $fields[2]->fresh()->default_value);
        $this->assertEquals(35, $fields[2]->fresh()->max_chars);
    }

    public function test_user_can_reset_template_fields_to_defaults(): void
    {
        $field = TemplateField::where('field_name', 'nopol')->first();
        $this->assertNotNull($field);

        // Modify field first
        $field->update([
            'default_value' => 'MODIFIED VALUE',
            'max_chars' => 999,
        ]);

        $response = $this->actingAs($this->user)->postJson('/templates/fields/reset-defaults');
        $response->assertOk()
            ->assertJson([
                'status' => 'success',
            ]);

        $resetField = TemplateField::where('field_name', 'nopol')->first();
        $this->assertNotNull($resetField);
        $this->assertEquals('S 1234 WL', $resetField->default_value);
        $this->assertEquals(12, $resetField->max_chars);
    }
}
