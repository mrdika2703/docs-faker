<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Document routes
    Route::get('documents/create-combined', [DocumentController::class, 'createCombined'])->name('documents.create-combined');
    Route::post('documents/combined/preview', [DocumentController::class, 'previewCombined'])->name('documents.combined.preview');
    Route::post('documents/combined/store', [DocumentController::class, 'storeCombined'])->name('documents.combined.store');
    Route::post('documents/combined/generate-word', [DocumentController::class, 'generateWordCombined'])->name('documents.combined.generate-word');
    Route::get('documents/create/{template?}', [DocumentController::class, 'create'])->name('documents.create');
    Route::get('templates/{template}/background', [DocumentController::class, 'previewBackground'])->name('templates.background');
    Route::post('documents/preview', [DocumentController::class, 'preview'])->name('documents.preview');
    Route::post('documents/store', [DocumentController::class, 'store'])->name('documents.store');
    Route::post('documents/generate', [DocumentController::class, 'generate'])->name('documents.generate');

    // History routes
    Route::get('documents/history', [DocumentController::class, 'history'])->name('documents.history');
    Route::get('documents/history/{history}/preview', [DocumentController::class, 'previewHistory'])->name('documents.history.preview');
    Route::get('documents/history/{history}/download', [DocumentController::class, 'downloadHistory'])->name('documents.history.download');
    Route::put('documents/history/{history}', [DocumentController::class, 'updateHistory'])->name('documents.history.update');
    Route::delete('documents/history/{history}', [DocumentController::class, 'destroyHistory'])->name('documents.history.destroy');

    // Merge Word Document routes
    Route::get('documents/merge', [DocumentController::class, 'merge'])->name('documents.merge');
    Route::post('documents/merge/download', [DocumentController::class, 'downloadMergeDocx'])->name('documents.merge.download');
});

require __DIR__.'/settings.php';
