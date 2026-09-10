import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { LoadingOverlay } from '@/components/loading-overlay';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Download,
    FileCheck,
    FileSpreadsheet,
    FileStack,
    FileText,
    Layers,
    Printer,
    Search,
    Sparkles,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface HistoryItem {
    id: number;
    nopol: string;
    nama_pemilik: string;
    input_data: Record<string, any>;
    created_at: string;
    created_at_human: string;
}

interface MergeProps {
    stnkHistories: HistoryItem[];
    pajakHistories: HistoryItem[];
}

function filterAndRankHistories(
    items: HistoryItem[],
    query: string,
): HistoryItem[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
        // Tampilkan maks 10 dokumen terbaru saat belum mencari
        return items.slice(0, 10);
    }

    const cleanQuery = trimmed.replace(/\s+/g, '');

    const scored = items
        .map((item) => {
            const nopolLower = (item.nopol || '').toLowerCase();
            const cleanNopol = nopolLower.replace(/\s+/g, '');
            const namaLower = (item.nama_pemilik || '').toLowerCase();
            const idStr = String(item.id);

            let score = 0;

            // Nopol match
            if (nopolLower === trimmed || cleanNopol === cleanQuery) {
                score += 100;
            } else if (cleanNopol.startsWith(cleanQuery)) {
                score += 70;
            } else if (cleanNopol.includes(cleanQuery)) {
                score += 50;
            }

            // Nama pemilik match
            if (namaLower === trimmed) {
                score += 80;
            } else if (namaLower.startsWith(trimmed)) {
                score += 40;
            } else if (namaLower.includes(trimmed)) {
                score += 30;
            }

            // ID match
            if (idStr === trimmed) {
                score += 90;
            } else if (idStr.includes(trimmed)) {
                score += 20;
            }

            return { item, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.item);

    // Tampilkan maks 5 hasil pencarian paling sesuai
    return scored.slice(0, 5);
}

export default function MergePage({
    stnkHistories = [],
    pajakHistories = [],
}: MergeProps) {
    const [stnkSearch, setStnkSearch] = useState('');
    const [pajakSearch, setPajakSearch] = useState('');

    const [selectedStnkId, setSelectedStnkId] = useState<number | null>(
        stnkHistories.length > 0 ? stnkHistories[0].id : null,
    );
    const [selectedPajakId, setSelectedPajakId] = useState<number | null>(
        pajakHistories.length > 0 ? pajakHistories[0].id : null,
    );
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadStage, setDownloadStage] = useState('');
    const [downloadError, setDownloadError] = useState<string | null>(null);

    const displayedStnkHistories = useMemo(
        () => filterAndRankHistories(stnkHistories, stnkSearch),
        [stnkHistories, stnkSearch],
    );

    const displayedPajakHistories = useMemo(
        () => filterAndRankHistories(pajakHistories, pajakSearch),
        [pajakHistories, pajakSearch],
    );

    const selectedStnk = stnkHistories.find(
        (item) => item.id === selectedStnkId,
    );
    const selectedPajak = pajakHistories.find(
        (item) => item.id === selectedPajakId,
    );

    const hasSelection = selectedStnkId !== null || selectedPajakId !== null;

    // Determine target filename preview
    const targetNopol =
        selectedStnk?.nopol || selectedPajak?.nopol || 'DOKUMEN';
    const targetFilename = `${targetNopol.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}.docx`;

    const handleDownload = async () => {
        if (!hasSelection) return;

        setIsDownloading(true);
        setDownloadProgress(10);
        setDownloadStage('Menyiapkan data STNK & PAJAK...');
        setDownloadError(null);

        // Progress timer agar loading bar bergerak mulus dan dinamis selama proses render di server
        let currentProgress = 10;
        const progressTimer = setInterval(() => {
            if (currentProgress < 85) {
                const diff = 85 - currentProgress;
                const increment = Math.max(1, Math.round(diff * 0.08));
                currentProgress = Math.min(currentProgress + increment, 85);
                setDownloadProgress(currentProgress);

                if (currentProgress < 30) {
                    setDownloadStage('Menyiapkan data STNK & PAJAK...');
                } else if (currentProgress < 55) {
                    setDownloadStage('Merender gambar STNK & PAJAK...');
                } else if (currentProgress < 75) {
                    setDownloadStage('Menyusun tata letak Word A4 Landscape...');
                } else {
                    setDownloadStage('Menyelesaikan file .docx...');
                }
            }
        }, 120);

        try {
            const token =
                (
                    document.querySelector(
                        'meta[name="csrf-token"]',
                    ) as HTMLMetaElement
                )?.content || '';

            // --- Tahap 1: Kirim request prepare, server render PNG + build DOCX ---
            const prepareRes = await fetch('/documents/merge/prepare', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    stnk_history_id: selectedStnkId,
                    pajak_history_id: selectedPajakId,
                }),
            });

            if (!prepareRes.ok) {
                clearInterval(progressTimer);
                const errData = await prepareRes.json().catch(() => ({}));
                throw new Error(
                    errData.message || 'Gagal menyiapkan dokumen Word.',
                );
            }

            const prepareData = await prepareRes.json();
            const jobId: string = prepareData.job_id;

            // --- Tahap 2: Poll status bila belum ready ---
            let attempts = 0;
            const maxAttempts = 20;

            await new Promise<void>((resolve, reject) => {
                const poll = () => {
                    attempts++;
                    fetch(`/documents/merge/status/${jobId}`, {
                        headers: { Accept: 'application/json' },
                    })
                        .then((r) => r.json())
                        .then((data) => {
                            if (data.status === 'ready') {
                                resolve();
                            } else if (attempts >= maxAttempts) {
                                reject(
                                    new Error(
                                        'Timeout: file dokumen tidak kunjung siap.',
                                    ),
                                );
                            } else {
                                setTimeout(poll, 300);
                            }
                        })
                        .catch(() => {
                            if (attempts >= maxAttempts) {
                                reject(
                                    new Error(
                                        'Gagal memeriksa status dokumen.',
                                    ),
                                );
                            } else {
                                setTimeout(poll, 300);
                            }
                        });
                };
                poll();
            });

            clearInterval(progressTimer);

            // --- Tahap 3: Animasi transisi mulus ke 100% lalu buka unduhan native ---
            setDownloadProgress(92);
            setDownloadStage('File siap! Membuka unduhan...');

            await new Promise((resolve) => setTimeout(resolve, 250));
            setDownloadProgress(100);

            await new Promise((resolve) => setTimeout(resolve, 200));

            // Buka download via window.location (GET) agar browser bisa tampilkan progress download nyata
            window.location.href = `/documents/merge/download/${jobId}`;

            // Tutup overlay setelah jeda singkat
            setTimeout(() => {
                setIsDownloading(false);
                setDownloadProgress(0);
                setDownloadStage('');
            }, 1800);
        } catch (err: any) {
            clearInterval(progressTimer);
            setDownloadError(
                err.message || 'Terjadi kesalahan saat mengunduh dokumen.',
            );
            setIsDownloading(false);
            setDownloadProgress(0);
            setDownloadStage('');
        }
    };

    return (
        <>
            <Head title="Merge STNK & PAJAK (Word 2-Halaman)" />

            {/* Loading Overlay with Real Progress */}
            <LoadingOverlay
                isOpen={isDownloading}
                progress={downloadProgress}
                stageText={downloadStage}
                title={`Menyusun Dokumen Word (${targetFilename})`}
                type="word"
                badge="Word (.docx)"
            />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    Merge Dokumen Word (Print Ready)
                                </h1>
                                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    2 Halaman A4 Landscape
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Gabungkan dokumen STNK dan Pajak dari riwayat ke
                                dalam satu file Word (.docx) format A4 Landscape
                                siap cetak.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleDownload}
                            disabled={!hasSelection || isDownloading}
                            className="gap-2 bg-neutral-900 text-white shadow-md hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
                        >
                            {isDownloading ? (
                                <>
                                    <Spinner className="size-4" />
                                    <span>Memproses Word...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="size-4" />
                                    <span>
                                        Download .DOCX ({targetFilename})
                                    </span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {downloadError && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>{downloadError}</span>
                    </div>
                )}

                {/* Main Selection & Diagram Grid */}
                <div className="grid gap-6 lg:grid-cols-12">
                    {/* Left 7 Cols: History Selection Cards */}
                    <div className="flex flex-col gap-6 lg:col-span-7">
                        {/* STNK Selector Card */}
                        <Card className="border-sidebar-border/80">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                            <FileText className="size-4" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">
                                                1. Pilih Dokumen STNK
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                Akan ditempatkan di Halaman 1
                                                (Belakang STNK) & Halaman 2
                                                (Output STNK)
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-neutral-400">
                                        {stnkHistories.length} total
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {stnkHistories.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500 dark:border-neutral-700">
                                        Belum ada riwayat dokumen STNK.{' '}
                                        <Link
                                            href="/documents/create/stnk"
                                            className="font-semibold text-emerald-600 underline"
                                        >
                                            Buat STNK Sekarang
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        {/* Search Input STNK */}
                                        <div className="space-y-1.5">
                                            <div className="relative">
                                                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400" />
                                                <Input
                                                    type="text"
                                                    value={stnkSearch}
                                                    onChange={(e) =>
                                                        setStnkSearch(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Cari nopol / nama pemilik STNK..."
                                                    className="h-8 pr-8 pl-8 text-xs"
                                                />
                                                {stnkSearch && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setStnkSearch('')
                                                        }
                                                        className="absolute top-1/2 right-2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                                    >
                                                        <X className="size-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-neutral-500">
                                                <span>
                                                    {stnkSearch.trim()
                                                        ? `Hasil pencarian (maks 5): ${displayedStnkHistories.length} item`
                                                        : `10 dokumen terbaru (${displayedStnkHistories.length} ditampilkan)`}
                                                </span>
                                                {selectedStnk && (
                                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                                        Terpilih:{' '}
                                                        {selectedStnk.nopol}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
                                            {/* Option None */}
                                            <div
                                                onClick={() =>
                                                    setSelectedStnkId(null)
                                                }
                                                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition-all ${
                                                    selectedStnkId === null
                                                        ? 'border-neutral-900 bg-neutral-900/5 font-semibold text-neutral-900 dark:border-neutral-200 dark:bg-neutral-100/5 dark:text-neutral-100'
                                                        : 'border-sidebar-border text-neutral-500 hover:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                                                }`}
                                            >
                                                <span>
                                                    -- Tanpa Dokumen STNK
                                                    (Kosongkan) --
                                                </span>
                                                {selectedStnkId === null && (
                                                    <Check className="size-4 text-neutral-900 dark:text-neutral-100" />
                                                )}
                                            </div>

                                            {displayedStnkHistories.length ===
                                            0 ? (
                                                <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-xs text-neutral-500 dark:border-neutral-700">
                                                    Tidak ada dokumen STNK yang
                                                    cocok dengan kata kunci
                                                    &quot;{stnkSearch}&quot;.
                                                </div>
                                            ) : (
                                                displayedStnkHistories.map(
                                                    (item) => {
                                                        const isSelected =
                                                            selectedStnkId ===
                                                            item.id;
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                onClick={() =>
                                                                    setSelectedStnkId(
                                                                        item.id,
                                                                    )
                                                                }
                                                                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${
                                                                    isSelected
                                                                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm dark:border-emerald-500 dark:bg-emerald-950/20'
                                                                        : 'border-sidebar-border hover:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className={`flex size-5 items-center justify-center rounded-full border text-[10px] ${
                                                                            isSelected
                                                                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                                                                : 'border-neutral-300 dark:border-neutral-700'
                                                                        }`}
                                                                    >
                                                                        {isSelected && (
                                                                            <Check className="size-3" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                            {
                                                                                item.nopol
                                                                            }
                                                                        </div>
                                                                        <div className="text-[11px] text-neutral-500">
                                                                            {
                                                                                item.nama_pemilik
                                                                            }{' '}
                                                                            &bull;{' '}
                                                                            {
                                                                                item.created_at_human
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                                                    ID: #
                                                                    {item.id}
                                                                </span>
                                                            </div>
                                                        );
                                                    },
                                                )
                                            )}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* PAJAK Selector Card */}
                        <Card className="border-sidebar-border/80">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                            <FileSpreadsheet className="size-4" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">
                                                2. Pilih Dokumen PAJAK
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                Akan ditempatkan di Halaman 1
                                                (Belakang PAJAK) & Halaman 2
                                                (Output PAJAK)
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-neutral-400">
                                        {pajakHistories.length} total
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {pajakHistories.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500 dark:border-neutral-700">
                                        Belum ada riwayat dokumen Pajak.{' '}
                                        <Link
                                            href="/documents/create/pajak"
                                            className="font-semibold text-amber-600 underline"
                                        >
                                            Buat Pajak Sekarang
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        {/* Search Input PAJAK */}
                                        <div className="space-y-1.5">
                                            <div className="relative">
                                                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400" />
                                                <Input
                                                    type="text"
                                                    value={pajakSearch}
                                                    onChange={(e) =>
                                                        setPajakSearch(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Cari nopol / nama pemilik PAJAK..."
                                                    className="h-8 pr-8 pl-8 text-xs"
                                                />
                                                {pajakSearch && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setPajakSearch('')
                                                        }
                                                        className="absolute top-1/2 right-2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                                    >
                                                        <X className="size-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-neutral-500">
                                                <span>
                                                    {pajakSearch.trim()
                                                        ? `Hasil pencarian (maks 5): ${displayedPajakHistories.length} item`
                                                        : `10 dokumen terbaru (${displayedPajakHistories.length} ditampilkan)`}
                                                </span>
                                                {selectedPajak && (
                                                    <span className="font-medium text-amber-600 dark:text-amber-400">
                                                        Terpilih:{' '}
                                                        {selectedPajak.nopol}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
                                            {/* Option None */}
                                            <div
                                                onClick={() =>
                                                    setSelectedPajakId(null)
                                                }
                                                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition-all ${
                                                    selectedPajakId === null
                                                        ? 'border-neutral-900 bg-neutral-900/5 font-semibold text-neutral-900 dark:border-neutral-200 dark:bg-neutral-100/5 dark:text-neutral-100'
                                                        : 'border-sidebar-border text-neutral-500 hover:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                                                }`}
                                            >
                                                <span>
                                                    -- Tanpa Dokumen Pajak
                                                    (Kosongkan) --
                                                </span>
                                                {selectedPajakId === null && (
                                                    <Check className="size-4 text-neutral-900 dark:text-neutral-100" />
                                                )}
                                            </div>

                                            {displayedPajakHistories.length ===
                                            0 ? (
                                                <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-xs text-neutral-500 dark:border-neutral-700">
                                                    Tidak ada dokumen PAJAK yang
                                                    cocok dengan kata kunci
                                                    &quot;{pajakSearch}&quot;.
                                                </div>
                                            ) : (
                                                displayedPajakHistories.map(
                                                    (item) => {
                                                        const isSelected =
                                                            selectedPajakId ===
                                                            item.id;
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                onClick={() =>
                                                                    setSelectedPajakId(
                                                                        item.id,
                                                                    )
                                                                }
                                                                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${
                                                                    isSelected
                                                                        ? 'border-amber-600 bg-amber-50/50 shadow-sm dark:border-amber-500 dark:bg-amber-950/20'
                                                                        : 'border-sidebar-border hover:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className={`flex size-5 items-center justify-center rounded-full border text-[10px] ${
                                                                            isSelected
                                                                                ? 'border-amber-600 bg-amber-600 text-white'
                                                                                : 'border-neutral-300 dark:border-neutral-700'
                                                                        }`}
                                                                    >
                                                                        {isSelected && (
                                                                            <Check className="size-3" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                            {
                                                                                item.nopol
                                                                            }
                                                                        </div>
                                                                        <div className="text-[11px] text-neutral-500">
                                                                            {
                                                                                item.nama_pemilik
                                                                            }{' '}
                                                                            &bull;{' '}
                                                                            {
                                                                                item.created_at_human
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                                                    ID: #
                                                                    {item.id}
                                                                </span>
                                                            </div>
                                                        );
                                                    },
                                                )
                                            )}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right 5 Cols: Exact Print Layout Visualizer */}
                    <div className="flex flex-col gap-4 lg:col-span-5">
                        <Card className="h-full border-sidebar-border/80">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Printer className="size-4 text-neutral-500" />
                                        <CardTitle className="text-base">
                                            Posisi Cetak Word (.docx)
                                        </CardTitle>
                                    </div>
                                    <span className="rounded border px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">
                                        Margin: 1.27 cm
                                    </span>
                                </div>
                                <CardDescription className="text-xs">
                                    Spesifikasi koordinat cetak persis sesuai
                                    setting dokumen Word
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Visual 2-Page representation */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Page 1 (Belakang) */}
                                    <div className="flex flex-col rounded-lg border border-sidebar-border bg-neutral-100/70 p-3 dark:bg-neutral-900/60">
                                        <div className="mb-2 flex items-center justify-between border-b pb-1 text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                                            <span>HALAMAN 1</span>
                                            <span className="text-[10px] font-normal text-neutral-500">
                                                (Belakang)
                                            </span>
                                        </div>

                                        {/* Slot Belakang STNK */}
                                        <div
                                            className={`mb-2 flex flex-col justify-center rounded border p-2 text-center transition-all ${
                                                selectedStnkId !== null
                                                    ? 'border-emerald-300 bg-emerald-500/10 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300'
                                                    : 'border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950'
                                            }`}
                                        >
                                            <div className="text-[11px] font-semibold">
                                                Belakang STNK
                                            </div>
                                            <div className="font-mono text-[9px] text-neutral-500">
                                                X: 1.27 cm | Y: 0.00 cm
                                            </div>
                                            <div className="mt-0.5 text-[9px]">
                                                {selectedStnkId !== null
                                                    ? '✓ Disertakan'
                                                    : '- Kosong'}
                                            </div>
                                        </div>

                                        {/* Slot Belakang PAJAK */}
                                        <div
                                            className={`flex flex-col justify-center rounded border p-2 text-center transition-all ${
                                                selectedPajakId !== null
                                                    ? 'border-amber-300 bg-amber-500/10 text-amber-800 dark:border-amber-800 dark:text-amber-300'
                                                    : 'border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950'
                                            }`}
                                        >
                                            <div className="text-[11px] font-semibold">
                                                Belakang PAJAK
                                            </div>
                                            <div className="font-mono text-[9px] text-neutral-500">
                                                X: 2.00 cm | Y: 9.53 cm
                                            </div>
                                            <div className="mt-0.5 text-[9px]">
                                                {selectedPajakId !== null
                                                    ? '✓ Disertakan'
                                                    : '- Kosong'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Page 2 (Depan / Output) */}
                                    <div className="flex flex-col rounded-lg border border-sidebar-border bg-neutral-100/70 p-3 dark:bg-neutral-900/60">
                                        <div className="mb-2 flex items-center justify-between border-b pb-1 text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                                            <span>HALAMAN 2</span>
                                            <span className="text-[10px] font-normal text-neutral-500">
                                                (Depan/Output)
                                            </span>
                                        </div>

                                        {/* Slot Output STNK */}
                                        <div
                                            className={`mb-2 flex flex-col justify-center rounded border p-2 text-center transition-all ${
                                                selectedStnkId !== null
                                                    ? 'border-emerald-300 bg-emerald-500/10 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300'
                                                    : 'border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950'
                                            }`}
                                        >
                                            <div className="text-[11px] font-semibold">
                                                Output STNK
                                            </div>
                                            <div className="font-mono text-[9px] text-neutral-500">
                                                X: 3.51 cm | Y: 1.28 cm
                                            </div>
                                            <div className="mt-0.5 truncate text-[9px] font-medium">
                                                {selectedStnk
                                                    ? selectedStnk.nopol
                                                    : '- Kosong'}
                                            </div>
                                        </div>

                                        {/* Slot Output PAJAK */}
                                        <div
                                            className={`flex flex-col justify-center rounded border p-2 text-center transition-all ${
                                                selectedPajakId !== null
                                                    ? 'border-amber-300 bg-amber-500/10 text-amber-800 dark:border-amber-800 dark:text-amber-300'
                                                    : 'border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950'
                                            }`}
                                        >
                                            <div className="text-[11px] font-semibold">
                                                Output PAJAK
                                            </div>
                                            <div className="font-mono text-[9px] text-neutral-500">
                                                X: 3.51 cm | Y: 11.54 cm
                                            </div>
                                            <div className="mt-0.5 truncate text-[9px] font-medium">
                                                {selectedPajak
                                                    ? selectedPajak.nopol
                                                    : '- Kosong'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Coordinate Details Box */}
                                <div className="space-y-2 rounded-lg border border-sidebar-border bg-neutral-50 p-3 text-xs dark:bg-neutral-900/40">
                                    <div className="flex items-center gap-1.5 font-semibold text-neutral-700 dark:text-neutral-300">
                                        <FileCheck className="size-3.5 text-neutral-500" />
                                        <span>Detail Parameter Cetak:</span>
                                    </div>
                                    <ul className="list-disc space-y-1 pl-4 text-[11px] text-neutral-600 dark:text-neutral-400">
                                        <li>
                                            Kertas:{' '}
                                            <strong>
                                                A4 Landscape (29.7 cm × 21.0 cm)
                                            </strong>
                                        </li>
                                        <li>
                                            Margin:{' '}
                                            <strong>
                                                Narrow (1.27 cm keliling)
                                            </strong>
                                        </li>
                                        <li>
                                            Ukuran Gambar:{' '}
                                            <strong>
                                                Tinggi 7.6 cm (Lock Ratio)
                                            </strong>{' '}
                                            &bull; STNK: 22.37 cm &bull; PAJAK:
                                            21.65 cm
                                        </li>
                                        <li>
                                            Posisi gambar terkunci presisi
                                            sehingga tidak bergeser saat
                                            dicetak.
                                        </li>
                                        <li>
                                            Nama file download:{' '}
                                            <code className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                                {targetFilename}
                                            </code>
                                        </li>
                                    </ul>
                                </div>

                                {/* Quick download trigger */}
                                <Button
                                    onClick={handleDownload}
                                    disabled={!hasSelection || isDownloading}
                                    className="w-full gap-2 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
                                >
                                    {isDownloading ? (
                                        <>
                                            <Spinner className="size-4" />
                                            <span>Memproses File Word...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="size-4" />
                                            <span>
                                                Download File Word (.docx)
                                            </span>
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
