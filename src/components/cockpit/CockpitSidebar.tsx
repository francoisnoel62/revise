// ABOUTME: Sidebar navigation for the cockpit dashboard
// ABOUTME: Provides navigation between Overview, Objectifs, Tâches, Paramètres, Personnages, Recherches, Annexes

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Settings,
  Users,
  Search,
  FileText,
} from 'lucide-react';

interface CockpitSidebarProps {
  projectId: string;
}

const navigationItems = [
  {
    group: 'Pilotage',
    items: [
      { title: "Vue d'ensemble", icon: LayoutDashboard, href: '' },
      { title: 'Objectifs', icon: Target, href: '/objectives' },
      { title: 'Tâches', icon: CheckSquare, href: '/tasks' },
      { title: 'Paramètres', icon: Settings, href: '/settings' },
    ],
  },
  {
    group: 'Contenu',
    items: [
      { title: 'Personnages', icon: Users, href: '/characters' },
      { title: 'Recherches', icon: Search, href: '/research' },
      { title: 'Annexes', icon: FileText, href: '/editorial' },
    ],
  },
];

export function CockpitSidebar({ projectId }: CockpitSidebarProps) {
  const pathname = usePathname();
  const basePath = `/project/${projectId}/cockpit`;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {navigationItems.map((section) => (
          <SidebarGroup key={section.group}>
            <SidebarGroupLabel>{section.group}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
                const fullPath = `${basePath}${item.href}`;
                const isActive =
                  pathname === fullPath ||
                  (item.href === '' && pathname === basePath);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={fullPath}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
