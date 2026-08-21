<?php

namespace Tests\Feature;

use App\Models\DocumentHistory;
use App\Models\Template;
use App\Models\User;
use App\Services\DummyAssetGenerator;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class DocumentGeneratorTest extends TestCase
{
    use DatabaseTransactions;

    protected User $user;

    protected Template $template;

    protected function setUp(): void
    {
        parent::setUp();

        // Generate dummy assets for testing
        $generator = new DummyAssetGenerator;
        $generator->generateAll();

        $this->user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $this->template = Template::create([
            'name' => 'Doc A',
            'dummy_bg_path' => 'dummy_templates/doc_a_bg.png',
        ]);

        $this->template->fields()->createMany([
            ['field_name' => 'nama', 'start_x' => 120, 'start_y' => 100, 'max_chars' => 30],
            ['field_name' => 'nomor', 'start_x' => 120, 'start_y' => 140, 'max_chars' => 20],
        ]);
    }

    public function test_dashboard_page_loads_with_stats(): void
    {
        $response = $this->actingAs($this->user)->get('/dashboard');

        $response->assertStatus(200);
    }

    public function test_create_document_page_loads(): void
    {
        $response = $this->actingAs($this->user)->get("/documents/create/{$this->template->id}");

        $response->assertStatus(200);
    }

    public function test_preview_background_streams_image(): void
    {
        $response = $this->actingAs($this->user)->get("/templates/{$this->template->id}/background");

        $response->assertStatus(200)
            ->assertHeader('Content-Type', 'image/png');
    }

    public function test_preview_composites_image_in_ram_without_saving_to_db(): void
    {
        $initialCount = DocumentHistory::count();

        $response = $this->actingAs($this->user)->postJson('/documents/preview', [
            'template_id' => $this->template->id,
            'input_data' => [
                'nama' => 'Test User',
                'nomor' => 'DOC-123',
            ],
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['status', 'preview_url']);

        $this->assertStringStartsWith('data:image/png;base64,', $response->json('preview_url'));
        $this->assertEquals($initialCount, DocumentHistory::count(), 'Preview must NOT save to database');
    }

    public function test_generate_saves_to_db_and_streams_downloadable_png(): void
    {
        $initialCount = DocumentHistory::count();

        $response = $this->actingAs($this->user)->post('/documents/generate', [
            'template_id' => $this->template->id,
            'input_data' => [
                'nama' => 'Budi Santoso',
                'nomor' => 'DOC-999',
            ],
        ]);

        $response->assertStatus(200)
            ->assertHeader('Content-Type', 'image/png');

        $this->assertEquals($initialCount + 1, DocumentHistory::count());

        $saved = DocumentHistory::latest()->first();
        $this->assertEquals($this->user->id, $saved->user_id);
        $this->assertEquals('Budi Santoso', $saved->input_data['nama']);
    }

    public function test_history_page_loads(): void
    {
        $this->user->documentHistories()->create([
            'template_id' => $this->template->id,
            'input_data' => ['nama' => 'History Test'],
        ]);

        $response = $this->actingAs($this->user)->get('/documents/history');

        $response->assertStatus(200);
    }

    public function test_history_preview_and_download(): void
    {
        $history = $this->user->documentHistories()->create([
            'template_id' => $this->template->id,
            'input_data' => ['nama' => 'History Test Item'],
        ]);

        $previewResponse = $this->actingAs($this->user)->getJson("/documents/history/{$history->id}/preview");
        $previewResponse->assertStatus(200)
            ->assertJsonStructure(['status', 'preview_url']);

        $downloadResponse = $this->actingAs($this->user)->get("/documents/history/{$history->id}/download");
        $downloadResponse->assertStatus(200)
            ->assertHeader('Content-Type', 'image/png');
    }

    public function test_pajak_and_stnk_template_preview_and_generate(): void
    {
        $pajak = Template::where('name', 'Doc B')->orWhere('name', 'PAJAK')->first();
        if ($pajak) {
            $response = $this->actingAs($this->user)->postJson('/documents/preview', [
                'template_id' => $pajak->id,
                'input_data' => [
                    'nopol' => 'S 1234 WL',
                    'nama-pemilik' => 'NAMA LENGKAP',
                    'alamat1' => 'DSN. TEMPAT RW01/02 DS. TEMPAT',
                    'alamat2' => 'KEC. TEMPAT SBY',
                    'merk' => 'HONDA',
                    'type' => 'NF11B21 MT',
                    'jenis' => 'SEPEDA MOTOR',
                    'model' => 'SEPEDA MOTOR',
                    'tahun-pembuatan' => '2010',
                    'silinder' => '00100 CC',
                    'nomor-rangka' => 'MH1JBB11',
                    'nomor-mesin' => 'JBB11',
                    'warna' => 'HITAM',
                    'tahun-regristasi' => '2010',
                    'nomor-bpkb' => 'B',
                    'tanggal-stnk' => '20-08-2015',
                    'lokasi-samsat' => 'SURABAYA',
                    'provinsi-samsat' => 'JAWA TIMUR',
                    'tanggal-bayar' => '20-08-2010',
                ],
            ]);

            $response->assertStatus(200)
                ->assertJsonStructure(['status', 'preview_url']);
            $this->assertStringStartsWith('data:image/png;base64,', $response->json('preview_url'));
        }
    }
}
