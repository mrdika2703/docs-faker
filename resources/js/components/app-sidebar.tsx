import { Link, usePage } from '@inertiajs/react';
import { FilePlus, FileText, History, Layers, LayoutGrid, Printer, SlidersHorizontal, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavGroup, NavItem } from '@/types';

const sidebarNavGroups: NavGroup[] = [
    {
        title: 'Utama',
        items: [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
            },
        ],
    },
    {
        title: 'Pembuatan Dokumen',
        items: [
            {
                title: 'Input STNK & PAJAK',
                href: '/documents/create-combined',
                icon: Layers,
                badge: 'All-in-One',
            },
            {
                title: 'Input STNK',
                href: '/documents/create/stnk',
                icon: FilePlus,
            },
            {
                title: 'Input PAJAK',
                href: '/documents/create/pajak',
                icon: FileText,
            },
        ],
    },
    {
        title: 'Dokumen & Cetak',
        items: [
            {
                title: 'Gabung Word (Cetak)',
                href: '/documents/merge',
                icon: Printer,
                badge: '2-Page',
            },
            {
                title: 'Riwayat Dokumen',
                href: '/documents/history',
                icon: History,
            },
        ],
    },
    {
        title: 'Konfigurasi',
        items: [
            {
                title: 'Pengaturan Field',
                href: '/templates/fields',
                icon: SlidersHorizontal,
            },
            {
                title: 'Manajemen User',
                href: '/users',
                icon: Users,
            },
        ],
    },
];

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: FolderGit2,
    // },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const isAdmin = auth?.user?.role === 'admin';

    const visibleNavGroups = sidebarNavGroups.filter((group) => {
        if (group.title === 'Konfigurasi' && !isAdmin) {
            return false;
        }
        return true;
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={visibleNavGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
