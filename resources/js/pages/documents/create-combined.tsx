import { Badge } from '@/components/ui/badge';
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
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Download,
    Eye,
    FileSpreadsheet,
    FileStack,
    FileText,
    Layers,
    Printer,
    RefreshCw,
    Save,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface TemplateField {
    id: number;
    template_id: number;
    field_name: string;
    start_x: number;
    start_y: number;
    max_chars: number;
    font_style?: string;
}

interface TemplateItem {
    id: number;
    name: string;
    dummy_bg_path: string;
    fields?: TemplateField[];
}

interface CreateCombinedProps {
    stnkTemplate: TemplateItem;
    pajakTemplate: TemplateItem;
}

const DEFAULT_COMBINED_DATA = {
    // Shared
    nopol: 'S 1234 WL',
    nama_pemilik: 'NAMA LENGKAP',
    jenis: 'SEPEDA MOTOR',
    model: 'SEPEDA MOTOR',
    nomor_rangka: 'MH1JBB11',
    nomor_mesin: 'JBB11',
    warna: 'HITAM',

    // STNK Specific
    stnk_alamat1: 'DSN. TEMPAT RW01/02 DS. TEMPAT',
    stnk_alamat2: 'KEC. TEMPAT SBY',
    stnk_merk: 'HONDA',
    stnk_type: 'NF11B21 MT',
    stnk_tahun_pembuatan: '2010',
    stnk_silinder: '00100 CC',
    stnk_tahun_regristasi: '2010',
    stnk_nomor_bpkb: 'B',
    stnk_lokasi_samsat: 'SURABAYA,',
    stnk_provinsi_samsat: 'JAWA TIMUR',
    stnk_tanggal_bayar: '20-08-2010',
    stnk_tanggal_stnk: '20-08-2015',

    // PAJAK Specific
    pajak_alamat1: 'NAMA TEMPAT',
    pajak_alamat2: 'RW01/02 / SBY / DS. TEMPAT',
    pajak_alamat3: 'MOJOAGUNG',
    pajak_merk: 'HONDA / NF11B21 MT',
    pajak_tahun_cc: '2013/100',
    pajak_tanggal_faktur: '15-08-2010',
    pajak_tanggal_pajak: '20-08-2015',
    pajak_nopol_lama: '-',
    pajak_tanggal_bayar: '19-08-2014',
    pajak_tahun_bayar: '14',
};

export default function CreateCombinedPage({
    stnkTemplate,
    pajakTemplate,
}: CreateCombinedProps) {
    const [formData, setFormData] = useState<Record<string, string>>(
        DEFAULT_COMBINED_DATA,
    );
    const [stnkPreview, setStnkPreview] = useState<string | null>(null);
    const [pajakPreview, setPajakPreview] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isSavingToDb, setIsSavingToDb] = useState(false);
    const [isGeneratingWord, setIsGeneratingWord] = useState(false);

    const handleInputChange = (key: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleResetSample = () => {
        setFormData(DEFAULT_COMBINED_DATA);
        toast.info('Formulir direset ke data sampel gabungan default.');
    };

    // Action 1: Live RAM Preview for both
    const handlePreviewBoth = async () => {
        setIsPreviewLoading(true);
        try {
            const token = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');
            const res = await fetch('/documents/combined/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token || '',
                },
                body: JSON.stringify({
                    input_data: formData,
                }),
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                setStnkPreview(data.stnk_preview_url);
                setPajakPreview(data.pajak_preview_url);
                toast.success(
                    'Preview STNK & PAJAK berhasil di-render di RAM!',
                );
            } else {
                toast.error(data.message || 'Gagal membuat preview.');
            }
        } catch {
            toast.error('Gagal menghubungi API preview.');
        } finally {
            setIsPreviewLoading(false);
        }
    };

    // Action 2: Save to DB History only
    const handleSaveToDatabase = async () => {
        setIsSavingToDb(true);
        try {
            const token = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');
            const res = await fetch('/documents/combined/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token || '',
                },
                body: JSON.stringify({
                    input_data: formData,
                }),
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                toast.success(
                    'Dokumen STNK & PAJAK berhasil disimpan ke database history!',
                );
            } else {
                toast.error(data.message || 'Gagal menyimpan ke database.');
            }
        } catch {
            toast.error('Gagal terhubung ke server saat menyimpan.');
        } finally {
            setIsSavingToDb(false);
        }
    };

    // Action 3: Save to DB & Download Word Document
    const handleGenerateWord = async () => {
        setIsGeneratingWord(true);
        toast.info('Menyimpan ke DB & menyusun dokumen Word (A4 Landscape)...');

        try {
            const token = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');
            const res = await fetch('/documents/combined/generate-word', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'X-CSRF-TOKEN': token || '',
                },
                body: JSON.stringify({
                    input_data: formData,
                }),
            });

            if (!res.ok) {
                throw new Error('Gagal membuat dokumen Word.');
            }

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            const targetNopol = formData.nopol || 'DOKUMEN';
            a.download = `${targetNopol.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            toast.success('Dokumen Word (.docx) berhasil disimpan & diunduh!');
        } catch {
            toast.error('Gagal menyimpan & mengunduh dokumen Word.');
        } finally {
            setIsGeneratingWord(false);
        }
    };

    return (
        <>
            <Head title="Input STNK & PAJAK (1 Halaman)" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    Input STNK & PAJAK (All-in-One)
                                </h1>
                            </div>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Isi data STNK dan PAJAK sekaligus dalam 1
                                formulir terpadu. Input yang sama otomatis
                                disinkronkan ke kedua dokumen.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={handleResetSample}
                        >
                            <RefreshCw className="size-3.5" />
                            Reset Sampel
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={handlePreviewBoth}
                            disabled={
                                isPreviewLoading ||
                                isSavingToDb ||
                                isGeneratingWord
                            }
                        >
                            {isPreviewLoading ? (
                                <Spinner className="size-3.5" />
                            ) : (
                                <Eye className="size-3.5" />
                            )}
                            Preview Keduanya (RAM)
                        </Button>
                        <Button
                            size="sm"
                            className="gap-1.5 bg-neutral-900 text-xs text-white shadow-sm hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
                            onClick={handleGenerateWord}
                            disabled={
                                isGeneratingWord ||
                                isSavingToDb ||
                                isPreviewLoading
                            }
                        >
                            {isGeneratingWord ? (
                                <Spinner className="size-3.5" />
                            ) : (
                                <Download className="size-3.5" />
                            )}
                            Download Word (.docx)
                        </Button>
                    </div>
                </div>

                {/* Live Previews Panel (Stacked: STNK on Top, PAJAK on Bottom) */}
                <div className="flex flex-col gap-6">
                    {/* STNK Live Preview (Top) */}
                    <Card className="border-sidebar-border/80">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <FileText className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm">
                                        Preview STNK (RAM)
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Color Graded (Brightness -20, Contrast
                                        +29) &bull; Template #{stnkTemplate?.id}
                                    </CardDescription>
                                </div>
                            </div>
                            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                Posisi Atas (STNK)
                            </span>
                        </CardHeader>
                        <CardContent>
                            <div className="relative flex min-h-[260px] w-full items-center justify-center overflow-hidden rounded-lg border border-sidebar-border bg-neutral-950/5 p-3 dark:bg-neutral-900/50">
                                {isPreviewLoading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Spinner className="size-6 text-neutral-600" />
                                        <span className="text-xs text-neutral-500">
                                            Rendering STNK...
                                        </span>
                                    </div>
                                ) : stnkPreview ? (
                                    <img
                                        src={stnkPreview}
                                        alt="STNK Preview"
                                        className="max-h-[380px] max-w-full rounded border object-contain shadow-sm"
                                    />
                                ) : (
                                    <img
                                        src={`/templates/${stnkTemplate.id}/background`}
                                        alt="STNK Background"
                                        className="max-h-[380px] max-w-full rounded border object-contain opacity-80"
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* PAJAK Live Preview (Bottom) */}
                    <Card className="border-sidebar-border/80">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <FileSpreadsheet className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm">
                                        Preview PAJAK (RAM)
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Color Graded (Curve -20%, Brightness
                                        -15, Contrast +40) &bull; Template #
                                        {pajakTemplate?.id}
                                    </CardDescription>
                                </div>
                            </div>
                            <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                Posisi Bawah (PAJAK)
                            </span>
                        </CardHeader>
                        <CardContent>
                            <div className="relative flex min-h-[260px] w-full items-center justify-center overflow-hidden rounded-lg border border-sidebar-border bg-neutral-950/5 p-3 dark:bg-neutral-900/50">
                                {isPreviewLoading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Spinner className="size-6 text-neutral-600" />
                                        <span className="text-xs text-neutral-500">
                                            Rendering PAJAK...
                                        </span>
                                    </div>
                                ) : pajakPreview ? (
                                    <img
                                        src={pajakPreview}
                                        alt="PAJAK Preview"
                                        className="max-h-[380px] max-w-full rounded border object-contain shadow-sm"
                                    />
                                ) : (
                                    <img
                                        src={`/templates/${pajakTemplate.id}/background`}
                                        alt="PAJAK Background"
                                        className="max-h-[380px] max-w-full rounded border object-contain opacity-80"
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Form Fields: 3 Organized Sections */}
                <div className="flex flex-col gap-6">
                    {/* SECTION 1: DATA BERSAMA (SHARED) */}
                    <Card className="border-blue-200/80 bg-blue-50/20 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/10">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        <Sparkles className="size-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base text-blue-950 dark:text-blue-200">
                                            1. Data Bersama (Sinkron STNK &
                                            PAJAK)
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Input di bagian ini akan otomatis
                                            mengisi kolom STNK dan PAJAK secara
                                            bersamaan
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400"
                                >
                                    7 Kolom Terintegrasi
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {/* Nopol */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="nopol"
                                            className="text-xs font-semibold"
                                        >
                                            Nomor Polisi (Nopol)
                                        </Label>
                                        <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                                            STNK & PAJAK (Bold)
                                        </span>
                                    </div>
                                    <Input
                                        id="nopol"
                                        value={formData.nopol}
                                        maxLength={12}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'nopol',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono font-bold uppercase"
                                    />
                                </div>

                                {/* Nama Pemilik */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="nama_pemilik"
                                            className="text-xs font-semibold"
                                        >
                                            Nama Pemilik
                                        </Label>
                                        <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                                            STNK & PAJAK (Reg-U)
                                        </span>
                                    </div>
                                    <Input
                                        id="nama_pemilik"
                                        value={formData.nama_pemilik}
                                        maxLength={30}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'nama_pemilik',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono uppercase"
                                    />
                                </div>

                                {/* Jenis */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="jenis"
                                            className="text-xs font-semibold"
                                        >
                                            Jenis Kendaraan
                                        </Label>
                                        <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                                            STNK & PAJAK (Reg-B)
                                        </span>
                                    </div>
                                    <Input
                                        id="jenis"
                                        value={formData.jenis}
                                        maxLength={20}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'jenis',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono uppercase"
                                    />
                                </div>

                                {/* Model */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="model"
                                            className="text-xs font-semibold"
                                        >
                                            Model
                                        </Label>
                                        <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                                            STNK & PAJAK (Reg-B)
                                        </span>
                                    </div>
                                    <Input
                                        id="model"
                                        value={formData.model}
                                        maxLength={20}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'model',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono uppercase"
                                    />
                                </div>

                                {/* Nomor Rangka */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="nomor_rangka"
                                            className="text-xs font-semibold"
                                        >
                                            Nomor Rangka
                                        </Label>
                                        <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                                            STNK & PAJAK (Reg-B)
                                        </span>
                                    </div>
                                    <Input
                                        id="nomor_rangka"
                                        value={formData.nomor_rangka}
                                        maxLength={20}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'nomor_rangka',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono uppercase"
                                    />
                                </div>

                                {/* Nomor Mesin */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="nomor_mesin"
                                            className="text-xs font-semibold"
                                        >
                                            Nomor Mesin
                                        </Label>
                                        <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                                            STNK & PAJAK (Reg-B)
                                        </span>
                                    </div>
                                    <Input
                                        id="nomor_mesin"
                                        value={formData.nomor_mesin}
                                        maxLength={20}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'nomor_mesin',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono uppercase"
                                    />
                                </div>

                                {/* Warna */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label
                                            htmlFor="warna"
                                            className="text-xs font-semibold"
                                        >
                                            Warna
                                        </Label>
                                        <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                                            STNK & PAJAK (Reg-B)
                                        </span>
                                    </div>
                                    <Input
                                        id="warna"
                                        value={formData.warna}
                                        maxLength={15}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'warna',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono uppercase"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SECTION 2: DATA KHUSUS STNK */}
                    <Card className="border-sidebar-border/80">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <FileText className="size-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">
                                            2. Data Khusus STNK
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Parameter alamat, spesifikasi
                                            teknis, dan administrasi khusus
                                            dokumen STNK
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
                                >
                                    12 Kolom STNK
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {/* Alamat 1 */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="stnk_alamat1"
                                        className="text-xs font-semibold"
                                    >
                                        Alamat 1 (Dusun / Desa)
                                    </Label>
                                    <Input
                                        id="stnk_alamat1"
                                        value={formData.stnk_alamat1}
                                        maxLength={35}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'stnk_alamat1',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>

                                {/* Alamat 2 */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="stnk_alamat2"
                                        className="text-xs font-semibold"
                                    >
                                        Alamat 2 (Kecamatan / Kota)
                                    </Label>
                                    <Input
                                        id="stnk_alamat2"
                                        value={formData.stnk_alamat2}
                                        maxLength={30}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'stnk_alamat2',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>

                                {/* Merk */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="stnk_merk"
                                        className="text-xs font-semibold"
                                    >
                                        Merk
                                    </Label>
                                    <Input
                                        id="stnk_merk"
                                        value={formData.stnk_merk}
                                        maxLength={20}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'stnk_merk',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>

                                {/* Type */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="stnk_type"
                                        className="text-xs font-semibold"
                                    >
                                        Type
                                    </Label>
                                    <Input
                                        id="stnk_type"
                                        value={formData.stnk_type}
                                        maxLength={20}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'stnk_type',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>

                                {/* Tahun Pembuatan */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="stnk_tahun_pembuatan"
                                        className="text-xs font-semibold"
                                    >
                                        Tahun Pembuatan
                                    </Label>
                                    <Input
                                        id="stnk_tahun_pembuatan"
                                        value={formData.stnk_tahun_pembuatan}
                                        maxLength={10}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'stnk_tahun_pembuatan',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs"
                                    />
                                </div>

                                {/* Silinder */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="stnk_silinder"
                                        className="text-xs font-semibold"
                                    >
                                        Silinder (Isi Silinder)
                                    </Label>
                                    <Input
                                        id="stnk_silinder"
                                        value={formData.stnk_silinder}
                                        maxLength={12}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'stnk_silinder',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>

                                {/* Tahun Registrasi */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="stnk_tahun_regristasi"
                                        className="text-xs font-semibold"
                                    >
                                        Tahun Registrasi
                                    </Label>
                                    <Input
                                        id="stnk_tahun_regristasi"
                                        value={formData.stnk_tahun_regristasi}
                                        maxLength={6}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'stnk_tahun_regristasi',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs"
                                    />
                                </div>

                                {/* Nomor BPKB */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="stnk_nomor_bpkb"
                                        className="text-xs font-semibold"
                                    >
                                        Nomor BPKB
                                    </Label>
                                    <Input
                                        id="stnk_nomor_bpkb"
                                        value={formData.stnk_nomor_bpkb}
                                        maxLength={20}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'stnk_nomor_bpkb',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>

                                {/* Lokasi Samsat */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="stnk_lokasi_samsat"
                                        className="text-xs font-semibold"
                                    >
                                        Lokasi Samsat
                                    </Label>
                                    <Input
                                        id="stnk_lokasi_samsat"
                                        value={formData.stnk_lokasi_samsat}
                                        maxLength={20}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'stnk_lokasi_samsat',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>

                                {/* Provinsi Samsat */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="stnk_provinsi_samsat"
                                        className="text-xs font-semibold"
                                    >
                                        Provinsi Samsat
                                    </Label>
                                    <Input
                                        id="stnk_provinsi_samsat"
                                        value={formData.stnk_provinsi_samsat}
                                        maxLength={20}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'stnk_provinsi_samsat',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>

                                {/* Tanggal Bayar STNK */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="stnk_tanggal_bayar"
                                        className="text-xs font-semibold"
                                    >
                                        Tanggal Bayar (Header STNK)
                                    </Label>
                                    <Input
                                        id="stnk_tanggal_bayar"
                                        value={formData.stnk_tanggal_bayar}
                                        maxLength={12}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'stnk_tanggal_bayar',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs"
                                    />
                                </div>

                                {/* Tanggal STNK */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="stnk_tanggal_stnk"
                                        className="text-xs font-semibold"
                                    >
                                        Tanggal STNK (Masa Berlaku)
                                    </Label>
                                    <Input
                                        id="stnk_tanggal_stnk"
                                        value={formData.stnk_tanggal_stnk}
                                        maxLength={12}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'stnk_tanggal_stnk',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SECTION 3: DATA KHUSUS PAJAK */}
                    <Card className="border-sidebar-border/80">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <FileSpreadsheet className="size-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">
                                            3. Data Khusus PAJAK
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Parameter alamat 3-baris, merk tipe
                                            gabung, faktur, dan tanggal bayar
                                            khusus lembar Pajak
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className="border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400"
                                >
                                    10 Kolom PAJAK
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {/* Alamat 1 */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="pajak_alamat1"
                                        className="text-xs font-semibold"
                                    >
                                        Alamat 1 (Reg-U)
                                    </Label>
                                    <Input
                                        id="pajak_alamat1"
                                        value={formData.pajak_alamat1}
                                        maxLength={35}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'pajak_alamat1',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>

                                {/* Alamat 2 */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="pajak_alamat2"
                                        className="text-xs font-semibold"
                                    >
                                        Alamat 2 (Reg-U)
                                    </Label>
                                    <Input
                                        id="pajak_alamat2"
                                        value={formData.pajak_alamat2}
                                        maxLength={30}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'pajak_alamat2',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>

                                {/* Alamat 3 */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="pajak_alamat3"
                                        className="text-xs font-semibold"
                                    >
                                        Alamat 3 (Reg-U)
                                    </Label>
                                    <Input
                                        id="pajak_alamat3"
                                        value={formData.pajak_alamat3}
                                        maxLength={30}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'pajak_alamat3',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>

                                {/* Merk */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="pajak_merk"
                                        className="text-xs font-semibold"
                                    >
                                        Merk / Type (Reg-B)
                                    </Label>
                                    <Input
                                        id="pajak_merk"
                                        value={formData.pajak_merk}
                                        maxLength={25}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'pajak_merk',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>

                                {/* Tahun / CC */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="pajak_tahun_cc"
                                        className="text-xs font-semibold"
                                    >
                                        Tahun / CC (Reg-B)
                                    </Label>
                                    <Input
                                        id="pajak_tahun_cc"
                                        value={formData.pajak_tahun_cc}
                                        maxLength={12}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'pajak_tahun_cc',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>

                                {/* Tanggal Faktur */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="pajak_tanggal_faktur"
                                        className="text-xs font-semibold"
                                    >
                                        Tanggal Faktur (Reg-B)
                                    </Label>
                                    <Input
                                        id="pajak_tanggal_faktur"
                                        value={formData.pajak_tanggal_faktur}
                                        maxLength={20}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'pajak_tanggal_faktur',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs"
                                    />
                                </div>

                                {/* Tanggal Pajak */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="pajak_tanggal_pajak"
                                        className="text-xs font-semibold"
                                    >
                                        Tanggal Pajak (Bold)
                                    </Label>
                                    <Input
                                        id="pajak_tanggal_pajak"
                                        value={formData.pajak_tanggal_pajak}
                                        maxLength={12}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'pajak_tanggal_pajak',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs font-bold"
                                    />
                                </div>

                                {/* Nopol Lama */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="pajak_nopol_lama"
                                        className="text-xs font-semibold"
                                    >
                                        Nopol Lama (Reg-B)
                                    </Label>
                                    <Input
                                        id="pajak_nopol_lama"
                                        value={formData.pajak_nopol_lama}
                                        maxLength={12}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'pajak_nopol_lama',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs"
                                    />
                                </div>

                                {/* Tanggal Bayar PAJAK */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="pajak_tanggal_bayar"
                                        className="text-xs font-semibold"
                                    >
                                        Tanggal Bayar Pajak (Reg-B)
                                    </Label>
                                    <Input
                                        id="pajak_tanggal_bayar"
                                        value={formData.pajak_tanggal_bayar}
                                        maxLength={12}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'pajak_tanggal_bayar',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs"
                                    />
                                </div>

                                {/* Tahun Bayar */}
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="pajak_tahun_bayar"
                                        className="text-xs font-semibold"
                                    >
                                        Tahun Bayar (Reg-B)
                                    </Label>
                                    <Input
                                        id="pajak_tahun_bayar"
                                        value={formData.pajak_tahun_bayar}
                                        maxLength={12}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'pajak_tahun_bayar',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ACTION PANEL */}
                    <Card className="border-sidebar-border/80">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                                Eksekusi & Download
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Pilih aksi penyimpanan atau ekspor dokumen Word
                                2-halaman A4 Landscape
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1 gap-2"
                                    onClick={handlePreviewBoth}
                                    disabled={
                                        isPreviewLoading ||
                                        isSavingToDb ||
                                        isGeneratingWord
                                    }
                                >
                                    {isPreviewLoading ? (
                                        <Spinner className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                    Preview Keduanya (RAM)
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 gap-2 border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                    onClick={handleSaveToDatabase}
                                    disabled={
                                        isSavingToDb ||
                                        isPreviewLoading ||
                                        isGeneratingWord
                                    }
                                >
                                    {isSavingToDb ? (
                                        <Spinner className="size-4" />
                                    ) : (
                                        <Save className="size-4" />
                                    )}
                                    Simpan ke Database (2 Dokumen)
                                </Button>

                                <Button
                                    type="button"
                                    className="flex-1 gap-2 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
                                    onClick={handleGenerateWord}
                                    disabled={
                                        isGeneratingWord ||
                                        isSavingToDb ||
                                        isPreviewLoading
                                    }
                                >
                                    {isGeneratingWord ? (
                                        <Spinner className="size-4" />
                                    ) : (
                                        <Download className="size-4" />
                                    )}
                                    Download Word (.docx)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
