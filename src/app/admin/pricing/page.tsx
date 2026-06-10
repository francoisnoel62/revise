// ABOUTME: Admin page for managing AI model pricing entries.
// ABOUTME: Shows all pricing entries from MongoDB with sync and CRUD actions.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getAuthenticatedAdminId } from '@/app/actions/utils';
import { listModelPricingAction } from '@/app/actions/pricing-admin-actions';
import { ModelPricingTable } from '@/components/admin/ModelPricingTable';
import { SyncButton } from '@/components/admin/SyncButton';

export const metadata = {
  title: 'Tarifs IA - Admin Revise',
};

export default async function AdminPricingPage() {
  const auth = await getAuthenticatedAdminId();
  if ('error' in auth) {
    redirect('/auth/signin');
  }

  const result = await listModelPricingAction();

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Tarifs IA</h1>
            <div className="flex items-center gap-2">
              <SyncButton />
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {!result.success ? (
          <p className="text-destructive">{result.error}</p>
        ) : result.data.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Aucun tarif en base. Lancez une synchronisation pour importer les prix depuis OpenRouter.
            </p>
            <SyncButton />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {result.data.length} modèle{result.data.length > 1 ? 's' : ''} — prix en USD/million de tokens
            </p>
            <ModelPricingTable entries={result.data} />
          </>
        )}
      </main>
    </div>
  );
}
