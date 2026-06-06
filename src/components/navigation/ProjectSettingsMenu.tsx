// ABOUTME: Dropdown menu for quick access to all cockpit sections from the editor
// ABOUTME: Groups items into Pilotage and Contenu, mirroring the CockpitSidebar structure

'use client';

import Link from 'next/link';
import { SlidersHorizontal, LayoutDashboard, Target, CheckSquare, Settings, Users, Search, FileText, Sparkles, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectSettingsMenuProps {
  projectId: string;
}

const sections = [
  {
    group: 'Pilotage',
    items: [
      { title: "Vue d'ensemble", icon: LayoutDashboard, href: '' },
      { title: 'Objectifs', icon: Target, href: '/objectives' },
      { title: 'Tâches', icon: CheckSquare, href: '/tasks' },
      { title: 'Utilisation IA', icon: Sparkles, href: '/usage' },
      { title: 'Paramètres', icon: Settings, href: '/settings' },
      { title: 'Métadonnées', icon: Database, href: '/metadata' },
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

export function ProjectSettingsMenu({ projectId }: ProjectSettingsMenuProps) {
  const basePath = `/project/${projectId}/cockpit`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="px-2 sm:px-3" title="Paramètres du projet">
          <SlidersHorizontal className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Paramètres</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {sections.map((section, i) => (
          <div key={section.group}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs text-muted-foreground">{section.group}</DropdownMenuLabel>
            {section.items.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={`${basePath}${item.href}`} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
