import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { LoadingOverlay } from '@/components/loading-overlay';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Check,
    CheckCircle2,
    Download,
    FileCheck,
    FileSpreadsheet,
    FileStack,
    FileText,
    Layers,
    Printer,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';

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

export default function MergePage({ stnkHistories = [], pajakHistories = [] }: MergeProps) {
    const [selectedStnkId, setSelectedStnkId] = useState<number | null>(
        stnkHistories.length > 0 ? stnkHistories[0].id : null,
    );
    const [selectedPajakId, setSelectedPajakId] = useState<number | null>(
        pajakHistories.length > 0 ? pajakHistories[0].id : null,
    );
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    const selectedStnk = stnkHistories.find((item) => item.id === selectedStnkId);
    const selectedPajak = pajakHistories.find((item) => item.id === selectedPajakId);

    const hasSelection = selectedStnkId !== null || selectedPajakId !== null;

    // Determine target filename preview
    const targetNopol = selectedStnk?.nopol || selectedPajak?.nopol || 'DOKUMEN';
    const targetFilename = `${targetNopol.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}.docx`;

    const handleDownload = async () => {
        if (!hasSelection) return;

        setIsDownloading(true);
        setDownloadError(null);

        try {
            const token =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ||
                '';

            const response = await fetch('/documents/merge/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                },
                body: JSON.stringify({
                    stnk_history_id: selectedStnkId,
                    pajak_history_id: selectedPajakId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Gagal membuat file dokumen Word.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = targetFilename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            setDownloadError(err.message || 'Terjadi kesalahan saat mengunduh dokumen.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <>
            <Head title="Merge STNK & PAJAK (Word 2-Halaman)" />

            {/* Loading Overlay with Percentage */}
            <LoadingOverlay
                isOpen={isDownloading}
                title={`Menyusun Dokumen Word (${targetFilename})`}
                type="word"
                badge="Word (.docx)"
            />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="size-8">
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
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
                                Gabungkan output STNK dan PAJAK dari history ke dalam satu file Word (.docx) format A4 Landscape dengan posisi cetak presisi dan margin Narrow (1,27 cm).
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
                                    <span>Download .DOCX ({targetFilename})</span>
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
                                            <CardTitle className="text-base">1. Pilih Dokumen STNK</CardTitle>
                                            <CardDescription className="text-xs">
                                                Akan ditempatkan di Halaman 1 (Belakang STNK) & Halaman 2 (Output STNK)
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-neutral-400">
                                        {stnkHistories.length} item tersedia
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {stnkHistories.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500 dark:border-neutral-700">
                                        Belum ada data generate STNK di history.{' '}
                                        <Link href="/documents/create/stnk" className="font-semibold text-emerald-600 underline">
                                            Buat STNK Sekarang
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                        {/* Option None */}
                                        <div
                                            onClick={() => setSelectedStnkId(null)}
                                            className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition-all ${
                                                selectedStnkId === null
                                                    ? 'border-neutral-900 bg-neutral-900/5 font-semibold text-neutral-900 dark:border-neutral-200 dark:bg-neutral-100/5 dark:text-neutral-100'
                                                    : 'border-sidebar-border text-neutral-500 hover:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                                            }`}
                                        >
                                            <span>-- Tidak Menggunakan Dokumen STNK (Kosongkan) --</span>
                                            {selectedStnkId === null && <Check className="size-4 text-neutral-900 dark:text-neutral-100" />}
                                        </div>

                                        {stnkHistories.map((item) => {
                                            const isSelected = selectedStnkId === item.id;
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => setSelectedStnkId(item.id)}
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
                                                            {isSelected && <Check className="size-3" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                {item.nopol}
                                                            </div>
                                                            <div className="text-[11px] text-neutral-500">
                                                                {item.nama_pemilik} &bull; {item.created_at_human}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                                        ID: #{item.id}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
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
                                            <CardTitle className="text-base">2. Pilih Dokumen PAJAK</CardTitle>
                                            <CardDescription className="text-xs">
                                                Akan ditempatkan di Halaman 1 (Belakang PAJAK) & Halaman 2 (Output PAJAK)
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-neutral-400">
                                        {pajakHistories.length} item tersedia
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {pajakHistories.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500 dark:border-neutral-700">
                                        Belum ada data generate PAJAK di history.{' '}
                                        <Link href="/documents/create/pajak" className="font-semibold text-amber-600 underline">
                                            Buat PAJAK Sekarang
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                        {/* Option None */}
                                        <div
                                            onClick={() => setSelectedPajakId(null)}
                                            className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition-all ${
                                                selectedPajakId === null
                                                    ? 'border-neutral-900 bg-neutral-900/5 font-semibold text-neutral-900 dark:border-neutral-200 dark:bg-neutral-100/5 dark:text-neutral-100'
                                                    : 'border-sidebar-border text-neutral-500 hover:border-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                                            }`}
                                        >
                                            <span>-- Tidak Menggunakan Dokumen PAJAK (Kosongkan) --</span>
                                            {selectedPajakId === null && <Check className="size-4 text-neutral-900 dark:text-neutral-100" />}
                                        </div>

                                        {pajakHistories.map((item) => {
                                            const isSelected = selectedPajakId === item.id;
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => setSelectedPajakId(item.id)}
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
                                                            {isSelected && <Check className="size-3" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                                                {item.nopol}
                                                            </div>
                                                            <div className="text-[11px] text-neutral-500">
                                                                {item.nama_pemilik} &bull; {item.created_at_human}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                                        ID: #{item.id}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
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
                                        <CardTitle className="text-base">Posisi Cetak Word (.docx)</CardTitle>
                                    </div>
                                    <span className="rounded border px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">
                                        Margin: 1.27 cm
                                    </span>
                                </div>
                                <CardDescription className="text-xs">
                                    Spesifikasi koordinat cetak persis sesuai setting dokumen Word
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Visual 2-Page representation */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Page 1 (Belakang) */}
                                    <div className="flex flex-col rounded-lg border border-sidebar-border bg-neutral-100/70 p-3 dark:bg-neutral-900/60">
                                        <div className="mb-2 flex items-center justify-between border-b pb-1 text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                                            <span>HALAMAN 1</span>
                                            <span className="text-[10px] font-normal text-neutral-500">(Belakang)</span>
                                        </div>

                                        {/* Slot Belakang STNK */}
                                        <div
                                            className={`mb-2 flex flex-col justify-center rounded border p-2 text-center transition-all ${
                                                selectedStnkId !== null
                                                    ? 'border-emerald-300 bg-emerald-500/10 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300'
                                                    : 'border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950'
                                            }`}
                                        >
                                            <div className="text-[11px] font-semibold">Belakang STNK</div>
                                            <div className="text-[9px] font-mono text-neutral-500">
                                                X: 1.27 cm | Y: 0.00 cm
                                            </div>
                                            <div className="mt-0.5 text-[9px]">
                                                {selectedStnkId !== null ? '✓ Disertakan' : '- Kosong'}
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
                                            <div className="text-[11px] font-semibold">Belakang PAJAK</div>
                                            <div className="text-[9px] font-mono text-neutral-500">
                                                X: 2.00 cm | Y: 9.53 cm
                                            </div>
                                            <div className="mt-0.5 text-[9px]">
                                                {selectedPajakId !== null ? '✓ Disertakan' : '- Kosong'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Page 2 (Depan / Output) */}
                                    <div className="flex flex-col rounded-lg border border-sidebar-border bg-neutral-100/70 p-3 dark:bg-neutral-900/60">
                                        <div className="mb-2 flex items-center justify-between border-b pb-1 text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                                            <span>HALAMAN 2</span>
                                            <span className="text-[10px] font-normal text-neutral-500">(Depan/Output)</span>
                                        </div>

                                        {/* Slot Output STNK */}
                                        <div
                                            className={`mb-2 flex flex-col justify-center rounded border p-2 text-center transition-all ${
                                                selectedStnkId !== null
                                                    ? 'border-emerald-300 bg-emerald-500/10 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300'
                                                    : 'border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-950'
                                            }`}
                                        >
                                            <div className="text-[11px] font-semibold">Output STNK</div>
                                            <div className="text-[9px] font-mono text-neutral-500">
                                                X: 3.51 cm | Y: 1.28 cm
                                            </div>
                                            <div className="mt-0.5 truncate text-[9px] font-medium">
                                                {selectedStnk ? selectedStnk.nopol : '- Kosong'}
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
                                            <div className="text-[11px] font-semibold">Output PAJAK</div>
                                            <div className="text-[9px] font-mono text-neutral-500">
                                                X: 3.51 cm | Y: 11.54 cm
                                            </div>
                                            <div className="mt-0.5 truncate text-[9px] font-medium">
                                                {selectedPajak ? selectedPajak.nopol : '- Kosong'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Coordinate Details Box */}
                                <div className="rounded-lg border border-sidebar-border bg-neutral-50 p-3 text-xs space-y-2 dark:bg-neutral-900/40">
                                    <div className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                                        <FileCheck className="size-3.5 text-neutral-500" />
                                        <span>Detail Parameter Cetak:</span>
                                    </div>
                                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                                        <li>Kertas: <strong>A4 Landscape (29.7 cm × 21.0 cm)</strong></li>
                                        <li>Margin: <strong>Narrow (1.27 cm keliling)</strong></li>
                                        <li>Ukuran Gambar: <strong>Tinggi 7.6 cm (Lock Ratio)</strong> &bull; STNK: 22.37 cm &bull; PAJAK: 21.65 cm</li>
                                        <li>Posisi gambar menggunakan <strong>Absolute DrawingML Anchor</strong> sehingga tidak tergeser saat diprint.</li>
                                        <li>Nama file download: <code className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">{targetFilename}</code></li>
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
                                            <span>Download File Word (.docx)</span>
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
