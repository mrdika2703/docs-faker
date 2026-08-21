import { Head, Link } from '@inertiajs/react';
import { Download, Eye, FilePlus, FileText, History, Layers, Printer } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

interface RecentDoc {
    id: number;
    template_id: number;
    template_name: string;
    input_data: Record<string, string>;
    created_at: string;
    created_at_human: string;
}

interface TemplateOption {
    id: number;
    name: string;
}

interface DashboardProps {
    stats: {
        total_generated: number;
        total_templates: number;
        recent_count: number;
    };
    recent_docs: RecentDoc[];
    templates: TemplateOption[];
}

export default function Dashboard({ stats, recent_docs = [], templates = [] }: DashboardProps) {
    const [previewDoc, setPreviewDoc] = useState<{
        title: string;
        imageUrl: string;
        isLoading: boolean;
    } | null>(null);

    const handlePreviewHistory = async (doc: RecentDoc) => {
        setPreviewDoc({
            title: `Preview: ${doc.template_name} (#${doc.id})`,
            imageUrl: '',
            isLoading: true,
        });

        try {
            const res = await fetch(`/documents/history/${doc.id}/preview`, {
                headers: {
                    Accept: 'application/json',
                },
            });
            const data = await res.json();
            if (data.status === 'success') {
                setPreviewDoc({
                    title: `Preview: ${doc.template_name} (#${doc.id})`,
                    imageUrl: data.preview_url,
                    isLoading: false,
                });
            }
        } catch {
            setPreviewDoc(null);
        }
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            On-The-Fly Document Generator
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Generate documents instantly with memory-optimized RAM image compositing.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/documents/create-combined">
                            <Button className="gap-2 bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500">
                                <Layers className="size-4" />
                                Input STNK & PAJAK (1 Halaman)
                            </Button>
                        </Link>
                        <Link href={templates.find((t) => t.name.toLowerCase() === 'stnk') ? `/documents/create/${templates.find((t) => t.name.toLowerCase() === 'stnk')?.id}` : '/documents/create/stnk'}>
                            <Button variant="outline" className="gap-2 shadow-sm">
                                <FilePlus className="size-4" />
                                Input STNK
                            </Button>
                        </Link>
                        <Link href={templates.find((t) => t.name.toLowerCase() === 'pajak') ? `/documents/create/${templates.find((t) => t.name.toLowerCase() === 'pajak')?.id}` : '/documents/create/pajak'}>
                            <Button variant="outline" className="gap-2 shadow-sm">
                                <FileText className="size-4" />
                                Input PAJAK
                            </Button>
                        </Link>
                        <Link href="/documents/merge">
                            <Button variant="secondary" className="gap-2 shadow-sm">
                                <Printer className="size-4" />
                                Merge Word
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-sidebar-border/80">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                                Total Generated Docs
                            </CardTitle>
                            <FileText className="size-4 text-neutral-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{stats.total_generated}</div>
                            <p className="mt-1 text-xs text-neutral-500">
                                Rendered on-the-fly without disk storage
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/80">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                                Active Templates
                            </CardTitle>
                            <Layers className="size-4 text-neutral-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">{stats.total_templates}</div>
                            <div className="mt-2 flex gap-1.5">
                                {templates.map((t) => (
                                    <Badge key={t.id} variant="secondary" className="text-xs">
                                        {t.name}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-sidebar-border/80">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                                Quick Navigation
                            </CardTitle>
                            <History className="size-4 text-neutral-500" />
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <Link href="/documents/history" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                                View Full History →
                            </Link>
                            <p className="text-xs text-neutral-500">
                                Access all previously entered documents and re-download.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Documents Table */}
                <Card className="border-sidebar-border/80">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Recent Documents</CardTitle>
                            <CardDescription>
                                Last 5 documents generated by your account
                            </CardDescription>
                        </div>
                        <Link href="/documents/history">
                            <Button variant="ghost" size="sm">
                                View All
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recent_docs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <FileText className="size-10 text-neutral-400 stroke-[1.5]" />
                                <h3 className="mt-3 text-sm font-medium">No documents yet</h3>
                                <p className="mt-1 text-xs text-neutral-500">
                                    Start by choosing STNK or PAJAK above.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-sidebar-border/80 text-xs font-semibold uppercase text-neutral-500">
                                        <tr>
                                            <th className="py-3 px-4"># ID</th>
                                            <th className="py-3 px-4">Template</th>
                                            <th className="py-3 px-4">Sample Data (Nama / Nomor)</th>
                                            <th className="py-3 px-4">Created At</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/60">
                                        {recent_docs.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                                                <td className="py-3 px-4 font-mono text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                                    #{doc.id}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline">{doc.template_name}</Badge>
                                                </td>
                                                <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                                                    <span className="font-medium">{doc.input_data?.nama || '-'}</span>
                                                    {doc.input_data?.nomor && (
                                                        <span className="ml-2 font-mono text-xs text-neutral-500">
                                                            ({doc.input_data.nomor})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-xs text-neutral-500">
                                                    {doc.created_at_human}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="gap-1.5 h-8 text-xs"
                                                            onClick={() => handlePreviewHistory(doc)}
                                                        >
                                                            <Eye className="size-3.5" />
                                                            Preview
                                                        </Button>
                                                        <a
                                                            href={`/documents/history/${doc.id}/download`}
                                                            download
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="gap-1.5 h-8 text-xs"
                                                            >
                                                                <Download className="size-3.5" />
                                                                Download
                                                            </Button>
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Preview Modal */}
            <Dialog open={previewDoc !== null} onOpenChange={(open) => !open && setPreviewDoc(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{previewDoc?.title}</DialogTitle>
                        <DialogDescription>
                            Rendered strictly in RAM on-the-fly.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex min-h-[350px] items-center justify-center rounded-lg border border-sidebar-border bg-neutral-100 p-4 dark:bg-neutral-900">
                        {previewDoc?.isLoading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Spinner className="size-8" />
                                <span className="text-sm text-neutral-500">Compositing image in RAM...</span>
                            </div>
                        ) : previewDoc?.imageUrl ? (
                            <img
                                src={previewDoc.imageUrl}
                                alt="Document Preview"
                                className="max-h-[500px] max-w-full rounded shadow-md object-contain"
                            />
                        ) : (
                            <span className="text-sm text-red-500">Failed to render preview.</span>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
