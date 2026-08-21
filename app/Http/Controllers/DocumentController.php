<?php

namespace App\Http\Controllers;

use App\Models\DocumentHistory;
use App\Models\Template;
use App\Services\DocumentImageService;
use App\Services\DummyAssetGenerator;
use App\Services\WordDocumentService;
use Database\Seeders\DocumentTemplateSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class DocumentController extends Controller
{
    public function __construct(
        protected DocumentImageService $imageService,
        protected WordDocumentService $wordService
    ) {}

    /**
     * Display create document form.
     */
    public function create(Request $request, string|int|null $template = null): Response
    {
        $templates = Template::with('fields')->orderBy('id')->get();

        if ($templates->isEmpty()) {
            $seeder = new DocumentTemplateSeeder;
            $seeder->run();
            $templates = Template::with('fields')->orderBy('id')->get();
        }

        $selectedTemplate = null;

        if ($template !== null) {
            if (is_numeric($template)) {
                $selectedTemplate = $templates->firstWhere('id', (int) $template);
            } else {
                $slug = Str::slug((string) $template);
                $selectedTemplate = $templates->first(function ($t) use ($slug) {
                    return Str::slug($t->name) === $slug || strtolower($t->name) === strtolower($slug);
                });
            }
        }

        if (! $selectedTemplate) {
            $selectedTemplate = $templates->first();
        }

        return Inertia::render('documents/create', [
            'templates' => $templates,
            'selectedTemplate' => $selectedTemplate,
        ]);
    }

    /**
     * Preview raw background image for a template.
     */
    public function previewBackground(string|int $template): HttpResponse
    {
        $tpl = is_numeric($template)
            ? Template::find((int) $template)
            : Template::where('name', 'like', '%'.$template.'%')->first();

        if (! $tpl) {
            $tpl = Template::first();
        }

        if (! $tpl) {
            abort(SymfonyResponse::HTTP_NOT_FOUND, 'Template not found.');
        }

        // Handle Pajak template — background lives in public/images/PAJAK/
        if ($tpl->dummy_bg_path === 'pajak_bg' || strtolower($tpl->name) === 'doc b' || strtolower($tpl->name) === 'pajak') {
            $bgPath = $this->imageService->resolvePajakBackground();
            if (! file_exists($bgPath)) {
                abort(SymfonyResponse::HTTP_NOT_FOUND, 'Pajak background image not found.');
            }
            $binary = file_get_contents($bgPath);
            return response($binary, SymfonyResponse::HTTP_OK, [
                'Content-Type'  => 'image/jpeg',
                'Cache-Control' => 'no-cache, private',
            ]);
        }

        // Handle STNK template — background lives in public/images/STNK/
        if ($tpl->dummy_bg_path === 'stnk_bg' || strtolower($tpl->name) === 'doc a' || strtolower($tpl->name) === 'stnk') {
            $bgPath = public_path('images/STNK/background.jpg');
            if (! file_exists($bgPath)) {
                abort(SymfonyResponse::HTTP_NOT_FOUND, 'STNK background image not found.');
            }
            $binary = file_get_contents($bgPath);
            return response($binary, SymfonyResponse::HTTP_OK, [
                'Content-Type'  => 'image/jpeg',
                'Cache-Control' => 'no-cache, private',
            ]);
        }

        $bgPath = storage_path('app/'.$tpl->dummy_bg_path);

        if (! file_exists($bgPath)) {
            $generator = new DummyAssetGenerator;
            $generator->generateAll();
        }

        if (! file_exists($bgPath)) {
            abort(SymfonyResponse::HTTP_NOT_FOUND, 'Background image not found.');
        }

        $binary = file_get_contents($bgPath);

        return response($binary, SymfonyResponse::HTTP_OK, [
            'Content-Type'  => 'image/png',
            'Cache-Control' => 'no-cache, private',
        ]);
    }

    /**
     * Render document image on-the-fly in RAM for live preview (no DB save).
     */
    public function preview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_id' => ['required', 'exists:templates,id'],
            'input_data' => ['required', 'array'],
        ]);

        $template = Template::findOrFail($validated['template_id']);
        $previewUrl = $this->imageService->renderBase64($template, $validated['input_data']);

        return response()->json([
            'status' => 'success',
            'preview_url' => $previewUrl,
        ]);
    }

    /**
     * Save input data as JSON to DB only (no file download).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_id' => ['required', 'exists:templates,id'],
            'input_data' => ['required', 'array'],
        ]);

        $template = Template::findOrFail($validated['template_id']);
        $user = $request->user();

        $history = $user->documentHistories()->create([
            'template_id' => $template->id,
            'input_data' => $validated['input_data'],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Dokumen berhasil disimpan ke database.',
            'history_id' => $history->id,
        ]);
    }

    /**
     * Save input data as JSON to DB and stream rendered PNG for download.
     */
    public function generate(Request $request): HttpResponse
    {
        $validated = $request->validate([
            'template_id' => ['required', 'exists:templates,id'],
            'input_data' => ['required', 'array'],
        ]);

        $template = Template::findOrFail($validated['template_id']);
        $user = $request->user();

        // Save JSON to document_histories
        $user->documentHistories()->create([
            'template_id' => $template->id,
            'input_data' => $validated['input_data'],
        ]);

        // Render PNG in RAM and stream as download
        $binary = $this->imageService->renderImage($template, $validated['input_data']);
        $filename = 'doc-'.Str::slug($template->name).'-'.now()->format('Ymd-His').'.png';

        return response($binary, SymfonyResponse::HTTP_OK, [
            'Content-Type' => 'image/png',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'no-cache, private',
        ]);
    }

    /**
     * Display document generation history list.
     */
    public function history(Request $request): Response
    {
        $user = $request->user();

        $histories = DocumentHistory::query()
            ->where('user_id', $user->id)
            ->with('template.fields')
            ->latest()
            ->paginate(10)
            ->through(function ($doc) {
                return [
                    'id' => $doc->id,
                    'template_id' => $doc->template_id,
                    'template_name' => $doc->template?->name ?? 'Unknown Template',
                    'template_fields' => $doc->template?->fields ?? [],
                    'input_data' => $doc->input_data,
                    'created_at' => $doc->created_at?->format('Y-m-d H:i:s'),
                    'created_at_human' => $doc->created_at?->diffForHumans(),
                ];
            });

        return Inertia::render('documents/history', [
            'histories' => $histories,
        ]);
    }

    /**
     * Preview saved document history on-the-fly.
     */
    public function previewHistory(Request $request, DocumentHistory $history): JsonResponse
    {
        if ($history->user_id !== $request->user()->id) {
            abort(SymfonyResponse::HTTP_FORBIDDEN);
        }

        $template = $history->template;
        if (! $template) {
            abort(SymfonyResponse::HTTP_NOT_FOUND, 'Template not found.');
        }

        $previewUrl = $this->imageService->renderBase64($template, $history->input_data ?? []);

        return response()->json([
            'status' => 'success',
            'preview_url' => $previewUrl,
            'template_name' => $template->name,
            'input_data' => $history->input_data,
            'created_at' => $history->created_at?->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Update saved document history input data.
     */
    public function updateHistory(Request $request, DocumentHistory $history): JsonResponse
    {
        if ($history->user_id !== $request->user()->id) {
            abort(SymfonyResponse::HTTP_FORBIDDEN);
        }

        $validated = $request->validate([
            'input_data' => ['required', 'array'],
        ]);

        $history->update([
            'input_data' => $validated['input_data'],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Data history berhasil diperbarui.',
            'history' => [
                'id' => $history->id,
                'input_data' => $history->input_data,
            ],
        ]);
    }

    /**
     * Delete document history record.
     */
    public function destroyHistory(Request $request, DocumentHistory $history): JsonResponse
    {
        if ($history->user_id !== $request->user()->id) {
            abort(SymfonyResponse::HTTP_FORBIDDEN);
        }

        $history->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data history berhasil dihapus.',
        ]);
    }

    /**
     * Download saved document history on-the-fly.
     */
    public function downloadHistory(Request $request, DocumentHistory $history): HttpResponse
    {
        if ($history->user_id !== $request->user()->id) {
            abort(SymfonyResponse::HTTP_FORBIDDEN);
        }

        $template = $history->template;
        if (! $template) {
            abort(SymfonyResponse::HTTP_NOT_FOUND, 'Template not found.');
        }

        $binary = $this->imageService->renderImage($template, $history->input_data ?? []);
        $filename = 'doc-'.Str::slug($template->name).'-'.$history->id.'.png';

        return response($binary, SymfonyResponse::HTTP_OK, [
            'Content-Type' => 'image/png',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'no-cache, private',
        ]);
    }

    /**
     * Display merge document page.
     */
    public function merge(Request $request): Response
    {
        $user = $request->user();

        $stnkTemplate = Template::where('name', 'STNK')->first();
        $pajakTemplate = Template::where('name', 'PAJAK')->first();

        $stnkHistories = DocumentHistory::query()
            ->where('user_id', $user->id)
            ->when($stnkTemplate, fn ($q) => $q->where('template_id', $stnkTemplate->id))
            ->latest()
            ->get()
            ->map(fn ($doc) => [
                'id' => $doc->id,
                'nopol' => $doc->input_data['nopol'] ?? '-',
                'nama_pemilik' => $doc->input_data['nama-pemilik'] ?? $doc->input_data['nama_pemilik'] ?? '-',
                'input_data' => $doc->input_data,
                'created_at' => $doc->created_at?->format('Y-m-d H:i:s'),
                'created_at_human' => $doc->created_at?->diffForHumans(),
            ]);

        $pajakHistories = DocumentHistory::query()
            ->where('user_id', $user->id)
            ->when($pajakTemplate, fn ($q) => $q->where('template_id', $pajakTemplate->id))
            ->latest()
            ->get()
            ->map(fn ($doc) => [
                'id' => $doc->id,
                'nopol' => $doc->input_data['nopol'] ?? '-',
                'nama_pemilik' => $doc->input_data['nama-pemilik'] ?? $doc->input_data['nama_pemilik'] ?? '-',
                'input_data' => $doc->input_data,
                'created_at' => $doc->created_at?->format('Y-m-d H:i:s'),
                'created_at_human' => $doc->created_at?->diffForHumans(),
            ]);

        return Inertia::render('documents/merge', [
            'stnkHistories' => $stnkHistories,
            'pajakHistories' => $pajakHistories,
        ]);
    }

    /**
     * Download merged 2-page Word (.docx) document.
     */
    public function downloadMergeDocx(Request $request): HttpResponse
    {
        $validated = $request->validate([
            'stnk_history_id' => ['nullable', 'exists:document_histories,id'],
            'pajak_history_id' => ['nullable', 'exists:document_histories,id'],
        ]);

        if (empty($validated['stnk_history_id']) && empty($validated['pajak_history_id'])) {
            abort(SymfonyResponse::HTTP_UNPROCESSABLE_ENTITY, 'Pilih setidaknya 1 dokumen (STNK atau PAJAK).');
        }

        $user = $request->user();
        $stnkPng = null;
        $pajakPng = null;
        $nopol = null;

        if (! empty($validated['stnk_history_id'])) {
            $stnkHistory = DocumentHistory::where('id', $validated['stnk_history_id'])
                ->where('user_id', $user->id)
                ->with('template')
                ->firstOrFail();

            $stnkPng = $this->imageService->renderImage($stnkHistory->template, $stnkHistory->input_data ?? []);
            if (empty($nopol) && ! empty($stnkHistory->input_data['nopol'])) {
                $nopol = $stnkHistory->input_data['nopol'];
            }
        }

        if (! empty($validated['pajak_history_id'])) {
            $pajakHistory = DocumentHistory::where('id', $validated['pajak_history_id'])
                ->where('user_id', $user->id)
                ->with('template')
                ->firstOrFail();

            $pajakPng = $this->imageService->renderImage($pajakHistory->template, $pajakHistory->input_data ?? []);
            if (empty($nopol) && ! empty($pajakHistory->input_data['nopol'])) {
                $nopol = $pajakHistory->input_data['nopol'];
            }
        }

        $docxBinary = $this->wordService->generateDocx($stnkPng, $pajakPng);

        $safeNopol = $nopol ? Str::slug(str_replace(' ', '_', (string) $nopol), '_') : 'DOKUMEN';
        $filename = strtoupper($safeNopol).'.docx';

        return response($docxBinary, SymfonyResponse::HTTP_OK, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'no-cache, private',
        ]);
    }

    /**
     * Display unified combined create form for STNK & PAJAK.
     */
    public function createCombined(Request $request): Response
    {
        $stnkTemplate = Template::with('fields')->where('name', 'STNK')->first();
        $pajakTemplate = Template::with('fields')->where('name', 'PAJAK')->first();

        if (! $stnkTemplate || ! $pajakTemplate) {
            $seeder = new DocumentTemplateSeeder;
            $seeder->run();
            $stnkTemplate = Template::with('fields')->where('name', 'STNK')->first();
            $pajakTemplate = Template::with('fields')->where('name', 'PAJAK')->first();
        }

        return Inertia::render('documents/create-combined', [
            'stnkTemplate' => $stnkTemplate,
            'pajakTemplate' => $pajakTemplate,
        ]);
    }

    /**
     * Preview both STNK & PAJAK in RAM from combined form input.
     */
    public function previewCombined(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'input_data' => ['required', 'array'],
        ]);

        $stnkTemplate = Template::where('name', 'STNK')->firstOrFail();
        $pajakTemplate = Template::where('name', 'PAJAK')->firstOrFail();

        $parsed = $this->parseCombinedInput($validated['input_data']);

        $stnkPreview = $this->imageService->renderBase64($stnkTemplate, $parsed['stnk']);
        $pajakPreview = $this->imageService->renderBase64($pajakTemplate, $parsed['pajak']);

        return response()->json([
            'status' => 'success',
            'stnk_preview_url' => $stnkPreview,
            'pajak_preview_url' => $pajakPreview,
        ]);
    }

    /**
     * Save both STNK & PAJAK to DB history from combined form.
     */
    public function storeCombined(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'input_data' => ['required', 'array'],
        ]);

        $stnkTemplate = Template::where('name', 'STNK')->firstOrFail();
        $pajakTemplate = Template::where('name', 'PAJAK')->firstOrFail();

        $parsed = $this->parseCombinedInput($validated['input_data']);
        $user = $request->user();

        $stnkHistory = $user->documentHistories()->create([
            'template_id' => $stnkTemplate->id,
            'input_data' => $parsed['stnk'],
        ]);

        $pajakHistory = $user->documentHistories()->create([
            'template_id' => $pajakTemplate->id,
            'input_data' => $parsed['pajak'],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Dokumen STNK dan PAJAK berhasil disimpan ke database!',
            'stnk_history_id' => $stnkHistory->id,
            'pajak_history_id' => $pajakHistory->id,
        ]);
    }

    /**
     * Save both STNK & PAJAK to DB history and download 2-page Word (.docx) directly.
     */
    public function generateWordCombined(Request $request): HttpResponse
    {
        $validated = $request->validate([
            'input_data' => ['required', 'array'],
        ]);

        $stnkTemplate = Template::where('name', 'STNK')->firstOrFail();
        $pajakTemplate = Template::where('name', 'PAJAK')->firstOrFail();

        $parsed = $this->parseCombinedInput($validated['input_data']);
        $user = $request->user();

        $user->documentHistories()->create([
            'template_id' => $stnkTemplate->id,
            'input_data' => $parsed['stnk'],
        ]);

        $user->documentHistories()->create([
            'template_id' => $pajakTemplate->id,
            'input_data' => $parsed['pajak'],
        ]);

        $stnkPng = $this->imageService->renderImage($stnkTemplate, $parsed['stnk']);
        $pajakPng = $this->imageService->renderImage($pajakTemplate, $parsed['pajak']);

        $docxBinary = $this->wordService->generateDocx($stnkPng, $pajakPng);

        $nopol = $parsed['stnk']['nopol'] ?? $parsed['pajak']['nopol'] ?? 'DOKUMEN';
        $safeNopol = Str::slug(str_replace(' ', '_', (string) $nopol), '_');
        $filename = strtoupper($safeNopol).'.docx';

        return response($docxBinary, SymfonyResponse::HTTP_OK, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Cache-Control' => 'no-cache, private',
        ]);
    }

    /**
     * De-merge unified input form into separate STNK and PAJAK input arrays.
     *
     * @param  array<string, mixed>  $input
     * @return array{stnk: array<string, mixed>, pajak: array<string, mixed>}
     */
    protected function parseCombinedInput(array $input): array
    {
        // Shared fields: nopol, nama-pemilik, jenis, model, nomor-rangka, nomor-mesin, warna
        $nopol = $input['nopol'] ?? 'S 1234 WL';
        $namaPemilik = $input['nama_pemilik'] ?? $input['nama-pemilik'] ?? 'NAMA LENGKAP';
        $jenis = $input['jenis'] ?? 'SEPEDA MOTOR';
        $model = $input['model'] ?? 'SEPEDA MOTOR';
        $nomorRangka = $input['nomor_rangka'] ?? $input['nomor-rangka'] ?? 'MH1JBB11';
        $nomorMesin = $input['nomor_mesin'] ?? $input['nomor-mesin'] ?? 'JBB11';
        $warna = $input['warna'] ?? 'HITAM';

        $stnkData = [
            'nopol' => $nopol,
            'nama-pemilik' => $namaPemilik,
            'alamat1' => $input['stnk_alamat1'] ?? 'DSN. TEMPAT RW01/02 DS. TEMPAT',
            'alamat2' => $input['stnk_alamat2'] ?? 'KEC. TEMPAT SBY',
            'merk' => $input['stnk_merk'] ?? 'HONDA',
            'type' => $input['stnk_type'] ?? 'NF11B21 MT',
            'jenis' => $jenis,
            'model' => $model,
            'tahun-pembuatan' => $input['stnk_tahun_pembuatan'] ?? '2010',
            'silinder' => $input['stnk_silinder'] ?? '00100 CC',
            'nomor-rangka' => $nomorRangka,
            'nomor-mesin' => $nomorMesin,
            'warna' => $warna,
            'tahun-regristasi' => $input['stnk_tahun_regristasi'] ?? '2010',
            'nomor-bpkb' => $input['stnk_nomor_bpkb'] ?? 'B',
            'tanggal-stnk' => $input['stnk_tanggal_stnk'] ?? '20-08-2015',
            'lokasi-samsat' => $input['stnk_lokasi_samsat'] ?? 'SURABAYA',
            'provinsi-samsat' => $input['stnk_provinsi_samsat'] ?? 'JAWA TIMUR',
            'tanggal-bayar' => $input['stnk_tanggal_bayar'] ?? '20-08-2010',
        ];

        $pajakData = [
            'nopol' => $nopol,
            'nama-pemilik' => $namaPemilik,
            'alamat1' => $input['pajak_alamat1'] ?? 'NAMA TEMPAT',
            'alamat2' => $input['pajak_alamat2'] ?? 'RW01/02 / SBY / DS. TEMPAT',
            'alamat3' => $input['pajak_alamat3'] ?? 'MOJOAGUNG',
            'merk' => $input['pajak_merk'] ?? 'HONDA / NF11B21 MT',
            'jenis' => $jenis,
            'model' => $model,
            'tahun-cc' => $input['pajak_tahun_cc'] ?? '2013/100',
            'warna' => $warna,
            'nomor-rangka' => $nomorRangka,
            'nomor-mesin' => $nomorMesin,
            'tanggal-faktur' => $input['pajak_tanggal_faktur'] ?? '15-08-2010',
            'tanggal-pajak' => $input['pajak_tanggal_pajak'] ?? '20-08-2015',
            'nopol-lama' => $input['pajak_nopol_lama'] ?? '-',
            'tanggal-bayar' => $input['pajak_tanggal_bayar'] ?? '19-08-2014',
            'tahun-bayar' => $input['pajak_tahun_bayar'] ?? '14',
        ];

        return [
            'stnk' => $stnkData,
            'pajak' => $pajakData,
        ];
    }
}
