// ABOUTME: Layout for dashboard pages with header and user menu.

import { UserMenu } from '@/components/auth/UserMenu';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation */}
      <nav className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="font-semibold text-lg">Revise</div>
          <UserMenu />
        </div>
      </nav>

      {/* Page content */}
      {children}
    </div>
  );
}
