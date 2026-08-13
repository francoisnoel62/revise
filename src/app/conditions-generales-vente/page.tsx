// ABOUTME: Current commercial-status page.
// ABOUTME: Revise has no paid checkout or subscription flow in the application today.

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Conditions Générales de Vente - Revise',
  description: 'État commercial actuel de Revise',
};

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2"><span className="text-xl font-bold">Revise</span></Link>
            <Link href="/"><Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Retour à l&apos;accueil</Button></Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Conditions Générales de Vente</h1>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm">
                <strong>État actuel du produit :</strong> Revise est proposé en bêta gratuite. Le code
                de l&apos;application ne comporte ni abonnement payant, ni panier, ni moyen de paiement,
                ni facturation, ni fonctionnalité premium.
              </p>
            </div>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Accès actuel</h2>
              <p>
                L&apos;accès à la bêta est gratuit après création et approbation du compte. Les conditions
                applicables à l&apos;usage du service sont les{' '}
                <Link href="/conditions-generales-utilisation" className="text-primary hover:underline">Conditions Générales d&apos;Utilisation</Link>.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Coûts des fournisseurs IA</h2>
              <p>
                Revise permet de configurer une clé API personnelle chez OpenAI, Anthropic ou Google.
                Les éventuels coûts liés à cette clé sont facturés par le fournisseur concerné, selon
                ses propres conditions ; Revise ne les encaisse pas.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Absence de vente dans la version actuelle</h2>
              <p>
                Il n&apos;existe actuellement aucun tarif Revise, renouvellement automatique, paiement par
                carte, facture, remboursement ou droit de rétractation attaché à une vente réalisée dans
                l&apos;application.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Évolution vers une offre payante</h2>
              <p>
                Si une offre payante est mise en place, ses prix, modalités de souscription, facturation,
                résiliation, garanties et droits applicables seront présentés avant tout paiement. Des
                conditions de vente adaptées devront alors être rédigées et validées juridiquement.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Données et contact</h2>
              <p>
                Les traitements de données de la bêta sont décrits dans la{' '}
                <Link href="/politique-confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
                Pour toute question, écrivez à{' '}
                <a href="mailto:francoisnoel62@gmail.com" className="text-primary hover:underline">francoisnoel62@gmail.com</a>.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/conditions-generales-utilisation" className="text-sm text-primary hover:underline">Conditions Générales d&apos;Utilisation</Link>
              <Link href="/politique-confidentialite" className="text-sm text-primary hover:underline">Politique de confidentialité</Link>
              <Link href="/mentions-legales" className="text-sm text-primary hover:underline">Mentions légales</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
