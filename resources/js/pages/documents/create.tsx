import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Download,
    Eye,
    Image as ImageIcon,
    RefreshCw,
    Save,
    Type,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { LoadingOverlay } from '@/components/loading-overlay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

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
    fields: TemplateField[];
}

interface CreateDocumentProps {
    templates?: TemplateItem[];
    selectedTemplate?: TemplateItem;
}

const STNK_DEFAULTS: Record<string, string> = {
    nopol: 'S 1234 WL',
    'nama-pemilik': 'NAMA LENGKAP',
    alamat1: 'DSN. TEMPAT RW01/02 DS. TEMPAT',
    alamat2: 'MOJOAGUNG JOMBANG',
    merk: 'HONDA',
    type: 'NF11B21 MT',
    jenis: 'SEPEDA MOTOR',
    model: 'SEPEDA MOTOR',
    'tahun-pembuatan': '2013',
    silinder: '108',
    'warna-tnkb': 'HITAM',
    'nomor-rangka': 'MH1JBB11',
    'nomor-mesin': 'JBB11',
    warna: 'HITAM',
    'bahan-bakar': 'BENSIN',
    'tahun-regristasi': '2014',
    'nomor-bpkb': 'L-0402123',
    'nomor-urut': '000000000000000000',
    'tanggal-stnk': '20-08-2015',
    'lokasi-samsat': 'SAMSAT JOMBANG',
    'provinsi-samsat': 'JAWA TIMUR',
    'tanggal-bayar': '20-08-2010',
};

const PAJAK_DEFAULTS: Record<string, string> = {
    nopol: 'S 1234 WL',
    'nama-pemilik': 'NAMA LENGKAP',
    alamat1: 'NAMA TEMPAT',
    alamat2: 'RW01/02 / SBY / DS. TEMPAT',
    alamat3: 'MOJOAGUNG',
    merk: 'HONDA / NF11B21 MT',
    jenis: 'SEPEDA MOTOR',
    model: 'SEPEDA MOTOR',
    'tahun-cc': '2013/100',
    warna: 'HITAM',
    'nomor-rangka': 'MH1JBB11',
    'nomor-mesin': 'JBB11',
    'tanggal-faktur': '15-08-2010',
    'tanggal-pajak': '20-08-2015',
    'nopol-lama': '-',
    'tanggal-bayar': '19-08-2014',
    'tahun-bayar': '14',
};

function getDefaultFormData(selectedTemplate?: TemplateItem): Record<string, string> {
    if (!selectedTemplate) return {};
    const fallback =
        selectedTemplate.name?.toUpperCase() === 'PAJAK'
            ? { ...PAJAK_DEFAULTS }
            : { ...STNK_DEFAULTS };

    const dynamicDefaults: Record<string, string> = {};
    if (selectedTemplate.fields && selectedTemplate.fields.length > 0) {
        selectedTemplate.fields.forEach((field) => {
            if (field.default_value !== undefined && field.default_value !== null) {
                dynamicDefaults[field.field_name] = field.default_value;
            }
        });
    }

    return { ...fallback, ...dynamicDefaults };
}

export default function CreateDocument({
    templates = [],
    selectedTemplate,
}: CreateDocumentProps) {
    const [formData, setFormData] = useState<Record<string, string>>(() =>
        getDefaultFormData(selectedTemplate),
    );

    useEffect(() => {
        setFormData(getDefaultFormData(selectedTemplate));
        setPreviewImage(null);
    }, [selectedTemplate?.id]);

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewProgress, setPreviewProgress] = useState(0);
    const [previewStage, setPreviewStage] = useState('');

    const [isSavingToDb, setIsSavingToDb] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generateProgress, setGenerateProgress] = useState(0);
    const [generateStage, setGenerateStage] = useState('');

    const [rawBgModalOpen, setRawBgModalOpen] = useState(false);

    const handleInputChange = (fieldName: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
    };

    const handleTemplateSelect = (templateId: number) => {
        if (templateId === selectedTemplate?.id) return;
        setPreviewImage(null);
        router.get(`/documents/create/${templateId}`);
    };

    // Action 1: Preview on-the-fly (RAM only, no DB save)
    const handlePreview = async () => {
        if (!selectedTemplate) return;
        setIsPreviewLoading(true);
        setPreviewProgress(20);
        setPreviewStage('Memvalidasi input data formulir...');

        try {
            const token = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') || '';

            setPreviewProgress(70);
            setPreviewStage(`Merender pratinjau ${selectedTemplate.name}...`);

            const res = await fetch('/documents/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify({
                    template_id: selectedTemplate.id,
                    input_data: formData,
                }),
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                setPreviewImage(data.preview_url);
                setPreviewProgress(100);
                setPreviewStage('Pratinjau siap ditampilkan!');
                toast.success(
                    'Pratinjau dokumen berhasil dimuat!',
                );
            } else {
                toast.error(data.message || 'Failed to generate preview.');
            }
        } catch {
            toast.error('Error connecting to preview API.');
        } finally {
            setIsPreviewLoading(false);
        }
    };

    // Action 2: Save JSON directly to DB only (no file download)
    const handleSaveToDatabase = async () => {
        if (!selectedTemplate) return;
        setIsSavingToDb(true);

        try {
            const token = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');
            const res = await fetch('/documents/store', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token || '',
                },
                body: JSON.stringify({
                    template_id: selectedTemplate.id,
                    input_data: formData,
                }),
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                toast.success('Dokumen berhasil disimpan ke database!');
            } else {
                toast.error(data.message || 'Gagal menyimpan dokumen.');
            }
        } catch {
            toast.error('Gagal terhubung ke server saat menyimpan.');
        } finally {
            setIsSavingToDb(false);
        }
    };

    // Action 3: Save JSON to DB & Download rendered PNG
    const handleSaveAndDownload = async () => {
        if (!selectedTemplate) return;
        setIsGenerating(true);
        setGenerateProgress(20);
        setGenerateStage('Menyimpan data payload ke history...');

        try {
            const token = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') || '';

            setGenerateProgress(70);
            setGenerateStage(`Membuat file ${selectedTemplate.name}...`);

            const res = await fetch('/documents/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'image/png, application/json',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify({
                    template_id: selectedTemplate.id,
                    input_data: formData,
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to generate document');
            }

            const blob = await res.blob();
            setGenerateProgress(100);
            setGenerateStage('File PNG siap! Membuka unduhan...');

            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `doc-${selectedTemplate.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            toast.success('Document saved & downloaded successfully!');
        } catch (err: any) {
            toast.error(err.message || 'Failed to save and generate document.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Fill sample dummy data for quick testing
    const handleFillSampleData = () => {
        setFormData(getDefaultFormData(selectedTemplate));
        toast.info(`Sample data ${selectedTemplate?.name || ''} diisi.`);
    };

    const getFontBadge = (style?: string) => {
        switch (style) {
            case 'font_b':
                return {
                    label: 'Font B (Bold Official)',
                    className:
                        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
                };
            case 'font_c':
                return {
                    label: 'Font C (Typewriter Accent)',
                    className:
                        'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
                };
            case 'stnk':
                return {
                    label: 'Font STNK',
                    className:
                        'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
                };
            case 'pajak':
            case 'pajak_regular_u':
                return {
                    label: 'Font Pajak (Reg-U)',
                    className:
                        'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
                };
            case 'pajak_regular_b':
                return {
                    label: 'Font Pajak (Reg-B)',
                    className:
                        'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
                };
            case 'pajak_bold':
                return {
                    label: 'Font Pajak (Bold)',
                    className:
                        'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
                };
            default:
                return {
                    label: 'Font A (Clean Sans)',
                    className:
                        'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
                };
        }
    };

    return (
        <>
            <Head title={`Input ${selectedTemplate?.name || 'Document'}`} />

            {/* Loading Overlays with Percentage */}
            <LoadingOverlay
                isOpen={isPreviewLoading}
                progress={previewProgress}
                stageText={previewStage}
                title={`Merender Preview ${selectedTemplate?.name || 'Dokumen'}`}
                type="preview"
                badge="Preview"
            />
            <LoadingOverlay
                isOpen={isGenerating}
                progress={generateProgress}
                stageText={generateStage}
                title={`Mengunduh ${selectedTemplate?.name || 'Dokumen'}`}
                type="download"
                badge="PNG"
            />
            <LoadingOverlay
                isOpen={isSavingToDb}
                title="Menyimpan ke Database"
                type="save"
                badge="History"
            />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    Generate {selectedTemplate?.name}
                                </h1>
                                <Badge
                                    variant="secondary"
                                    className="font-mono text-xs"
                                >
                                    Template #{selectedTemplate?.id}
                                </Badge>
                                {selectedTemplate?.name === 'PAJAK' && (
                                    <Badge className="bg-indigo-600 text-xs text-white">
                                        Multi-Font (Bold, Reg-U, Reg-B)
                                    </Badge>
                                )}
                                {selectedTemplate?.name === 'STNK' && (
                                    <Badge className="bg-emerald-600 text-xs text-white">
                                        STNK Font Pack
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-neutral-500">
                                Isi data formulir untuk menghasilkan dokumen sesuai template.
                            </p>
                        </div>
                    </div>

                    {/* Template Switcher */}
                    <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-neutral-100 p-1 dark:bg-neutral-900">
                        {templates.map((tpl) => (
                            <Button
                                key={tpl.id}
                                size="sm"
                                variant={
                                    tpl.id === selectedTemplate?.id
                                        ? 'default'
                                        : 'ghost'
                                }
                                className="h-8 text-xs font-medium"
                                onClick={() => handleTemplateSelect(tpl.id)}
                            >
                                {tpl.name}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* TOP: Preview Panel */}
                    <Card className="border-sidebar-border/80">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base">
                                    Pratinjau Dokumen
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Tampilan hasil dokumen sebelum disimpan atau diunduh
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                onClick={() => setRawBgModalOpen(true)}
                            >
                                <ImageIcon className="size-3.5" />
                                Latar Template
                            </Button>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="relative flex min-h-[380px] w-full items-center justify-center overflow-hidden rounded-xl border border-sidebar-border bg-neutral-950/5 p-4 dark:bg-neutral-900/50">
                                {isPreviewLoading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Spinner className="size-8 text-neutral-700 dark:text-neutral-200" />
                                        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                            Memuat pratinjau dokumen...
                                        </span>
                                    </div>
                                ) : previewImage ? (
                                    <div className="group relative flex justify-center">
                                        <img
                                            src={previewImage}
                                            alt="Live Document Preview"
                                            className="max-h-[500px] max-w-full rounded-lg border border-neutral-300 object-contain shadow-md dark:border-neutral-700"
                                        />
                                        <div className="absolute top-2 right-2 rounded bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold text-white opacity-25 shadow backdrop-blur">
                                            Pratinjau
                                        </div>
                                    </div>
                                ) : selectedTemplate ? (
                                    <div className="group relative flex justify-center">
                                        <img
                                            src={`/templates/${selectedTemplate.id}/background`}
                                            alt="Base Template Background"
                                            className="max-h-[500px] max-w-full rounded-lg border border-neutral-300 object-contain shadow-md dark:border-neutral-700"
                                        />
                                        <div className="absolute top-2 right-2 rounded bg-neutral-900/80 px-2 py-0.5 text-[10px] font-medium text-white opacity-25 shadow backdrop-blur">
                                            Base Template (800x600)
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center p-6 text-center text-neutral-400">
                                        <Eye className="size-6 text-neutral-500" />
                                        <p className="mt-2 text-sm font-medium">
                                            No Template Selected
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Font Legend */}
                            <div className="rounded-lg border border-sidebar-border bg-neutral-50 p-3 text-xs dark:bg-neutral-900/40">
                                <div className="mb-2 flex items-center gap-1.5 font-semibold text-neutral-700 dark:text-neutral-300">
                                    <Type className="size-3.5 text-neutral-500" />
                                    <span>Font Styles Reference:</span>
                                </div>
                                {selectedTemplate?.name === 'PAJAK' ? (
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                        <div className="flex items-center gap-2 rounded border border-purple-200 bg-white p-1.5 dark:border-purple-900 dark:bg-neutral-800">
                                            <span className="inline-block size-3 rounded bg-purple-600" />
                                            <div>
                                                <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-400">
                                                    Bold Font
                                                </div>
                                                <div className="text-[10px] text-neutral-500">
                                                    Nopol, Tgl Pajak
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 rounded border border-amber-200 bg-white p-1.5 dark:border-amber-900 dark:bg-neutral-800">
                                            <span className="inline-block size-3 rounded bg-amber-600" />
                                            <div>
                                                <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                                    Regular-U Font
                                                </div>
                                                <div className="text-[10px] text-neutral-500">
                                                    Nama, Alamat 1, 2, 3
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 rounded border border-orange-200 bg-white p-1.5 dark:border-orange-900 dark:bg-neutral-800">
                                            <span className="inline-block size-3 rounded bg-orange-600" />
                                            <div>
                                                <div className="text-[11px] font-semibold text-orange-700 dark:text-orange-400">
                                                    Regular-B Font
                                                </div>
                                                <div className="text-[10px] text-neutral-500">
                                                    Merk, Jenis, Model, dll.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 rounded border border-emerald-200 bg-white p-2 dark:border-emerald-900 dark:bg-neutral-800">
                                        <span className="inline-block size-3 rounded bg-emerald-600" />
                                        <div>
                                            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                                STNK Font Pack
                                            </div>
                                            <div className="text-[10px] text-neutral-500">
                                                Digunakan untuk seluruh field
                                                kolom kiri dan kolom kanan
                                                template STNK.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* BOTTOM: Form Panel */}
                    <Card className="border-sidebar-border/80">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base">
                                    Document Information
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Each field maps to specific coordinates and
                                    font styles
                                </CardDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-xs text-neutral-600 dark:text-neutral-400"
                                onClick={handleFillSampleData}
                            >
                                <RefreshCw className="size-3" />
                                Sample Data
                            </Button>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Inputs: 2 equal columns on desktop, 1 column on mobile */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {selectedTemplate?.fields?.map((field) => {
                                    const value =
                                        formData[field.field_name] || '';
                                    const max = field.max_chars || 50;
                                    const isNearLimit = value.length >= max;
                                    const fontInfo = getFontBadge(
                                        field.font_style,
                                    );

                                    return (
                                        <div
                                            key={field.id}
                                            className="space-y-1.5"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Label
                                                        htmlFor={
                                                            field.field_name
                                                        }
                                                        className="text-xs font-semibold capitalize"
                                                    >
                                                        {field.field_name.replace(
                                                            /_/g,
                                                            ' ',
                                                        )}
                                                    </Label>
                                                    <span
                                                        className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${fontInfo.className}`}
                                                    >
                                                        {fontInfo.label}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`font-mono text-[11px] ${
                                                        isNearLimit
                                                            ? 'font-semibold text-amber-600'
                                                            : 'text-neutral-400'
                                                    }`}
                                                >
                                                    {value.length}/{max} chars
                                                    (X:{field.start_x}, Y:
                                                    {field.start_y})
                                                </span>
                                            </div>
                                            <Input
                                                id={field.field_name}
                                                value={value}
                                                maxLength={max}
                                                onChange={(e) =>
                                                    handleInputChange(
                                                        field.field_name,
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={`Enter ${field.field_name.replace(/_/g, ' ')}...`}
                                                className="font-mono text-sm"
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1 gap-2"
                                    onClick={handlePreview}
                                    disabled={
                                        isPreviewLoading ||
                                        isSavingToDb ||
                                        isGenerating
                                    }
                                >
                                    {isPreviewLoading ? (
                                        <Spinner className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                    Preview Dokumen
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 gap-2 border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                                    onClick={handleSaveToDatabase}
                                    disabled={
                                        isSavingToDb ||
                                        isPreviewLoading ||
                                        isGenerating
                                    }
                                >
                                    {isSavingToDb ? (
                                        <Spinner className="size-4" />
                                    ) : (
                                        <Save className="size-4" />
                                    )}
                                    Simpan ke Database
                                </Button>

                                <Button
                                    type="button"
                                    className="flex-1 gap-2 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
                                    onClick={handleSaveAndDownload}
                                    disabled={
                                        isGenerating ||
                                        isSavingToDb ||
                                        isPreviewLoading
                                    }
                                >
                                    {isGenerating ? (
                                        <Spinner className="size-4" />
                                    ) : (
                                        <Download className="size-4" />
                                    )}
                                    Simpan & Unduh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modal: Raw Template Background */}
            <Dialog open={rawBgModalOpen} onOpenChange={setRawBgModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            Latar Template: {selectedTemplate?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Latar dasar template dokumen {selectedTemplate?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex min-h-[350px] items-center justify-center rounded-lg border border-sidebar-border bg-neutral-100 p-4 dark:bg-neutral-900">
                        {selectedTemplate && (
                            <img
                                src={`/templates/${selectedTemplate.id}/background`}
                                alt="Raw Template Background"
                                className="max-h-[500px] max-w-full rounded object-contain shadow-md"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
