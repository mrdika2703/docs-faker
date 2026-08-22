import { cn } from '@/lib/utils';
import { Activity, RefreshCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export function ConnectionMonitor({ className }: { className?: string }) {
    const [latency, setLatency] = useState<number | null>(null);
    const [isPinging, setIsPinging] = useState(false);
    const [statusText, setStatusText] = useState('Mengukur koneksi...');

    const ping = async () => {
        if (isPinging) return;
        setIsPinging(true);
        const start = performance.now();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const res = await fetch(`/ping.json?_=${Date.now()}`, {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (res.ok) {
                const duration = Math.round(performance.now() - start);
                setLatency(duration);

                if (duration < 150) {
                    setStatusText(`Koneksi Sangat Cepat (${duration} ms) • Server Aktif`);
                } else if (duration <= 350) {
                    setStatusText(`Koneksi Sedang (${duration} ms) • Server Aktif`);
                } else {
                    setStatusText(`Koneksi Lambat (${duration} ms) • Jaringan Mengalami Latensi`);
                }
            } else {
                setLatency(null);
                setStatusText('Server Error');
            }
        } catch {
            setLatency(null);
            setStatusText('Koneksi Terputus / Timeout');
        } finally {
            setIsPinging(false);
        }
    };

    useEffect(() => {
        ping();

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                ping();
            }
        }, 8000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                ping();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Color logic
    // Hijau: < 150 ms
    // Kuning: 150 - 350 ms
    // Merah: > 350 ms atau offline / error
    const getColorTheme = () => {
        if (latency === null) {
            return {
                dot: 'bg-rose-500',
                ping: 'bg-rose-400',
                text: 'text-rose-600 dark:text-rose-400',
                border: 'border-rose-200 dark:border-rose-900/50',
                bg: 'bg-rose-500/10',
                label: 'Offline',
            };
        }

        if (latency < 150) {
            return {
                dot: 'bg-emerald-500',
                ping: 'bg-emerald-400',
                text: 'text-emerald-700 dark:text-emerald-400',
                border: 'border-emerald-200 dark:border-emerald-900/50',
                bg: 'bg-emerald-500/10',
                label: `${latency} ms`,
            };
        }

        if (latency <= 350) {
            return {
                dot: 'bg-amber-500',
                ping: 'bg-amber-400',
                text: 'text-amber-700 dark:text-amber-400',
                border: 'border-amber-200 dark:border-amber-900/50',
                bg: 'bg-amber-500/10',
                label: `${latency} ms`,
            };
        }

        return {
            dot: 'bg-rose-500',
            ping: 'bg-rose-400',
            text: 'text-rose-700 dark:text-rose-400',
            border: 'border-rose-200 dark:border-rose-900/50',
            bg: 'bg-rose-500/10',
            label: `${latency} ms`,
        };
    };

    const theme = getColorTheme();

    return (
        <button
            type="button"
            onClick={ping}
            title={`${statusText} (Klik untuk refresh)`}
            className={cn(
                'group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 hover:opacity-80 active:scale-95',
                theme.bg,
                theme.border,
                theme.text,
                className,
            )}
        >
            {/* Pulsing indicator dot */}
            <span className="relative flex size-2 shrink-0">
                <span
                    className={cn(
                        'absolute inline-flex h-full w-full rounded-full opacity-75',
                        isPinging ? 'animate-ping' : latency !== null && latency < 150 ? 'animate-pulse' : '',
                        theme.ping,
                    )}
                />
                <span className={cn('relative inline-flex size-2 rounded-full', theme.dot)} />
            </span>

            {/* Latency number in ms */}
            <span className="font-mono text-[11px] font-bold tracking-tight">
                {isPinging && latency === null ? 'Pinging...' : theme.label}
            </span>

            {/* Subtle icon */}
            <Activity className="size-3 opacity-60 group-hover:opacity-100" />
        </button>
    );
}
