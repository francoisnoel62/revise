// ABOUTME: Layout wrapper for cockpit pages with sidebar navigation
// ABOUTME: Provides consistent navigation across all cockpit sections

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { CockpitSidebar } from '@/components/cockpit/CockpitSidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';

interface CockpitLayoutProps {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}

export default async function CockpitLayout({
  children,
  params,
}: CockpitLayoutProps) {
  const { projectId } = await params;

  return (
    <SidebarProvider>
      <CockpitSidebar projectId={projectId} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/project/${projectId}/cockpit`}>
                  Cockpit
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
