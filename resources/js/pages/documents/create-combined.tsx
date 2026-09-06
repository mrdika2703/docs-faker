import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
import { LoadingOverlay } from '@/components/loading-overlay';
import { useState } from 'react';
import { toast } from 'sonner';

interface TemplateField {
    id: number;
    template_id: number;
    field_name: string;
    start_x: number;
    start_y: number;
    max_chars: number;
    default_value?: string | null;
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

    // STNK Exclusive
    stnk_alamat1: 'DSN. TEMPAT RW01/02 DS. TEMPAT',
    stnk_alamat2: 'MOJOAGUNG JOMBANG',
    stnk_merk: 'HONDA',
    stnk_type: 'NF11B21 MT',
    stnk_tahun_pembuatan: '2013',
    stnk_silinder: '108',
    stnk_tahun_regristasi: '2014',
    stnk_nomor_bpkb: 'L-0402123',
    stnk_tanggal_stnk: '20-08-2015',
    stnk_lokasi_samsat: 'SAMSAT JOMBANG',
    stnk_provinsi_samsat: 'JAWA TIMUR',
    stnk_tanggal_bayar: '20-08-2010',

    // PAJAK Exclusive
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
    const getInitialCombinedData = () => {
        const data = { ...DEFAULT_COMBINED_DATA };
        stnkTemplate?.fields?.forEach((f) => {
            if (f.default_value !== undefined && f.default_value !== null) {
                if (f.field_name === 'nopol') data.nopol = f.default_value;
                else if (f.field_name === 'nama-pemilik') data.nama_pemilik = f.default_value;
                else if (f.field_name === 'jenis') data.jenis = f.default_value;
                else if (f.field_name === 'model') data.model = f.default_value;
                else if (f.field_name === 'nomor-rangka') data.nomor_rangka = f.default_value;
                else if (f.field_name === 'nomor-mesin') data.nomor_mesin = f.default_value;
                else if (f.field_name === 'warna') data.warna = f.default_value;
                else if (f.field_name === 'alamat1') data.stnk_alamat1 = f.default_value;
                else if (f.field_name === 'alamat2') data.stnk_alamat2 = f.default_value;
                else if (f.field_name === 'merk') data.stnk_merk = f.default_value;
                else if (f.field_name === 'type') data.stnk_type = f.default_value;
                else if (f.field_name === 'tahun-pembuatan') data.stnk_tahun_pembuatan = f.default_value;
                else if (f.field_name === 'silinder') data.stnk_silinder = f.default_value;
                else if (f.field_name === 'tahun-regristasi') data.stnk_tahun_regristasi = f.default_value;
                else if (f.field_name === 'nomor-bpkb') data.stnk_nomor_bpkb = f.default_value;
                else if (f.field_name === 'tanggal-stnk') data.stnk_tanggal_stnk = f.default_value;
                else if (f.field_name === 'lokasi-samsat') data.stnk_lokasi_samsat = f.default_value;
                else if (f.field_name === 'provinsi-samsat') data.stnk_provinsi_samsat = f.default_value;
                else if (f.field_name === 'tanggal-bayar') data.stnk_tanggal_bayar = f.default_value;
            }
        });
        pajakTemplate?.fields?.forEach((f) => {
            if (f.default_value !== undefined && f.default_value !== null) {
                if (f.field_name === 'alamat1') data.pajak_alamat1 = f.default_value;
                else if (f.field_name === 'alamat2') data.pajak_alamat2 = f.default_value;
                else if (f.field_name === 'alamat3') data.pajak_alamat3 = f.default_value;
                else if (f.field_name === 'merk') data.pajak_merk = f.default_value;
                else if (f.field_name === 'tahun-cc') data.pajak_tahun_cc = f.default_value;
                else if (f.field_name === 'tanggal-faktur') data.pajak_tanggal_faktur = f.default_value;
                else if (f.field_name === 'tanggal-pajak') data.pajak_tanggal_pajak = f.default_value;
                else if (f.field_name === 'nopol-lama') data.pajak_nopol_lama = f.default_value;
                else if (f.field_name === 'tanggal-bayar') data.pajak_tanggal_bayar = f.default_value;
                else if (f.field_name === 'tahun-bayar') data.pajak_tahun_bayar = f.default_value;
            }
        });
        return data;
    };

    const [formData, setFormData] = useState<Record<string, string>>(() =>
        getInitialCombinedData(),
    );
    const [stnkPreview, setStnkPreview] = useState<string | null>(null);
    const [pajakPreview, setPajakPreview] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewProgress, setPreviewProgress] = useState(0);
    const [previewStage, setPreviewStage] = useState('');

    const [isSavingToDb, setIsSavingToDb] = useState(false);

    const [isGeneratingWord, setIsGeneratingWord] = useState(false);
    const [wordProgress, setWordProgress] = useState(0);
    const [wordStage, setWordStage] = useState('');

    const handleInputChange = (key: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleResetSample = () => {
        setFormData(getInitialCombinedData());
        toast.info('Formulir direset ke data konfigurasi default.');
    };

    // DB max_chars lookup helpers
    const getStnkMax = (fieldName: string, fallback = 50) => {
        const field = stnkTemplate?.fields?.find((f) => f.field_name === fieldName);
        return field?.max_chars ?? fallback;
    };

    const getPajakMax = (fieldName: string, fallback = 50) => {
        const field = pajakTemplate?.fields?.find((f) => f.field_name === fieldName);
        return field?.max_chars ?? fallback;
    };

    const getSharedMax = (stnkFieldName: string, pajakFieldName: string, fallback = 50) => {
        const stnkField = stnkTemplate?.fields?.find((f) => f.field_name === stnkFieldName);
        const pajakField = pajakTemplate?.fields?.find((f) => f.field_name === pajakFieldName);
        if (stnkField && pajakField) {
            return Math.min(stnkField.max_chars, pajakField.max_chars);
        }
        return stnkField?.max_chars ?? pajakField?.max_chars ?? fallback;
    };

    // Helper: Split unified form data into STNK and PAJAK payloads
    const splitCombinedPayload = (input: Record<string, string>) => {
        const nopol = input.nopol || 'S 1234 WL';
        const namaPemilik = input.nama_pemilik || 'NAMA LENGKAP';
        const jenis = input.jenis || 'SEPEDA MOTOR';
        const model = input.model || 'SEPEDA MOTOR';
        const nomorRangka = input.nomor_rangka || 'MH1JBB11';
        const nomorMesin = input.nomor_mesin || 'JBB11';
        const warna = input.warna || 'HITAM';

        const stnkData = {
            nopol,
            'nama-pemilik': namaPemilik,
            alamat1: input.stnk_alamat1 || 'DSN. TEMPAT RW01/02 DS. TEMPAT',
            alamat2: input.stnk_alamat2 || 'KEC. TEMPAT SBY',
            merk: input.stnk_merk || 'HONDA',
            type: input.stnk_type || 'NF11B21 MT',
            jenis,
            model,
            'tahun-pembuatan': input.stnk_tahun_pembuatan || '2010',
            silinder: input.stnk_silinder || '00100 CC',
            'nomor-rangka': nomorRangka,
            'nomor-mesin': nomorMesin,
            warna,
            'tahun-regristasi': input.stnk_tahun_regristasi || '2010',
            'nomor-bpkb': input.stnk_nomor_bpkb || 'B',
            'tanggal-stnk': input.stnk_tanggal_stnk || '20-08-2015',
            'lokasi-samsat': input.stnk_lokasi_samsat || 'SURABAYA,',
            'provinsi-samsat': input.stnk_provinsi_samsat || 'JAWA TIMUR',
            'tanggal-bayar': input.stnk_tanggal_bayar || '20-08-2010',
        };

        const pajakData = {
            nopol,
            'nama-pemilik': namaPemilik,
            alamat1: input.pajak_alamat1 || 'NAMA TEMPAT',
            alamat2: input.pajak_alamat2 || 'RW01/02 / SBY / DS. TEMPAT',
            alamat3: input.pajak_alamat3 || 'MOJOAGUNG',
            merk: input.pajak_merk || 'HONDA / NF11B21 MT',
            jenis,
            model,
            'tahun-cc': input.pajak_tahun_cc || '2013/100',
            warna,
            'nomor-rangka': nomorRangka,
            'nomor-mesin': nomorMesin,
            'tanggal-faktur': input.pajak_tanggal_faktur || '15-08-2010',
            'tanggal-pajak': input.pajak_tanggal_pajak || '20-08-2015',
            'nopol-lama': input.pajak_nopol_lama || '-',
            'tanggal-bayar': input.pajak_tanggal_bayar || '19-08-2014',
            'tahun-bayar': input.pajak_tahun_bayar || '14',
        };

        return { stnkData, pajakData };
    };

    // Action 1: Progressive Multi-Stage Real Preview
    const handlePreviewBoth = async () => {
        setIsPreviewLoading(true);
        setPreviewProgress(10);
        setPreviewStage('Memvalidasi input data...');

        const token = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || '';

        try {
            const { stnkData, pajakData } = splitCombinedPayload(formData);

            // Step 1: Render STNK Image
            setPreviewProgress(45);
            setPreviewStage('Merender pratinjau STNK...');

            const stnkRes = await fetch('/documents/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify({
                    template_id: stnkTemplate.id,
                    input_data: stnkData,
                }),
            });

            const stnkJson = await stnkRes.json();
            if (!stnkRes.ok || stnkJson.status !== 'success') {
                throw new Error(stnkJson.message || 'Gagal merender preview STNK.');
            }

            // Immediately set STNK preview
            setStnkPreview(stnkJson.preview_url);
            setPreviewProgress(60);
            setPreviewStage('STNK selesai! Memproses pratinjau Pajak...');

            // Step 2: Render PAJAK Image
            setPreviewProgress(88);
            setPreviewStage('Menyusun pratinjau Pajak...');

            const pajakRes = await fetch('/documents/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify({
                    template_id: pajakTemplate.id,
                    input_data: pajakData,
                }),
            });

            const pajakJson = await pajakRes.json();
            if (!pajakRes.ok || pajakJson.status !== 'success') {
                throw new Error(pajakJson.message || 'Gagal merender preview PAJAK.');
            }

            // Set PAJAK preview
            setPajakPreview(pajakJson.preview_url);
            setPreviewProgress(100);
            setPreviewStage('Pratinjau STNK & Pajak siap.');
            toast.success('Pratinjau STNK & Pajak berhasil dimuat.');
        } catch (err: any) {
            toast.error(err.message || 'Gagal merender live preview.');
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

    // Action 3: Save to DB & Download Word Document with real progress
    const handleGenerateWord = async () => {
        setIsGeneratingWord(true);
        setWordProgress(15);
        setWordStage('Menyimpan data STNK & PAJAK ke history...');

        try {
            const token = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') || '';

            setWordProgress(35);
            setWordStage('Merender gambar & menyusun 2 Halaman Word A4 Landscape...');

            const res = await fetch('/documents/combined/generate-word', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify({
                    input_data: formData,
                }),
            });

            if (!res.ok) {
                throw new Error('Gagal membuat dokumen Word.');
            }

            setWordProgress(80);
            setWordStage('Menerima payload file dokumen Word (.docx)...');

            const blob = await res.blob();
            setWordProgress(100);
            setWordStage('File siap! Membuka unduhan...');

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
        } catch (err: any) {
            toast.error(err.message || 'Gagal menyimpan & mengunduh dokumen Word.');
        } finally {
            setIsGeneratingWord(false);
        }
    };

    return (
        <>
            <Head title="Input STNK & PAJAK (1 Halaman)" />

            {/* Loading Overlays with Real Accurate Multi-Stage Progress */}
            <LoadingOverlay
                isOpen={isPreviewLoading}
                progress={previewProgress}
                stageText={previewStage}
                title="Merender Preview STNK & PAJAK"
                type="preview"
                badge="Pratinjau"
            />
            <LoadingOverlay
                isOpen={isGeneratingWord}
                progress={wordProgress}
                stageText={wordStage}
                title="Menyusun Dokumen Word (.docx)"
                type="word"
                badge="A4 Landscape"
            />
            <LoadingOverlay
                isOpen={isSavingToDb}
                title="Menyimpan ke Database"
                type="save"
                badge="History"
            />

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
                            Pratinjau Dokumen
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
                                        Pratinjau STNK
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Pratinjau tampilan dokumen STNK
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
                                            Memproses STNK...
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
                                        Pratinjau Pajak
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Pratinjau tampilan dokumen Pajak
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
                                            Memproses Pajak...
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
                                {(() => {
                                    const max = getSharedMax('nopol', 'nopol', 12);
                                    const val = formData.nopol || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="nopol"
                                                    className="text-xs font-semibold"
                                                >
                                                    Nomor Polisi (Nopol)
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-blue-600 dark:text-blue-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="nopol"
                                                value={formData.nopol}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'nopol',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono font-bold uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Nama Pemilik */}
                                {(() => {
                                    const max = getSharedMax('nama-pemilik', 'nama-pemilik', 50);
                                    const val = formData.nama_pemilik || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="nama_pemilik"
                                                    className="text-xs font-semibold"
                                                >
                                                    Nama Pemilik
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-blue-600 dark:text-blue-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="nama_pemilik"
                                                value={formData.nama_pemilik}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'nama_pemilik',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Jenis */}
                                {(() => {
                                    const max = getSharedMax('jenis', 'jenis', 20);
                                    const val = formData.jenis || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="jenis"
                                                    className="text-xs font-semibold"
                                                >
                                                    Jenis Kendaraan
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-blue-600 dark:text-blue-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="jenis"
                                                value={formData.jenis}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'jenis',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Model */}
                                {(() => {
                                    const max = getSharedMax('model', 'model', 20);
                                    const val = formData.model || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="model"
                                                    className="text-xs font-semibold"
                                                >
                                                    Model
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-blue-600 dark:text-blue-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="model"
                                                value={formData.model}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'model',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Nomor Rangka */}
                                {(() => {
                                    const max = getSharedMax('nomor-rangka', 'nomor-rangka', 20);
                                    const val = formData.nomor_rangka || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="nomor_rangka"
                                                    className="text-xs font-semibold"
                                                >
                                                    Nomor Rangka
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-blue-600 dark:text-blue-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="nomor_rangka"
                                                value={formData.nomor_rangka}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'nomor_rangka',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Nomor Mesin */}
                                {(() => {
                                    const max = getSharedMax('nomor-mesin', 'nomor-mesin', 20);
                                    const val = formData.nomor_mesin || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="nomor_mesin"
                                                    className="text-xs font-semibold"
                                                >
                                                    Nomor Mesin
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-blue-600 dark:text-blue-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="nomor_mesin"
                                                value={formData.nomor_mesin}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'nomor_mesin',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Warna */}
                                {(() => {
                                    const max = getSharedMax('warna', 'warna', 15);
                                    const val = formData.warna || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="warna"
                                                    className="text-xs font-semibold"
                                                >
                                                    Warna
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-blue-600 dark:text-blue-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="warna"
                                                value={formData.warna}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'warna',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono uppercase"
                                            />
                                        </div>
                                    );
                                })()}
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
                                {(() => {
                                    const max = getStnkMax('alamat1', 50);
                                    const val = formData.stnk_alamat1 || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="stnk_alamat1"
                                                    className="text-xs font-semibold"
                                                >
                                                    Alamat 1 (Dusun / Desa)
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="stnk_alamat1"
                                                value={formData.stnk_alamat1}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'stnk_alamat1',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Alamat 2 */}
                                {(() => {
                                    const max = getStnkMax('alamat2', 50);
                                    const val = formData.stnk_alamat2 || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="stnk_alamat2"
                                                    className="text-xs font-semibold"
                                                >
                                                    Alamat 2 (Kecamatan / Kota)
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="stnk_alamat2"
                                                value={formData.stnk_alamat2}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'stnk_alamat2',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Merk */}
                                {(() => {
                                    const max = getStnkMax('merk', 20);
                                    const val = formData.stnk_merk || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="stnk_merk"
                                                    className="text-xs font-semibold"
                                                >
                                                    Merk
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="stnk_merk"
                                                value={formData.stnk_merk}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'stnk_merk',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Type */}
                                {(() => {
                                    const max = getStnkMax('type', 20);
                                    const val = formData.stnk_type || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="stnk_type"
                                                    className="text-xs font-semibold"
                                                >
                                                    Type
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="stnk_type"
                                                value={formData.stnk_type}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'stnk_type',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Tahun Pembuatan */}
                                {(() => {
                                    const max = getStnkMax('tahun-pembuatan', 10);
                                    const val = formData.stnk_tahun_pembuatan || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="stnk_tahun_pembuatan"
                                                    className="text-xs font-semibold"
                                                >
                                                    Tahun Pembuatan
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="stnk_tahun_pembuatan"
                                                value={formData.stnk_tahun_pembuatan}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'stnk_tahun_pembuatan',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Silinder */}
                                {(() => {
                                    const max = getStnkMax('silinder', 12);
                                    const val = formData.stnk_silinder || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="stnk_silinder"
                                                    className="text-xs font-semibold"
                                                >
                                                    Silinder (Isi Silinder)
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="stnk_silinder"
                                                value={formData.stnk_silinder}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'stnk_silinder',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Tahun Registrasi */}
                                {(() => {
                                    const max = getStnkMax('tahun-regristasi', 6);
                                    const val = formData.stnk_tahun_regristasi || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="stnk_tahun_regristasi"
                                                    className="text-xs font-semibold"
                                                >
                                                    Tahun Registrasi
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="stnk_tahun_regristasi"
                                                value={formData.stnk_tahun_regristasi}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'stnk_tahun_regristasi',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Nomor BPKB */}
                                {(() => {
                                    const max = getStnkMax('nomor-bpkb', 20);
                                    const val = formData.stnk_nomor_bpkb || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="stnk_nomor_bpkb"
                                                    className="text-xs font-semibold"
                                                >
                                                    Nomor BPKB
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="stnk_nomor_bpkb"
                                                value={formData.stnk_nomor_bpkb}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'stnk_nomor_bpkb',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Lokasi Samsat */}
                                {(() => {
                                    const max = getStnkMax('lokasi-samsat', 20);
                                    const val = formData.stnk_lokasi_samsat || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="stnk_lokasi_samsat"
                                                    className="text-xs font-semibold"
                                                >
                                                    Lokasi Samsat
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="stnk_lokasi_samsat"
                                                value={formData.stnk_lokasi_samsat}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'stnk_lokasi_samsat',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Provinsi Samsat */}
                                {(() => {
                                    const max = getStnkMax('provinsi-samsat', 20);
                                    const val = formData.stnk_provinsi_samsat || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="stnk_provinsi_samsat"
                                                    className="text-xs font-semibold"
                                                >
                                                    Provinsi Samsat
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="stnk_provinsi_samsat"
                                                value={formData.stnk_provinsi_samsat}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'stnk_provinsi_samsat',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Tanggal Bayar STNK */}
                                {(() => {
                                    const max = getStnkMax('tanggal-bayar', 12);
                                    const val = formData.stnk_tanggal_bayar || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="stnk_tanggal_bayar"
                                                    className="text-xs font-semibold"
                                                >
                                                    Tanggal Bayar (Header STNK)
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="stnk_tanggal_bayar"
                                                value={formData.stnk_tanggal_bayar}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'stnk_tanggal_bayar',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Tanggal STNK */}
                                {(() => {
                                    const max = getStnkMax('tanggal-stnk', 12);
                                    const val = formData.stnk_tanggal_stnk || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="stnk_tanggal_stnk"
                                                    className="text-xs font-semibold"
                                                >
                                                    Tanggal STNK (Masa Berlaku)
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="stnk_tanggal_stnk"
                                                value={formData.stnk_tanggal_stnk}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'stnk_tanggal_stnk',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    );
                                })()}
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
                                {(() => {
                                    const max = getPajakMax('alamat1', 50);
                                    const val = formData.pajak_alamat1 || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="pajak_alamat1"
                                                    className="text-xs font-semibold"
                                                >
                                                    Alamat 1
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="pajak_alamat1"
                                                value={formData.pajak_alamat1}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'pajak_alamat1',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Alamat 2 */}
                                {(() => {
                                    const max = getPajakMax('alamat2', 50);
                                    const val = formData.pajak_alamat2 || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="pajak_alamat2"
                                                    className="text-xs font-semibold"
                                                >
                                                    Alamat 2
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="pajak_alamat2"
                                                value={formData.pajak_alamat2}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'pajak_alamat2',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Alamat 3 */}
                                {(() => {
                                    const max = getPajakMax('alamat3', 50);
                                    const val = formData.pajak_alamat3 || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="pajak_alamat3"
                                                    className="text-xs font-semibold"
                                                >
                                                    Alamat 3
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="pajak_alamat3"
                                                value={formData.pajak_alamat3}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'pajak_alamat3',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Merk */}
                                {(() => {
                                    const max = getPajakMax('merk', 40);
                                    const val = formData.pajak_merk || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="pajak_merk"
                                                    className="text-xs font-semibold"
                                                >
                                                    Merk / Type
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="pajak_merk"
                                                value={formData.pajak_merk}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'pajak_merk',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Tahun / CC */}
                                {(() => {
                                    const max = getPajakMax('tahun-cc', 12);
                                    const val = formData.pajak_tahun_cc || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="pajak_tahun_cc"
                                                    className="text-xs font-semibold"
                                                >
                                                    Tahun / CC
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="pajak_tahun_cc"
                                                value={formData.pajak_tahun_cc}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'pajak_tahun_cc',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs uppercase"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Tanggal Faktur */}
                                {(() => {
                                    const max = getPajakMax('tanggal-faktur', 20);
                                    const val = formData.pajak_tanggal_faktur || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="pajak_tanggal_faktur"
                                                    className="text-xs font-semibold"
                                                >
                                                    Tanggal Faktur
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="pajak_tanggal_faktur"
                                                value={formData.pajak_tanggal_faktur}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'pajak_tanggal_faktur',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Tanggal Pajak */}
                                {(() => {
                                    const max = getPajakMax('tanggal-pajak', 12);
                                    const val = formData.pajak_tanggal_pajak || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="pajak_tanggal_pajak"
                                                    className="text-xs font-semibold"
                                                >
                                                    Tanggal Pajak
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-purple-600 dark:text-purple-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="pajak_tanggal_pajak"
                                                value={formData.pajak_tanggal_pajak}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'pajak_tanggal_pajak',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs font-bold"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Nopol Lama */}
                                {(() => {
                                    const max = getPajakMax('nopol-lama', 12);
                                    const val = formData.pajak_nopol_lama || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="pajak_nopol_lama"
                                                    className="text-xs font-semibold"
                                                >
                                                    Nopol Lama
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="pajak_nopol_lama"
                                                value={formData.pajak_nopol_lama}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'pajak_nopol_lama',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Tanggal Bayar PAJAK */}
                                {(() => {
                                    const max = getPajakMax('tanggal-bayar', 12);
                                    const val = formData.pajak_tanggal_bayar || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="pajak_tanggal_bayar"
                                                    className="text-xs font-semibold"
                                                >
                                                    Tanggal Bayar Pajak
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="pajak_tanggal_bayar"
                                                value={formData.pajak_tanggal_bayar}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'pajak_tanggal_bayar',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    );
                                })()}

                                {/* Tahun Bayar */}
                                {(() => {
                                    const max = getPajakMax('tahun-bayar', 12);
                                    const val = formData.pajak_tahun_bayar || '';
                                    return (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor="pajak_tahun_bayar"
                                                    className="text-xs font-semibold"
                                                >
                                                    Tahun Bayar
                                                </Label>
                                                <span className={cn('font-mono text-[10px]', val.length >= max ? 'font-semibold text-amber-600' : 'text-neutral-400')}>
                                                    {val.length}/{max}
                                                </span>
                                            </div>
                                            <Input
                                                id="pajak_tahun_bayar"
                                                value={formData.pajak_tahun_bayar}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        'pajak_tahun_bayar',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono text-xs"
                                            />
                                        </div>
                                    );
                                })()}
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
                                    Pratinjau Dokumen
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
