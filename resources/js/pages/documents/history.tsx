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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { LoadingOverlay } from '@/components/loading-overlay';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    Download,
    Eye,
    FilePlus,
    History as HistoryIcon,
    Pencil,
    RefreshCw,
    Search,
    Trash2,
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

interface HistoryItem {
    id: number;
    template_id: number;
    template_name: string;
    template_fields?: TemplateField[];
    input_data: Record<string, string>;
    created_at: string;
    created_at_human: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface HistoryPageProps {
    histories: {
        data: HistoryItem[];
        links: PaginationLink[];
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
        from: number;
        to: number;
    };
}

export default function DocumentHistoryPage({ histories }: HistoryPageProps) {
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<HistoryItem[]>(histories.data);

    // Sync state when props change
    useState(() => {
        setItems(histories.data);
    });

    // Preview state
    const [previewDoc, setPreviewDoc] = useState<{
        title: string;
        imageUrl: string;
        inputData: Record<string, string>;
        createdAt: string;
        isLoading: boolean;
    } | null>(null);

    // Edit state
    const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);
    const [editFormData, setEditFormData] = useState<Record<string, string>>(
        {},
    );
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Delete state
    const [deletingItem, setDeletingItem] = useState<HistoryItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Download state
    const [isDownloadingItem, setIsDownloadingItem] = useState(false);
    const [downloadingTitle, setDownloadingTitle] = useState('');
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadStage, setDownloadStage] = useState('');

    // Preview state
    const [previewProgress, setPreviewProgress] = useState(0);
    const [previewStage, setPreviewStage] = useState('');

    const handleDownload = async (item: HistoryItem) => {
        setIsDownloadingItem(true);
        setDownloadingTitle(`${item.template_name} (#${item.id})`);
        setDownloadProgress(20);
        setDownloadStage(`Menyiapkan data payload #${item.id}...`);

        try {
            setDownloadProgress(70);
            setDownloadStage(`Menyiapkan file ${item.template_name}...`);

            const res = await fetch(`/documents/history/${item.id}/download`);
            if (!res.ok) throw new Error('Gagal mengunduh file.');

            const blob = await res.blob();
            setDownloadProgress(100);
            setDownloadStage('File siap! Membuka unduhan...');

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `doc-${item.template_name.toLowerCase().replace(/\s+/g, '-')}-${item.id}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Dokumen PNG berhasil diunduh!');
        } catch {
            toast.error('Gagal mengunduh dokumen.');
        } finally {
            setIsDownloadingItem(false);
        }
    };

    const filteredItems = items.filter((item) => {
        const query = search.toLowerCase();
        const templateMatch = item.template_name.toLowerCase().includes(query);
        const dataMatch = Object.values(item.input_data || {}).some((v) =>
            String(v).toLowerCase().includes(query),
        );
        const idMatch = String(item.id).includes(query);
        return templateMatch || dataMatch || idMatch;
    });

    // Handle Document Preview
    const handlePreview = async (item: HistoryItem) => {
        setPreviewProgress(20);
        setPreviewStage(`Memuat data ${item.template_name} (#${item.id})...`);

        setPreviewDoc({
            title: `${item.template_name} (#${item.id})`,
            imageUrl: '',
            inputData: item.input_data,
            createdAt: item.created_at,
            isLoading: true,
        });

        try {
            setPreviewProgress(70);
            setPreviewStage(`Menyiapkan pratinjau ${item.template_name}...`);

            const res = await fetch(`/documents/history/${item.id}/preview`, {
                headers: {
                    Accept: 'application/json',
                },
            });

            const data = await res.json();
            if (data.status === 'success') {
                setPreviewProgress(100);
                setPreviewStage('Preview siap!');
                setPreviewDoc({
                    title: `${item.template_name} (#${item.id})`,
                    imageUrl: data.preview_url,
                    inputData: item.input_data,
                    createdAt: item.created_at,
                    isLoading: false,
                });
            } else {
                toast.error(data.message || 'Gagal memuat preview.');
                setPreviewDoc(null);
            }
        } catch {
            toast.error('Gagal terhubung ke API preview.');
            setPreviewDoc(null);
        }
    };

    // Open Edit Modal
    const handleOpenEdit = (item: HistoryItem) => {
        setEditingItem(item);
        setEditFormData({ ...(item.input_data || {}) });
    };

    // Handle Edit Input Change
    const handleEditInputChange = (fieldKey: string, value: string) => {
        setEditFormData((prev) => ({
            ...prev,
            [fieldKey]: value,
        }));
    };

    // Save Edit
    const handleSaveEdit = async () => {
        if (!editingItem) return;
        setIsSavingEdit(true);

        try {
            const token = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const res = await fetch(`/documents/history/${editingItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token || '',
                },
                body: JSON.stringify({
                    input_data: editFormData,
                }),
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                toast.success('Data history berhasil diperbarui!');
                // Update local state
                setItems((prev) =>
                    prev.map((item) =>
                        item.id === editingItem.id
                            ? { ...item, input_data: editFormData }
                            : item,
                    ),
                );
                setEditingItem(null);
            } else {
                toast.error(data.message || 'Gagal menyimpan perubahan.');
            }
        } catch {
            toast.error('Gagal menghubungi server saat menyimpan.');
        } finally {
            setIsSavingEdit(false);
        }
    };

    // Confirm Delete
    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        setIsDeleting(true);

        try {
            const token = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const res = await fetch(`/documents/history/${deletingItem.id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token || '',
                },
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                toast.success('Data history berhasil dihapus!');
                // Update local state
                setItems((prev) =>
                    prev.filter((item) => item.id !== deletingItem.id),
                );
                setDeletingItem(null);
                router.reload();
            } else {
                toast.error(data.message || 'Gagal menghapus data.');
            }
        } catch {
            toast.error('Gagal menghubungi server saat menghapus.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Head title="History Dokumen" />

            {/* Loading Overlays with Percentage */}
            <LoadingOverlay
                isOpen={previewDoc?.isLoading === true}
                progress={previewProgress}
                stageText={previewStage}
                title={`Merender Preview ${previewDoc?.title || ''}`}
                type="preview"
                badge="Preview"
            />
            <LoadingOverlay
                isOpen={isDownloadingItem}
                progress={downloadProgress}
                stageText={downloadStage}
                title={`Mengunduh ${downloadingTitle}`}
                type="download"
                badge="PNG"
            />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                    History Dokumen
                                </h1>
                                <Badge
                                    variant="secondary"
                                    className="font-mono text-xs"
                                >
                                    {histories.total} Total
                                </Badge>
                            </div>
                            <p className="mt-1 text-sm text-neutral-500">
                                Kelola riwayat data input yang tersimpan. Anda
                                dapat mengedit payload JSON, melihat preview,
                                mengunduh PNG, atau menghapus riwayat.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/documents/create-combined">
                            <Button
                                size="sm"
                                className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                            >
                                <FilePlus className="size-4" />
                                Input Dokumen Baru
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Table Card */}
                <Card className="border-sidebar-border/80 shadow-sm">
                    <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-base">
                                Daftar Riwayat Dokumen
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Menampilkan {histories.from || 0} -{' '}
                                {histories.to || 0} dari {histories.total}{' '}
                                dokumen
                            </CardDescription>
                        </div>

                        {/* Search */}
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute top-2.5 left-2.5 size-4 text-neutral-400" />
                            <Input
                                placeholder="Cari nopol, nama, template, ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-9 pl-9 text-xs"
                            />
                        </div>
                    </CardHeader>

                    <CardContent>
                        {filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <HistoryIcon className="size-10 stroke-[1.5] text-neutral-400" />
                                <h3 className="mt-3 text-sm font-medium">
                                    Tidak ada dokumen ditemukan
                                </h3>
                                <p className="mt-1 text-xs text-neutral-500">
                                    {search
                                        ? 'Coba ubah kata kunci pencarian Anda.'
                                        : 'Belum ada dokumen yang tersimpan di history.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-sidebar-border/80 text-xs font-semibold text-neutral-500 uppercase">
                                        <tr>
                                            <th className="px-4 py-3"># ID</th>
                                            <th className="px-4 py-3">
                                                Template
                                            </th>
                                            <th className="px-4 py-3">Data</th>
                                            <th className="px-4 py-3">
                                                Waktu Simpan
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/60">
                                        {filteredItems.map((item) => {
                                            const isStnk =
                                                item.template_name.toUpperCase() ===
                                                'STNK';
                                            const tglStnkPajak =
                                                item.input_data?.[
                                                    'tanggal-stnk'
                                                ] ||
                                                item.input_data?.[
                                                    'tanggal-pajak'
                                                ] ||
                                                item.input_data?.[
                                                    'tahun-stnk'
                                                ] ||
                                                item.input_data?.[
                                                    'tahun-pajak'
                                                ] ||
                                                item.input_data?.[
                                                    'tahun-pembuatan'
                                                ] ||
                                                item.input_data?.[
                                                    'tahun-bayar'
                                                ] ||
                                                '-';

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30"
                                                >
                                                    <td className="px-4 py-3 font-mono text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                                        #{item.id}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge
                                                            variant={
                                                                isStnk
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                            className={
                                                                isStnk
                                                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                                    : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                                                            }
                                                        >
                                                            {item.template_name}
                                                        </Badge>
                                                    </td>
                                                    <td className="max-w-md px-4 py-3">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {/* Nopol */}
                                                            <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                                                <span className="text-[10px] font-semibold text-blue-600 uppercase dark:text-blue-400">
                                                                    Nopol:
                                                                </span>
                                                                <span className="font-mono uppercase">
                                                                    {item
                                                                        .input_data
                                                                        ?.nopol ||
                                                                        '-'}
                                                                </span>
                                                            </span>

                                                            {/* Merk */}
                                                            <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                                <span className="text-[10px] font-semibold text-neutral-500 uppercase">
                                                                    Merk:
                                                                </span>
                                                                <span className="font-mono font-medium uppercase">
                                                                    {item
                                                                        .input_data
                                                                        ?.merk ||
                                                                        '-'}
                                                                </span>
                                                            </span>

                                                            {/* Tgl STNK / Pajak */}
                                                            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                                <span className="text-[10px] font-semibold text-emerald-600 uppercase dark:text-emerald-400">
                                                                    {isStnk
                                                                        ? 'Tgl STNK:'
                                                                        : 'Tgl Pajak:'}
                                                                </span>
                                                                <span className="font-mono font-medium">
                                                                    {
                                                                        tglStnkPajak
                                                                    }
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs whitespace-nowrap text-neutral-500">
                                                        <div>
                                                            {item.created_at}
                                                        </div>
                                                        <div className="text-[11px] text-neutral-400">
                                                            {
                                                                item.created_at_human
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* Preview */}
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className="h-8 gap-1 text-xs"
                                                                onClick={() =>
                                                                    handlePreview(
                                                                        item,
                                                                    )
                                                                }
                                                                title="Pratinjau Dokumen"
                                                            >
                                                                <Eye className="size-3.5" />
                                                                Pratinjau
                                                            </Button>

                                                            {/* Edit */}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 gap-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                                                                onClick={() =>
                                                                    handleOpenEdit(
                                                                        item,
                                                                    )
                                                                }
                                                                title="Edit data JSON"
                                                            >
                                                                <Pencil className="size-3.5" />
                                                                Edit
                                                            </Button>

                                                            {/* Download */}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 gap-1 text-xs"
                                                                onClick={() =>
                                                                    handleDownload(
                                                                        item,
                                                                    )
                                                                }
                                                                title="Download PNG"
                                                            >
                                                                <Download className="size-3.5" />
                                                                Unduh
                                                            </Button>

                                                            {/* Delete */}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 gap-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                                                                onClick={() =>
                                                                    setDeletingItem(
                                                                        item,
                                                                    )
                                                                }
                                                                title="Hapus history"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Links */}
                        {histories.links && histories.links.length > 3 && (
                            <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t pt-4 sm:flex-row">
                                <div className="text-xs text-neutral-500">
                                    Halaman {histories.current_page} dari{' '}
                                    {histories.last_page}
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-1">
                                    {histories.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            preserveScroll
                                            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                                                link.active
                                                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                                                    : link.url
                                                      ? 'border border-sidebar-border text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                                                      : 'pointer-events-none text-neutral-300 dark:text-neutral-700'
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* PREVIEW MODAL */}
            <Dialog
                open={previewDoc !== null}
                onOpenChange={(open) => !open && setPreviewDoc(null)}
            >
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            Pratinjau: {previewDoc?.title}
                        </DialogTitle>
                        <DialogDescription>
                            Pratinjau dokumen dari data yang tersimpan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex min-h-[350px] items-center justify-center rounded-lg border border-sidebar-border bg-neutral-100 p-4 dark:bg-neutral-900">
                        {previewDoc?.isLoading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Spinner className="size-8" />
                                <span className="text-sm text-neutral-500">
                                    Memuat pratinjau dokumen...
                                </span>
                            </div>
                        ) : previewDoc?.imageUrl ? (
                            <img
                                src={previewDoc.imageUrl}
                                alt="Document History Preview"
                                className="max-h-[500px] max-w-full rounded object-contain shadow-md"
                            />
                        ) : (
                            <span className="text-sm text-red-500">
                                Gagal me-render gambar preview.
                            </span>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* EDIT MODAL */}
            <Dialog
                open={editingItem !== null}
                onOpenChange={(open) => !open && setEditingItem(null)}
            >
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <Pencil className="size-5 text-blue-600 dark:text-blue-400" />
                            <DialogTitle>
                                Edit History #{editingItem?.id} (
                                {editingItem?.template_name})
                            </DialogTitle>
                        </div>
                        <DialogDescription>
                            Perbarui nilai input JSON untuk riwayat dokumen ini.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
                        {editingItem &&
                            Object.keys(editFormData)
                                .sort((a, b) => {
                                    if (a === 'nopol') return -1;
                                    if (b === 'nopol') return 1;
                                    return 0;
                                })
                                .map((fieldKey) => {
                                    const isNopol = fieldKey === 'nopol';
                                    return (
                                        <div
                                            key={fieldKey}
                                            className={`space-y-1.5 ${
                                                isNopol
                                                    ? 'col-span-full rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20'
                                                    : ''
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <Label
                                                    htmlFor={`edit-${fieldKey}`}
                                                    className={`text-xs font-semibold capitalize ${
                                                        isNopol
                                                            ? 'font-bold text-blue-900 dark:text-blue-200'
                                                            : ''
                                                    }`}
                                                >
                                                    {fieldKey.replace(
                                                        /[-_]/g,
                                                        ' ',
                                                    )}
                                                </Label>
                                            </div>
                                            <Input
                                                id={`edit-${fieldKey}`}
                                                value={
                                                    editFormData[fieldKey] || ''
                                                }
                                                onChange={(e) =>
                                                    handleEditInputChange(
                                                        fieldKey,
                                                        e.target.value,
                                                    )
                                                }
                                                className={`font-mono text-xs uppercase ${
                                                    isNopol
                                                        ? 'border-blue-300 bg-white text-sm font-bold dark:bg-neutral-900'
                                                        : ''
                                                }`}
                                            />
                                        </div>
                                    );
                                })}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingItem(null)}
                            disabled={isSavingEdit}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={isSavingEdit}
                            className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {isSavingEdit ? (
                                <Spinner className="size-4" />
                            ) : (
                                <Check className="size-4" />
                            )}
                            Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE CONFIRMATION MODAL */}
            <Dialog
                open={deletingItem !== null}
                onOpenChange={(open) => !open && setDeletingItem(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="size-5" />
                            <DialogTitle>Hapus History Dokumen?</DialogTitle>
                        </div>
                        <DialogDescription className="pt-2">
                            Apakah Anda yakin ingin menghapus data history{' '}
                            <strong>
                                #{deletingItem?.id} (
                                {deletingItem?.template_name})
                            </strong>
                            ? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeletingItem(null)}
                            disabled={isDeleting}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="gap-2"
                        >
                            {isDeleting ? (
                                <Spinner className="size-4" />
                            ) : (
                                <Trash2 className="size-4" />
                            )}
                            Hapus Permanen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
