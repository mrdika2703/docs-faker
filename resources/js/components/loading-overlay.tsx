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
    title?: string;
    description?: string;
    badge?: string;
    type?: 'preview' | 'download' | 'word' | 'save' | 'process';
}

export function LoadingOverlay({
    isOpen,
    title = 'Memproses Dokumen...',
    description,
    badge,
    type = 'process',
}: LoadingOverlayProps) {
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Dynamic stage based on percentage
    const getStageText = (p: number, completed: boolean) => {
        if (completed || p >= 100) return 'Selesai! Menampilkan hasil...';
        if (description) return description;
        if (p < 30) return 'Menghubungkan ke server & memuat template...';
        if (p < 60) return 'Merender pemetaan karakter glyph font di RAM...';
        if (p < 85) return 'Menerapkan Photoshop color grading...';
        return 'Finalisasi & mentransfer data respon...';
    };

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setIsCompleted(false);
            setProgress(8);
            document.body.style.overflow = 'hidden';

            // Adaptive decay progress ticker (cepat di awal, melambat di akhir)
            timerRef.current = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 98) {
                        return prev;
                    }
                    if (prev < 40) {
                        return prev + Math.floor(Math.random() * 6) + 6; // +6..11%
                    }
                    if (prev < 75) {
                        return prev + Math.floor(Math.random() * 4) + 3; // +3..6%
                    }
                    if (prev < 90) {
                        return prev + Math.floor(Math.random() * 2) + 2; // +2..3%
                    }
                    // 90..98% smooth trickle
                    return prev + 1;
                });
            }, 100);
        } else if (isVisible) {
            // When process finishes: animate to 100% completion before closing
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            setProgress(100);
            setIsCompleted(true);

            const closeTimeout = setTimeout(() => {
                setIsVisible(false);
                setIsCompleted(false);
                setProgress(0);
                document.body.style.overflow = '';
            }, 300);

            return () => clearTimeout(closeTimeout);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            document.body.style.overflow = '';
        };
    }, [isOpen, isVisible]);

    if (!isVisible) return null;

    const getIcon = () => {
        if (isCompleted || progress >= 100) {
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
                    isCompleted && 'opacity-70',
                )}
            />

            {/* Simple & Lightweight Modal Card */}
            <div
                className={cn(
                    'relative z-10 w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 shadow-xl transition-all duration-200 dark:border-neutral-800 dark:bg-neutral-900',
                    isCompleted
                        ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                        : 'animate-in fade-in-0 zoom-in-95 duration-150',
                )}
            >
                {/* Header with Icon & Title */}
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                            isCompleted
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                                : 'bg-neutral-100 dark:bg-neutral-800',
                        )}
                    >
                        {getIcon()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <h3
                                id="loading-title"
                                className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100"
                            >
                                {isCompleted ? 'Proses Selesai' : title}
                            </h3>
                            {badge && (
                                <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                    {badge}
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                            {getStageText(progress, isCompleted)}
                        </p>
                    </div>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        <span>Proses</span>
                        <span
                            className={cn(
                                'font-mono font-bold transition-colors',
                                isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary',
                            )}
                        >
                            {progress}%
                        </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-200 ease-out',
                                isCompleted ? 'bg-emerald-500' : 'bg-primary',
                            )}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
                    <span>{isCompleted ? 'Berhasil diproses' : 'Memproses di RAM...'}</span>
                    <span>{isCompleted ? '✓ 100%' : 'Harap tunggu'}</span>
                </div>
            </div>
        </div>
    );
}
