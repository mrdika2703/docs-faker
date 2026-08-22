import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavGroup, NavItem } from '@/types';

export function NavMain({
    groups,
    items,
}: {
    groups?: NavGroup[];
    items?: NavItem[];
}) {
    const { isCurrentUrl } = useCurrentUrl();

    // If groups provided, render each group with its own label
    if (groups && groups.length > 0) {
        return (
            <>
                {groups.map((group) => (
                    <SidebarGroup key={group.title} className="px-2 py-1">
                        <SidebarGroupLabel className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                            {group.title}
                        </SidebarGroupLabel>
                        <SidebarMenu>
                            {group.items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isCurrentUrl(item.href)}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon className="size-4" />}
                                            <span className="truncate">{item.title}</span>
                                            {item.badge && (
                                                <span className="ml-auto rounded bg-neutral-200/80 px-1.5 py-0.5 text-[9px] font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
            </>
        );
    }

    // Fallback if flat items provided
    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {(items || []).map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
