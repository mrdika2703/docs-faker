import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    Download,
    Eye,
    FileText,
    Save,
    Sparkles,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface LoadingOverlayProps {
    isOpen: boolean;
    progress?: number; // Target progress percentage (0 - 100)
    stageText?: string; // Controlled stage text
    title?: string;
    description?: string;
    badge?: string;
    type?: 'preview' | 'download' | 'word' | 'save' | 'process';
}

export function LoadingOverlay({
    isOpen,
    progress: targetPropProgress,
    stageText: controlledStageText,
    title = 'Memproses Dokumen...',
    description,
    badge,
    type = 'process',
}: LoadingOverlayProps) {
    const isControlled = typeof targetPropProgress === 'number';
    const [visualProgress, setVisualProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    // Current effective integer percent (0 to 100) - directly synchronized
    const currentPercent = Math.min(
        Math.max(
            Math.round(isControlled ? (targetPropProgress ?? 0) : visualProgress),
            0,
        ),
        100,
    );

    const showCompleted = currentPercent >= 100;

    // Body scroll lock and visibility lifecycle
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';

            // Auto-pacing progress if not controlled by caller
            if (!isControlled) {
                setVisualProgress(12);
                const startTime = Date.now();
                const timer = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    const next = Math.min(
                        12 + 76 * (1 - Math.exp(-elapsed / 2500)),
                        88,
                    );
                    setVisualProgress(next);
                }, 100);

                return () => {
                    clearInterval(timer);
                    document.body.style.overflow = '';
                };
            }
        } else if (isVisible) {
            // Smooth exit transition
            const exitTimeout = setTimeout(() => {
                setIsVisible(false);
                setVisualProgress(0);
                document.body.style.overflow = '';
            }, 300);

            return () => {
                clearTimeout(exitTimeout);
                document.body.style.overflow = '';
            };
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, isVisible, isControlled]);

    if (!isVisible) return null;

    // Dynamic stage based on percentage if not controlled
    const getStageText = () => {
        if (showCompleted) return 'Selesai! Menampilkan hasil...';
        if (controlledStageText) return controlledStageText;
        if (description) return description;
        if (currentPercent < 25) return 'Memeriksa data dokumen...';
        if (currentPercent < 55) return 'Menyusun teks dan tata letak...';
        if (currentPercent < 85) return 'Menyesuaikan visual dokumen...';
        return 'Menyelesaikan dokumen...';
    };

    const getIcon = () => {
        if (showCompleted) {
            return (
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-50" />
            );
        }
        switch (type) {
            case 'preview':
                return (
                    <Eye className="size-5 text-indigo-600 dark:text-indigo-400" />
                );
            case 'download':
                return (
                    <Download className="size-5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                );
            case 'word':
                return (
                    <FileText className="size-5 text-blue-600 dark:text-blue-400" />
                );
            case 'save':
                return (
                    <Save className="size-5 text-amber-600 dark:text-amber-400" />
                );
            default:
                return <Sparkles className="size-5 text-primary" />;
        }
    };

    const getBarColor = () => {
        if (showCompleted) return 'bg-emerald-500';
        switch (type) {
            case 'preview':
                return 'bg-indigo-600 dark:bg-indigo-500';
            case 'download':
                return 'bg-emerald-600 dark:bg-emerald-500';
            case 'word':
                return 'bg-blue-600 dark:bg-blue-500';
            case 'save':
                return 'bg-amber-600 dark:bg-amber-500';
            default:
                return 'bg-blue-600 dark:bg-blue-500';
        }
    };

    const getPercentTextColor = () => {
        if (showCompleted) return 'text-emerald-600 dark:text-emerald-400';
        switch (type) {
            case 'preview':
                return 'text-indigo-600 dark:text-indigo-400';
            case 'download':
                return 'text-emerald-600 dark:text-emerald-400';
            case 'word':
                return 'text-blue-600 dark:text-blue-400';
            case 'save':
                return 'text-amber-600 dark:text-amber-400';
            default:
                return 'text-blue-600 dark:text-blue-400';
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="loading-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            {/* Minimalist Backdrop */}
            <div
                className={cn(
                    'fixed inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-200',
                    showCompleted && 'opacity-70',
                )}
            />

            {/* Simple & Lightweight Modal Card */}
            <div
                className={cn(
                    'relative z-10 w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 shadow-xl transition-all duration-200 dark:border-neutral-800 dark:bg-neutral-900',
                    showCompleted
                        ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                        : 'animate-in fade-in-0 zoom-in-95 duration-150',
                )}
            >
                {/* Header with Icon & Title */}
                <div className="flex items-center gap-3.5">
                    <div className="relative flex size-11 shrink-0 items-center justify-center">
                        {!showCompleted ? (
                            <>
                                {/* Continuous spinning indicator */}
                                <svg
                                    className="absolute inset-0 size-11 animate-spin text-primary"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-20"
                                        cx="12"
                                        cy="12"
                                        r="9.5"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                    />
                                    <path
                                        className="opacity-90"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                <div className="flex size-7 items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800">
                                    {getIcon()}
                                </div>
                            </>
                        ) : (
                            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                {getIcon()}
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <h3
                                id="loading-title"
                                className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100"
                            >
                                {showCompleted ? 'Proses Selesai' : title}
                            </h3>
                            {badge && (
                                <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                    {badge}
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                            {getStageText()}
                        </p>
                    </div>
                </div>

                {/* Progress Bar & Percentage (Directly Synchronized 1:1) */}
                <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        <span>Proses</span>
                        <span
                            className={cn(
                                'font-mono font-bold transition-colors duration-200',
                                getPercentTextColor(),
                            )}
                        >
                            {currentPercent}%
                        </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                            className={cn(
                                'h-full rounded-full transition-[width] duration-200 ease-out',
                                getBarColor(),
                            )}
                            style={{ width: `${currentPercent}%` }}
                        />
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
                    <span className="flex items-center gap-1.5">
                        {!showCompleted && (
                            <span className="inline-block size-1.5 rounded-full bg-primary animate-ping" />
                        )}
                        <span>
                            {showCompleted
                                ? 'Berhasil diproses'
                                : 'Sedang memproses...'}
                        </span>
                    </span>
                    <span>{showCompleted ? '✓ Selesai' : 'Harap tunggu'}</span>
                </div>
            </div>
        </div>
    );
}
