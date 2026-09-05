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
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    FileSpreadsheet,
    FileText,
    Filter,
    Layers,
    RefreshCw,
    RotateCcw,
    Save,
    Search,
    SlidersHorizontal,
    Sparkles,
    Type,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

export interface TemplateFieldItem {
    id: number;
    template_id: number;
    field_name: string;
    start_x: number;
    start_y: number;
    max_chars: number;
    default_value: string | null;
    font_style: string;
    created_at?: string;
    updated_at?: string;
}

export interface TemplateGroup {
    id: number;
    name: string;
    dummy_bg_path: string;
    fields: TemplateFieldItem[];
}

interface TemplateFieldsProps {
    templates: TemplateGroup[];
}

export default function TemplateFieldsPage({ templates = [] }: TemplateFieldsProps) {
    // Flatten all fields with template metadata
    const initialFields = useMemo(() => {
        const list: (TemplateFieldItem & { template_name: string })[] = [];
        templates.forEach((tpl) => {
            tpl.fields.forEach((f) => {
                list.push({
                    ...f,
                    template_name: tpl.name,
                });
            });
        });
        return list;
    }, [templates]);

    // Local mutable state for editing
    const [fields, setFields] = useState<(TemplateFieldItem & { template_name: string })[]>(initialFields);
    const [originalFields, setOriginalFields] = useState<(TemplateFieldItem & { template_name: string })[]>(initialFields);

    // Filters & Active Tab
    const [activeTab, setActiveTab] = useState<'all' | 'STNK' | 'PAJAK'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [fontFilter, setFontFilter] = useState<string>('all');

    // Action loading states
    const [savingId, setSavingId] = useState<number | null>(null);
    const [isBulkSaving, setIsBulkSaving] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);

    // Track dirty fields
    const dirtyFieldIds = useMemo(() => {
        const dirty = new Set<number>();
        fields.forEach((f) => {
            const original = originalFields.find((orig) => orig.id === f.id);
            if (original) {
                const defChanged = (f.default_value ?? '') !== (original.default_value ?? '');
                const maxChanged = Number(f.max_chars) !== Number(original.max_chars);
                if (defChanged || maxChanged) {
                    dirty.add(f.id);
                }
            }
        });
        return dirty;
    }, [fields, originalFields]);

    const handleFieldChange = (id: number, key: 'default_value' | 'max_chars', value: any) => {
        setFields((prev) =>
            prev.map((f) => {
                if (f.id === id) {
                    return {
                        ...f,
                        [key]: key === 'max_chars' ? (value === '' ? '' : Math.max(1, parseInt(value) || 1)) : value,
                    };
                }
                return f;
            }),
        );
    };

    const handleResetSingleField = (id: number) => {
        const orig = originalFields.find((o) => o.id === id);
        if (orig) {
            setFields((prev) => prev.map((f) => (f.id === id ? { ...orig } : f)));
            toast.info(`Perubahan pada field '${orig.field_name}' dibatalkan.`);
        }
    };

    // Action 1: Save a single field
    const handleSaveSingle = async (field: TemplateFieldItem & { template_name: string }) => {
        setSavingId(field.id);
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch(`/templates/fields/${field.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify({
                    default_value: field.default_value || null,
                    max_chars: Number(field.max_chars) || 50,
                }),
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                toast.success(data.message || `Field '${field.field_name}' berhasil disimpan!`);
                // Update original snapshot
                setOriginalFields((prev) =>
                    prev.map((orig) => (orig.id === field.id ? { ...field } : orig)),
                );
            } else {
                toast.error(data.message || 'Gagal menyimpan field.');
            }
        } catch {
            toast.error('Gagal terhubung ke server saat menyimpan.');
        } finally {
            setSavingId(null);
        }
    };

    // Action 2: Bulk save all dirty fields
    const handleBulkSave = async () => {
        const dirtyFields = fields.filter((f) => dirtyFieldIds.has(f.id));
        if (dirtyFields.length === 0) {
            toast.info('Tidak ada perubahan yang perlu disimpan.');
            return;
        }

        setIsBulkSaving(true);
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch('/templates/fields/bulk-update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                },
                body: JSON.stringify({
                    fields: dirtyFields.map((f) => ({
                        id: f.id,
                        default_value: f.default_value || null,
                        max_chars: Number(f.max_chars) || 50,
                    })),
                }),
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                toast.success(data.message || 'Semua perubahan berhasil disimpan!');
                setOriginalFields([...fields]);
            } else {
                toast.error(data.message || 'Gagal menyimpan perubahan massal.');
            }
        } catch {
            toast.error('Gagal terhubung ke server saat bulk save.');
        } finally {
            setIsBulkSaving(false);
        }
    };

    // Action 3: Reset all template fields to default seeder values
    const handleResetAllToDefaults = async () => {
        setIsResetting(true);
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch('/templates/fields/reset-defaults', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                },
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                toast.success('Konfigurasi berhasil di-reset ke nilai default bawaan!');
                setResetDialogOpen(false);
                router.reload();
            } else {
                toast.error(data.message || 'Gagal mereset konfigurasi.');
            }
        } catch {
            toast.error('Gagal terhubung ke server saat mereset.');
        } finally {
            setIsResetting(false);
        }
    };

    // Font badge style helper
    const getFontBadge = (fontStyle?: string) => {
        switch (fontStyle) {
            case 'pajak_bold':
                return {
                    label: 'Bold Font',
                    className:
                        'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
                };
            case 'pajak_regular_u':
                return {
                    label: 'Regular-U',
                    className:
                        'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
                };
            case 'pajak_regular_b':
                return {
                    label: 'Regular-B',
                    className:
                        'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
                };
            case 'stnk':
                return {
                    label: 'Font STNK',
                    className:
                        'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
                };
            default:
                return {
                    label: fontStyle || 'Regular',
                    className:
                        'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
                };
        }
    };

    // Filtered fields based on active tab, search, and font filter
    const filteredFields = useMemo(() => {
        return fields.filter((f) => {
            const matchesTab =
                activeTab === 'all' ? true : f.template_name === activeTab;

            const matchesSearch =
                searchQuery.trim() === '' ||
                f.field_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (f.default_value && f.default_value.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesFont =
                fontFilter === 'all' || f.font_style === fontFilter;

            return matchesTab && matchesSearch && matchesFont;
        });
    }, [fields, activeTab, searchQuery, fontFilter]);

    const stnkCount = fields.filter((f) => f.template_name === 'STNK').length;
    const pajakCount = fields.filter((f) => f.template_name === 'PAJAK').length;

    return (
        <>
            <Head title="Pengaturan Field & Batas Karakter" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Page Header */}
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
                                    Pengaturan Field Dokumen
                                </h1>
                                <Badge variant="secondary" className="gap-1 font-mono text-xs">
                                    <SlidersHorizontal className="size-3" />
                                    {fields.length} Field Database
                                </Badge>
                            </div>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Kelola default value formulir dan batas maksimal panjang karakter (<code className="font-mono text-xs">max_chars</code>) secara dinamis langsung ke database.
                            </p>
                        </div>
                    </div>

                    {/* Actions Header */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs text-neutral-600 dark:text-neutral-400"
                            onClick={() => setResetDialogOpen(true)}
                        >
                            <RotateCcw className="size-3.5" />
                            Reset Default Bawaan
                        </Button>

                        <Button
                            size="sm"
                            className={cn(
                                'gap-1.5 text-xs transition-all',
                                dirtyFieldIds.size > 0
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500'
                                    : 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900',
                            )}
                            onClick={handleBulkSave}
                            disabled={dirtyFieldIds.size === 0 || isBulkSaving}
                        >
                            {isBulkSaving ? (
                                <Spinner className="size-3.5" />
                            ) : (
                                <Save className="size-3.5" />
                            )}
                            Simpan Perubahan {dirtyFieldIds.size > 0 && `(${dirtyFieldIds.size})`}
                        </Button>
                    </div>
                </div>

                {/* Filter & Tab Control Card */}
                <Card className="border-sidebar-border/80 shadow-sm">
                    <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                        {/* Tabs */}
                        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-sidebar-border bg-neutral-100/80 p-1 dark:bg-neutral-900/60">
                            <Button
                                type="button"
                                size="sm"
                                variant={activeTab === 'all' ? 'default' : 'ghost'}
                                className={cn(
                                    'h-8 text-xs font-medium',
                                    activeTab === 'all' && 'bg-white shadow-xs dark:bg-neutral-800 dark:text-neutral-100',
                                )}
                                onClick={() => setActiveTab('all')}
                            >
                                <Layers className="mr-1.5 size-3.5" />
                                Semua ({fields.length})
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={activeTab === 'STNK' ? 'default' : 'ghost'}
                                className={cn(
                                    'h-8 text-xs font-medium',
                                    activeTab === 'STNK' && 'bg-white text-emerald-700 shadow-xs dark:bg-neutral-800 dark:text-emerald-400',
                                )}
                                onClick={() => setActiveTab('STNK')}
                            >
                                <FileText className="mr-1.5 size-3.5" />
                                STNK ({stnkCount})
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={activeTab === 'PAJAK' ? 'default' : 'ghost'}
                                className={cn(
                                    'h-8 text-xs font-medium',
                                    activeTab === 'PAJAK' && 'bg-white text-amber-700 shadow-xs dark:bg-neutral-800 dark:text-amber-400',
                                )}
                                onClick={() => setActiveTab('PAJAK')}
                            >
                                <FileSpreadsheet className="mr-1.5 size-3.5" />
                                PAJAK ({pajakCount})
                            </Button>
                        </div>

                        {/* Search & Font Filter */}
                        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                            <div className="relative min-w-[200px] flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    type="search"
                                    placeholder="Cari field atau default value..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-8 pl-8 text-xs"
                                />
                            </div>

                            <div className="flex items-center gap-1">
                                <Filter className="size-3.5 text-neutral-400" />
                                <select
                                    value={fontFilter}
                                    onChange={(e) => setFontFilter(e.target.value)}
                                    className="h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-neutral-900"
                                >
                                    <option value="all">Semua Font</option>
                                    <option value="stnk">Font STNK</option>
                                    <option value="pajak_bold">Pajak Bold</option>
                                    <option value="pajak_regular_u">Pajak Reg-U</option>
                                    <option value="pajak_regular_b">Pajak Reg-B</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Interactive Field Configuration Table */}
                <Card className="border-sidebar-border/80 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base">
                                Daftar Field & Limit Karakter
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Menampilkan {filteredFields.length} field template. Klik dan ubah langsung pada kolom Default Value atau Max Chars.
                            </CardDescription>
                        </div>
                        {dirtyFieldIds.size > 0 && (
                            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                {dirtyFieldIds.size} field belum disimpan
                            </span>
                        )}
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead>
                                    <tr className="border-b border-sidebar-border bg-neutral-50/80 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400">
                                        <th className="py-3 pl-6 pr-4 font-semibold">Template & Nama Field</th>
                                        <th className="py-3 px-4 font-semibold">Font Style</th>
                                        <th className="py-3 px-4 font-semibold">Koordinat (X, Y)</th>
                                        <th className="py-3 px-4 font-semibold min-w-[240px]">Default Input Value</th>
                                        <th className="py-3 px-4 font-semibold w-36">Max Chars</th>
                                        <th className="py-3 pl-4 pr-6 text-right font-semibold w-28">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border">
                                    {filteredFields.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-neutral-400">
                                                Tidak ada field yang sesuai dengan kriteria filter.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredFields.map((field) => {
                                            const isDirty = dirtyFieldIds.has(field.id);
                                            const isSavingThis = savingId === field.id;
                                            const fontBadge = getFontBadge(field.font_style);
                                            const isStnk = field.template_name === 'STNK';

                                            return (
                                                <tr
                                                    key={field.id}
                                                    className={cn(
                                                        'transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30',
                                                        isDirty && 'bg-amber-50/30 dark:bg-amber-950/10',
                                                    )}
                                                >
                                                    {/* Template & Name */}
                                                    <td className="py-3.5 pl-6 pr-4 align-middle">
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    'text-[10px] font-semibold uppercase',
                                                                    isStnk
                                                                        ? 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400'
                                                                        : 'border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400',
                                                                )}
                                                            >
                                                                {field.template_name}
                                                            </Badge>
                                                            <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                                                {field.field_name}
                                                            </span>
                                                            {isDirty && (
                                                                <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                                                    DIEDIT
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Font Style */}
                                                    <td className="py-3.5 px-4 align-middle">
                                                        <span className={cn('rounded border px-2 py-0.5 text-[10px] font-semibold inline-block', fontBadge.className)}>
                                                            {fontBadge.label}
                                                        </span>
                                                    </td>

                                                    {/* Coordinates */}
                                                    <td className="py-3.5 px-4 align-middle font-mono text-[11px] text-neutral-500">
                                                        X: {field.start_x}, Y: {field.start_y}
                                                    </td>

                                                    {/* Default Value Input */}
                                                    <td className="py-3.5 px-4 align-middle">
                                                        <Input
                                                            value={field.default_value ?? ''}
                                                            maxLength={Number(field.max_chars) || 500}
                                                            onChange={(e) =>
                                                                handleFieldChange(field.id, 'default_value', e.target.value)
                                                            }
                                                            placeholder="Kosong (tidak ada default)..."
                                                            className={cn(
                                                                'h-8 font-mono text-xs',
                                                                isDirty && 'border-amber-400 ring-1 ring-amber-400/30 dark:border-amber-700',
                                                            )}
                                                        />
                                                    </td>

                                                    {/* Max Chars Input */}
                                                    <td className="py-3.5 px-4 align-middle">
                                                        <div className="flex items-center gap-1.5">
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                max={500}
                                                                value={field.max_chars}
                                                                onChange={(e) =>
                                                                    handleFieldChange(field.id, 'max_chars', e.target.value)
                                                                }
                                                                className={cn(
                                                                    'h-8 w-20 font-mono text-xs font-semibold text-center',
                                                                    isDirty && 'border-amber-400 ring-1 ring-amber-400/30 dark:border-amber-700',
                                                                )}
                                                            />
                                                            <span className="text-[10px] text-neutral-400 font-mono">
                                                                karakter
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-3.5 pl-4 pr-6 text-right align-middle">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {isDirty && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="size-7 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                                                                    title="Batal edit baris ini"
                                                                    onClick={() => handleResetSingleField(field.id)}
                                                                >
                                                                    <RotateCcw className="size-3.5" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant={isDirty ? 'default' : 'outline'}
                                                                size="sm"
                                                                className={cn(
                                                                    'h-7 px-2 text-[11px]',
                                                                    isDirty && 'bg-emerald-600 hover:bg-emerald-700 text-white',
                                                                )}
                                                                disabled={!isDirty || isSavingThis}
                                                                onClick={() => handleSaveSingle(field)}
                                                            >
                                                                {isSavingThis ? (
                                                                    <Spinner className="size-3" />
                                                                ) : (
                                                                    <Save className="size-3 mr-1" />
                                                                )}
                                                                Simpan
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Confirmation Dialog: Reset All Fields */}
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base text-amber-600 dark:text-amber-400">
                            <RotateCcw className="size-5" />
                            Reset ke Konfigurasi Default Bawaan?
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Tindakan ini akan mengembalikan seluruh <strong>Default Value</strong> dan <strong>Max Chars</strong> dari template STNK & PAJAK ke nilai konfigurasi seeder awal.
                            Semua perubahan kustom Anda akan ditimpa.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setResetDialogOpen(false)}
                            disabled={isResetting}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleResetAllToDefaults}
                            disabled={isResetting}
                            className="gap-1.5"
                        >
                            {isResetting ? <Spinner className="size-3.5" /> : <RotateCcw className="size-3.5" />}
                            Ya, Reset Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
