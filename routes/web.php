<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');
Route::get('ping', fn () => response()->noContent())->name('ping');

Route::middleware(['auth'])->group(function () {
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
    Route::post('documents/merge/prepare', [DocumentController::class, 'prepareMergeJob'])->name('documents.merge.prepare');
    Route::get('documents/merge/status/{jobId}', [DocumentController::class, 'statusMergeJob'])->name('documents.merge.status');
    Route::get('documents/merge/download/{jobId}', [DocumentController::class, 'downloadMergeJob'])->name('documents.merge.job-download');


    // Administrator Only routes (Template Fields & User Management)
    Route::middleware('admin')->group(function () {
        // Template Field Configuration routes
        Route::get('templates/fields', [DocumentController::class, 'templateFieldsIndex'])->name('templates.fields.index');
        Route::put('templates/fields/{field}', [DocumentController::class, 'updateTemplateField'])->name('templates.fields.update');
        Route::post('templates/fields/bulk-update', [DocumentController::class, 'bulkUpdateTemplateFields'])->name('templates.fields.bulk-update');
        Route::post('templates/fields/reset-defaults', [DocumentController::class, 'resetTemplateFields'])->name('templates.fields.reset-defaults');

        // User Management CRUD routes
        Route::get('users', [\App\Http\Controllers\UserController::class, 'index'])->name('users.index');
        Route::post('users', [\App\Http\Controllers\UserController::class, 'store'])->name('users.store');
        Route::put('users/{user}', [\App\Http\Controllers\UserController::class, 'update'])->name('users.update');
        Route::delete('users/{user}', [\App\Http\Controllers\UserController::class, 'destroy'])->name('users.destroy');
    });
});

require __DIR__.'/settings.php';
