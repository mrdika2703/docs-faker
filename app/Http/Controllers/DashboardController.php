<?php

namespace App\Http\Controllers;

use App\Models\DocumentHistory;
use App\Models\Template;
use Database\Seeders\DocumentTemplateSeeder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard view.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (Template::count() === 0) {
            $seeder = new DocumentTemplateSeeder;
            $seeder->run();
        }

        $totalGenerated = DocumentHistory::query()
            ->where('user_id', $user->id)
            ->count();

        $totalTemplates = Template::query()->count();

        $recentDocs = DocumentHistory::query()
            ->where('user_id', $user->id)
            ->with('template')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'template_id' => $doc->template_id,
                    'template_name' => $doc->template?->name ?? 'Unknown Template',
                    'input_data' => $doc->input_data,
                    'nopol' => $doc->input_data['nopol'] ?? $doc->input_data['nomor-polisi'] ?? $doc->input_data['no_polisi'] ?? $doc->input_data['nomor'] ?? '',
                    'created_at' => $doc->created_at?->format('Y-m-d H:i:s'),
                    'created_at_human' => $doc->created_at?->diffForHumans(),
                ];
            });

        $templates = Template::query()
            ->select('id', 'name')
            ->orderBy('id')
            ->get();

        return Inertia::render('dashboard', [
            'stats' => [
                'total_generated' => $totalGenerated,
                'total_templates' => $totalTemplates,
            ],
            'recent_docs' => $recentDocs,
            'templates' => $templates,
        ]);
    }
}
