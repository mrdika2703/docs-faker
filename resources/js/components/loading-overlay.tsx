import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    Download,
    Eye,
    FileText,
    Save,
    Sparkles,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

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
    // Current animated visual progress (smooth float from 0 to 100)
    const [visualProgress, setVisualProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const targetRef = useRef<number>(0);
    const visualRef = useRef<number>(0);
    const animFrameRef = useRef<number | null>(null);
    const autoProgressTimerRef = useRef<NodeJS.Timeout | null>(null);

    const isControlled = typeof targetPropProgress === 'number';

    // Sync target progress from props
    useEffect(() => {
        if (isControlled && targetPropProgress !== undefined) {
            targetRef.current = Math.min(Math.max(targetPropProgress, 0), 100);
        }
    }, [isControlled, targetPropProgress]);

    // Dynamic stage based on percentage if not controlled
    const getStageText = (p: number, completed: boolean) => {
        if (completed || p >= 100) return 'Selesai! Menampilkan hasil...';
        if (controlledStageText) return controlledStageText;
        if (description) return description;
        if (p < 25) return 'Memeriksa data dokumen...';
        if (p < 55) return 'Menyusun teks dan tata letak...';
        if (p < 85) return 'Menyesuaikan visual dokumen...';
        return 'Menyelesaikan dokumen...';
    };

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setIsCompleted(false);
            document.body.style.overflow = 'hidden';

            visualRef.current = 0;
            setVisualProgress(0);

            if (isControlled) {
                targetRef.current = targetPropProgress !== undefined ? Math.max(targetPropProgress, 8) : 8;
            } else {
                targetRef.current = 15;
            }

            // Continuous 60fps smooth easing loop
            const updateFrame = () => {
                const current = visualRef.current;
                const target = targetRef.current;

                if (current < target) {
                    // Smooth spring lerp: faster when far, gentle when close
                    const diff = target - current;
                    const step = Math.max(0.18, diff * 0.08);
                    const next = Math.min(current + step, target);
                    visualRef.current = next;
                    setVisualProgress(next);
                } else if (current >= 100 && !isCompleted) {
                    setIsCompleted(true);
                }

                animFrameRef.current = requestAnimationFrame(updateFrame);
            };

            animFrameRef.current = requestAnimationFrame(updateFrame);

            // If not controlled by caller, provide smooth auto-pacing progression
            if (!isControlled) {
                const startTime = Date.now();
                autoProgressTimerRef.current = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    // Asymptotic progression curve towards ~88% max
                    const autoTarget = Math.min(
                        10 + 78 * (1 - Math.exp(-elapsed / 2000)),
                        88,
                    );
                    targetRef.current = Math.max(targetRef.current, autoTarget);
                }, 80);
            }
        } else if (isVisible) {
            // When process finishes: smoothly animate to 100%
            targetRef.current = 100;

            if (autoProgressTimerRef.current) {
                clearInterval(autoProgressTimerRef.current);
            }

            // Allow user to see 100% completion before fading out
            const exitTimeout = setTimeout(() => {
                setIsVisible(false);
                setIsCompleted(false);
                visualRef.current = 0;
                setVisualProgress(0);
                document.body.style.overflow = '';
            }, 400);

            return () => clearTimeout(exitTimeout);
        }

        return () => {
            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
            }
            if (autoProgressTimerRef.current) {
                clearInterval(autoProgressTimerRef.current);
            }
            document.body.style.overflow = '';
        };
    }, [isOpen, isVisible, isControlled]);

    if (!isVisible) return null;

    const roundedProgress = Math.min(Math.round(visualProgress), 100);
    const showCompleted = isCompleted || roundedProgress >= 100;

    const getIcon = () => {
        if (showCompleted) {
            return <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-50" />;
        }
        switch (type) {
            case 'preview':
                return <Eye className="size-5 text-indigo-600 dark:text-indigo-400" />;
            case 'download':
                return <Download className="size-5 text-emerald-600 dark:text-emerald-400 animate-bounce" />;
            case 'word':
                return <FileText className="size-5 text-blue-600 dark:text-blue-400" />;
            case 'save':
                return <Save className="size-5 text-amber-600 dark:text-amber-400" />;
            default:
                return <Sparkles className="size-5 text-primary" />;
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
                            {getStageText(roundedProgress, showCompleted)}
                        </p>
                    </div>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        <span>Proses</span>
                        <span
                            className={cn(
                                'font-mono font-bold transition-colors duration-200',
                                showCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary',
                            )}
                        >
                            {roundedProgress}%
                        </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-75 ease-linear',
                                showCompleted ? 'bg-emerald-500' : 'bg-primary',
                            )}
                            style={{ width: `${visualProgress}%` }}
                        />
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
                    <span className="flex items-center gap-1.5">
                        {!showCompleted && (
                            <span className="inline-block size-1.5 rounded-full bg-primary animate-ping" />
                        )}
                        <span>{showCompleted ? 'Berhasil diproses' : 'Sedang memproses...'}</span>
                    </span>
                    <span>{showCompleted ? '✓ Selesai' : 'Harap tunggu'}</span>
                </div>
            </div>
        </div>
    );
}
