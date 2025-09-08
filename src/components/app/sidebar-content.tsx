
'use client';

import { SidebarContent as SidebarContentWrapper } from '@/components/ui/sidebar';
import { SidebarNav } from './sidebar-nav';

export function SidebarContent() {
  return (
    <SidebarContentWrapper>
      <SidebarNav />
    </SidebarContentWrapper>
  );
}
