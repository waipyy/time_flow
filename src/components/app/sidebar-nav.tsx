
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LayoutDashboard, Calendar, Target, Tag } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const navItems = [
  {
    href: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: 'calendar',
    label: 'Calendar',
    icon: Calendar,
  },
  {
    href: 'goals',
    label: 'Goals',
    icon: Target,
  },
  {
    href: 'tags',
    label: 'Tags',
    icon: Tag,
  },
];

export function SidebarNav() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'dashboard';

  return (
    <SidebarMenu>
      {navItems.map(item => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={currentView === item.href}
            tooltip={{ children: item.label, side: 'right' }}
          >
            <Link href={`/?view=${item.href}`}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
