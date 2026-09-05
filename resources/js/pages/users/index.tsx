import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Eye,
    EyeOff,
    Pencil,
    Search,
    Shield,
    Trash2,
    User as UserIcon,
    UserCheck,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

interface UserItem {
    id: number;
    name: string;
    email: string;
    role: string;
    email_verified_at: string | null;
    created_at: string;
    created_at_human: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface UsersPageProps {
    users: {
        data: UserItem[];
        links: PaginationLink[];
        total: number;
        from: number;
        to: number;
        current_page: number;
        last_page: number;
    };
    filters: {
        search: string;
    };
    currentUserId: number;
}

export default function UsersIndex({ users, filters, currentUserId }: UsersPageProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Selected user for edit/delete
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

    // Form states
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        role: 'user',
        password: '',
        password_confirmation: '',
    });
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        role: 'user',
        password: '',
        password_confirmation: '',
    });

    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Password visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/users', { search: searchQuery.trim() }, { preserveState: true, replace: true });
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        router.get('/users', {}, { preserveState: true, replace: true });
    };

    const handleOpenCreate = () => {
        setCreateForm({
            name: '',
            email: '',
            role: 'user',
            password: '',
            password_confirmation: '',
        });
        setCreateErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (user: UserItem) => {
        setSelectedUser(user);
        setEditForm({
            name: user.name,
            email: user.email,
            role: user.role || 'user',
            password: '',
            password_confirmation: '',
        });
        setEditErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
        setIsEditOpen(true);
    };

    const handleOpenDelete = (user: UserItem) => {
        setSelectedUser(user);
        setIsDeleteOpen(true);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setCreateErrors({});

        router.post('/users', createForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
            },
            onError: (errs) => {
                setCreateErrors(errs);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setIsSubmitting(true);
        setEditErrors({});

        const payload: Record<string, string> = {
            name: editForm.name,
            email: editForm.email,
            role: editForm.role,
        };

        if (editForm.password) {
            payload.password = editForm.password;
            payload.password_confirmation = editForm.password_confirmation;
        }

        router.put(`/users/${selectedUser.id}`, payload, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditOpen(false);
            },
            onError: (errs) => {
                setEditErrors(errs);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleDeleteSubmit = () => {
        if (!selectedUser) return;

        setIsSubmitting(true);
        router.delete(`/users/${selectedUser.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <>
            <Head title="Manajemen User" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header Section */}
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
                                    Manajemen User
                                </h1>
                                <Badge variant="secondary" className="gap-1 font-mono text-xs">
                                    <Users className="size-3" />
                                    {users.total} Pengguna
                                </Badge>
                            </div>
                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                Kelola akun dan hak akses (Administrator & User) pada aplikasi Docs Faker.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleOpenCreate}
                            className="gap-2 bg-neutral-900 text-white shadow hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
                        >
                            <UserPlus className="size-4" />
                            <span>Tambah User Baru</span>
                        </Button>
                    </div>
                </div>

                {/* Table Card */}
                <Card className="border-sidebar-border/80">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-base">Daftar Pengguna</CardTitle>
                                <CardDescription className="text-xs">
                                    Total {users.total} user terdaftar di sistem.
                                </CardDescription>
                            </div>

                            {/* Search Form */}
                            <form onSubmit={handleSearchSubmit} className="relative flex w-full max-w-xs items-center gap-2">
                                <div className="relative w-full">
                                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                                    <Input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cari nama atau email..."
                                        className="h-8 pl-8 pr-8 text-xs"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={handleClearSearch}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                                <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs">
                                    Cari
                                </Button>
                            </form>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-y border-sidebar-border/80 bg-neutral-50/75 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider dark:bg-neutral-900/50 dark:text-neutral-400">
                                    <tr>
                                        <th className="px-4 py-3">ID</th>
                                        <th className="px-4 py-3">User / Akun</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">Tanggal Dibuat</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/60">
                                    {users.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-neutral-500 dark:text-neutral-400">
                                                {filters.search ? (
                                                    <div className="space-y-1">
                                                        <p>Tidak ada user yang cocok dengan kata kunci &quot;{filters.search}&quot;.</p>
                                                        <button
                                                            onClick={handleClearSearch}
                                                            className="text-emerald-600 underline hover:text-emerald-700 dark:text-emerald-400"
                                                        >
                                                            Reset pencarian
                                                        </button>
                                                    </div>
                                                ) : (
                                                    'Belum ada data user.'
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        users.data.map((user) => {
                                            const isSelf = user.id === currentUserId;
                                            const isAdmin = user.role === 'admin';
                                            return (
                                                <tr
                                                    key={user.id}
                                                    className="transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40"
                                                >
                                                    <td className="px-4 py-3 font-mono text-neutral-400">
                                                        #{user.id}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex size-7 items-center justify-center rounded-full bg-neutral-200/80 font-bold text-neutral-700 text-[11px] uppercase dark:bg-neutral-800 dark:text-neutral-300">
                                                                {user.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-100">
                                                                    <span>{user.name}</span>
                                                                    {isSelf && (
                                                                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                            Anda
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-neutral-600 dark:text-neutral-300">
                                                            {user.email}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {isAdmin ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                                                                <Shield className="size-3" />
                                                                Administrator
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                                <UserIcon className="size-3" />
                                                                User
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-500">
                                                        <div>{user.created_at}</div>
                                                        <div className="text-[10px] text-neutral-400">{user.created_at_human}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleOpenEdit(user)}
                                                                className="h-7 gap-1 px-2 text-xs"
                                                            >
                                                                <Pencil className="size-3" />
                                                                <span>Edit</span>
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                disabled={isSelf}
                                                                onClick={() => handleOpenDelete(user)}
                                                                className={`h-7 gap-1 px-2 text-xs ${
                                                                    isSelf
                                                                        ? 'opacity-40'
                                                                        : 'text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30'
                                                                }`}
                                                                title={isSelf ? 'Tidak bisa menghapus akun sendiri' : 'Hapus user'}
                                                            >
                                                                <Trash2 className="size-3" />
                                                                <span>Hapus</span>
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

                        {/* Pagination */}
                        {users.links && users.links.length > 3 && (
                            <div className="flex items-center justify-between border-t border-sidebar-border/80 px-4 py-3 text-xs text-neutral-500">
                                <div>
                                    Menampilkan {users.from || 0} - {users.to || 0} dari {users.total} data
                                </div>
                                <div className="flex items-center gap-1">
                                    {users.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            preserveScroll
                                            className={`rounded px-2.5 py-1 text-xs transition-colors ${
                                                link.active
                                                    ? 'bg-neutral-900 font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900'
                                                    : link.url
                                                    ? 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                                    : 'pointer-events-none opacity-40'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal Tambah User Baru */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <UserPlus className="size-4" />
                            </div>
                            <DialogTitle className="text-base">Tambah User Baru</DialogTitle>
                        </div>
                        <DialogDescription className="text-xs">
                            Buat akun baru dan tentukan peran akses masuk (User atau Administrator).
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-3.5 py-1">
                        {/* Name */}
                        <div className="space-y-1">
                            <Label htmlFor="create-name" className="text-xs">Nama Lengkap</Label>
                            <Input
                                id="create-name"
                                type="text"
                                required
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                placeholder="Contoh: Budi Santoso"
                                className="h-8 text-xs"
                            />
                            {createErrors.name && (
                                <p className="text-[11px] text-red-600 dark:text-red-400">{createErrors.name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <Label htmlFor="create-email" className="text-xs">Email</Label>
                            <Input
                                id="create-email"
                                type="email"
                                required
                                value={createForm.email}
                                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                placeholder="user@contoh.com"
                                className="h-8 text-xs"
                            />
                            {createErrors.email && (
                                <p className="text-[11px] text-red-600 dark:text-red-400">{createErrors.email}</p>
                            )}
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-1">
                            <Label htmlFor="create-role" className="text-xs">Peran Akses (Role)</Label>
                            <select
                                id="create-role"
                                value={createForm.role}
                                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                                className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-xs shadow-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring dark:bg-neutral-900"
                            >
                                <option value="user">User (Akses Dokumen & Cetak)</option>
                                <option value="admin">Administrator (Akses Penuh termasuk Pengaturan & User)</option>
                            </select>
                            <p className="text-[11px] text-neutral-500">
                                {createForm.role === 'admin'
                                    ? '🛡️ Administrator dapat membuka semua menu termasuk Pengaturan Field dan Manajemen User.'
                                    : '👤 User dapat generate dokumen dan merge Word, tetapi halaman Pengaturan Field dan CRUD User diblokir.'}
                            </p>
                            {createErrors.role && (
                                <p className="text-[11px] text-red-600 dark:text-red-400">{createErrors.role}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <Label htmlFor="create-password" className="text-xs">Password (Minimal 6 Karakter)</Label>
                            <div className="relative">
                                <Input
                                    id="create-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={createForm.password}
                                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="h-8 pr-8 text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                </button>
                            </div>
                            {createErrors.password && (
                                <p className="text-[11px] text-red-600 dark:text-red-400">{createErrors.password}</p>
                            )}
                        </div>

                        {/* Password Confirmation */}
                        <div className="space-y-1">
                            <Label htmlFor="create-password-confirm" className="text-xs">Konfirmasi Password</Label>
                            <div className="relative">
                                <Input
                                    id="create-password-confirm"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={createForm.password_confirmation}
                                    onChange={(e) => setCreateForm({ ...createForm, password_confirmation: e.target.value })}
                                    placeholder="Ulangi password..."
                                    className="h-8 pr-8 text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                </button>
                            </div>
                        </div>

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsCreateOpen(false)}
                                disabled={isSubmitting}
                                className="h-8 text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmitting}
                                className="h-8 gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 text-xs dark:bg-neutral-100 dark:text-neutral-900"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner className="size-3.5" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <UserCheck className="size-3.5" />
                                        <span>Simpan User</span>
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Edit User */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-full bg-neutral-500/10 text-neutral-700 dark:text-neutral-300">
                                <Pencil className="size-3.5" />
                            </div>
                            <DialogTitle className="text-base">Edit User</DialogTitle>
                        </div>
                        <DialogDescription className="text-xs">
                            Perbarui nama, email, role, atau ganti password user #{selectedUser?.id}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-3.5 py-1">
                        {/* Name */}
                        <div className="space-y-1">
                            <Label htmlFor="edit-name" className="text-xs">Nama Lengkap</Label>
                            <Input
                                id="edit-name"
                                type="text"
                                required
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="h-8 text-xs"
                            />
                            {editErrors.name && (
                                <p className="text-[11px] text-red-600 dark:text-red-400">{editErrors.name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <Label htmlFor="edit-email" className="text-xs">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                required
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="h-8 text-xs"
                            />
                            {editErrors.email && (
                                <p className="text-[11px] text-red-600 dark:text-red-400">{editErrors.email}</p>
                            )}
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-1">
                            <Label htmlFor="edit-role" className="text-xs">Peran Akses (Role)</Label>
                            <select
                                id="edit-role"
                                disabled={selectedUser?.id === currentUserId}
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-xs shadow-xs focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 dark:bg-neutral-900"
                            >
                                <option value="user">User (Akses Dokumen & Cetak)</option>
                                <option value="admin">Administrator (Akses Penuh)</option>
                            </select>
                            {selectedUser?.id === currentUserId ? (
                                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                    Role akun admin Anda sendiri tidak dapat diubah di sini demi keamanan.
                                </p>
                            ) : (
                                <p className="text-[11px] text-neutral-500">
                                    {editForm.role === 'admin'
                                        ? '🛡️ Akses penuh termasuk menu Konfigurasi.'
                                        : '👤 Akses dibatasi untuk fitur dokumen saja.'}
                                </p>
                            )}
                            {editErrors.role && (
                                <p className="text-[11px] text-red-600 dark:text-red-400">{editErrors.role}</p>
                            )}
                        </div>

                        <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 p-2.5 text-[11px] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/30">
                            💡 Kosongkan kolom password di bawah jika Anda tidak ingin mengganti password user ini.
                        </div>

                        {/* New Password (Optional) */}
                        <div className="space-y-1">
                            <Label htmlFor="edit-password" className="text-xs">Password Baru (Opsional)</Label>
                            <div className="relative">
                                <Input
                                    id="edit-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={editForm.password}
                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                    placeholder="Kosongkan jika tidak diganti"
                                    className="h-8 pr-8 text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                </button>
                            </div>
                            {editErrors.password && (
                                <p className="text-[11px] text-red-600 dark:text-red-400">{editErrors.password}</p>
                            )}
                        </div>

                        {/* New Password Confirmation */}
                        {editForm.password && (
                            <div className="space-y-1">
                                <Label htmlFor="edit-password-confirm" className="text-xs">Konfirmasi Password Baru</Label>
                                <div className="relative">
                                    <Input
                                        id="edit-password-confirm"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={editForm.password_confirmation}
                                        onChange={(e) => setEditForm({ ...editForm, password_confirmation: e.target.value })}
                                        placeholder="Ulangi password baru..."
                                        className="h-8 pr-8 text-xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditOpen(false)}
                                disabled={isSubmitting}
                                className="h-8 text-xs"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isSubmitting}
                                className="h-8 gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 text-xs dark:bg-neutral-100 dark:text-neutral-900"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner className="size-3.5" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <span>Simpan Perubahan</span>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Konfirmasi Hapus User */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
                                <AlertCircle className="size-4" />
                            </div>
                            <DialogTitle className="text-base text-red-600 dark:text-red-400">
                                Hapus Pengguna
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs pt-1">
                            Apakah Anda yakin ingin menghapus user{' '}
                            <strong className="text-neutral-900 dark:text-neutral-100">{selectedUser?.name}</strong> (
                            {selectedUser?.email})? Tindakan ini tidak dapat dibatalkan dan akun tersebut tidak akan bisa
                            login kembali.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={isSubmitting}
                            className="h-8 text-xs"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={handleDeleteSubmit}
                            className="h-8 gap-1.5 text-xs"
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner className="size-3.5" />
                                    <span>Menghapus...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="size-3.5" />
                                    <span>Ya, Hapus User</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
