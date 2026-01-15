// ABOUTME: User menu dropdown with session info and sign-out.
// ABOUTME: Displays user email and provides sign-out action.

'use client';

import * as React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LogOut, FolderOpen, Key } from 'lucide-react';
import { ProvidersDialog } from '@/components/providers/ProvidersDialog';

export function UserMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [providersDialogOpen, setProvidersDialogOpen] = React.useState(false);

  if (status === 'loading') {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
    );
  }

  if (!session?.user) {
    return (
      <Button variant="outline" size="sm" onClick={() => router.push('/auth/signin')}>
        Se connecter
      </Button>
    );
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  const userInitial = session.user.name?.[0] || session.user.email?.[0] || '?';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full bg-primary text-primary-foreground"
        >
          {userInitial.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            {session.user.name && (
              <p className="text-sm font-medium">{session.user.name}</p>
            )}
            <p className="text-xs text-muted-foreground truncate">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Mes projets
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setProvidersDialogOpen(true)}>
          <Key className="mr-2 h-4 w-4" />
          Mes providers
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
      <ProvidersDialog
        open={providersDialogOpen}
        onOpenChange={setProvidersDialogOpen}
      />
    </DropdownMenu>
  );
}
