// ABOUTME: AI transparency ledger page — the author's cross-project log of captured AI exchanges
// ABOUTME: Authenticated, per-user; content is scoped to the owner and decrypted only on demand

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye } from 'lucide-react';
import { AIExchangeLedger } from '@/components/transparency/AIExchangeLedger';

export default function TransparencyLedgerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading' || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/settings"
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux paramètres
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Eye className="h-6 w-6" />
            Journal de transparence IA
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pour chaque opération, retrouvez exactement ce qui a été envoyé à
            l&apos;IA et ce qu&apos;elle a répondu. La recherche et les filtres
            portent uniquement sur les métadonnées ; le contenu n&apos;est
            déchiffré qu&apos;à l&apos;ouverture d&apos;une ligne.
          </p>
        </div>

        <AIExchangeLedger />
      </main>
    </div>
  );
}
