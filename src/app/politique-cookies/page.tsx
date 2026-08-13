// ABOUTME: Browser cookies and local preference storage used by the current application.
// ABOUTME: This page documents implementation facts; it is not a legal-compliance certification.

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Cookie, Shield, Clock } from 'lucide-react';

export const metadata = {
  title: 'Politique de cookies - Revise',
  description: 'Cookies et préférences de navigation utilisés par Revise',
};

export default function PolitiqueCookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">Revise</span>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l&apos;accueil
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Politique de cookies</h1>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <p className="text-lg">
              Cette page décrit les cookies créés par l&apos;application Revise dans son état actuel.
              Elle permet de comprendre leur rôle technique et de les gérer depuis le navigateur.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Connexion et préférences</p>
                  <p className="text-sm text-muted-foreground">Session, protection CSRF et état de l&apos;interface.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Pas de publicité intégrée</p>
                  <p className="text-sm text-muted-foreground">Aucun cookie publicitaire ni outil d&apos;audience tiers dans le code de l&apos;application.</p>
                </div>
              </div>
            </div>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Cookies utilisés</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Nom</th>
                      <th className="text-left py-2 pr-4">Rôle</th>
                      <th className="text-left py-2">Durée configurée</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">next-auth.session-token</td>
                      <td className="py-2 pr-4">Maintien de la session authentifiée ; cookie HttpOnly.</td>
                      <td className="py-2">Session du navigateur ; jeton valable au plus 30 jours.</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">authjs.csrf-token</td>
                      <td className="py-2 pr-4">Protection CSRF des actions d&apos;authentification.</td>
                      <td className="py-2">Session</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">cookieConsent</td>
                      <td className="py-2 pr-4">Mémorise l&apos;acceptation affichée par la bannière.</td>
                      <td className="py-2">Jusqu&apos;au 31 décembre 9999 dans la configuration actuelle.</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">sidebar_state</td>
                      <td className="py-2 pr-4">Conserve l&apos;état ouvert ou fermé de la barre latérale.</td>
                      <td className="py-2">7 jours</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">viewed_articles</td>
                      <td className="py-2 pr-4">Évite de compter plusieurs fois la même lecture d&apos;article de blog.</td>
                      <td className="py-2">24 heures</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Ce que l&apos;application n&apos;installe pas</h2>
              <p>
                Le code actuel n&apos;intègre ni cookie publicitaire, ni pixel de remarketing, ni outil
                tiers de mesure d&apos;audience tel que Google Analytics. Les statistiques facultatives
                d&apos;autocomplétion sont enregistrées côté serveur et ne reposent pas sur un cookie de
                suivi d&apos;audience.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Gérer vos choix</h2>
              <p>
                Vous pouvez supprimer ou bloquer ces cookies dans les réglages de votre navigateur.
                Cela déconnecte généralement votre session et peut réafficher la bannière. Dans la
                version actuelle, seule l&apos;acceptation de la bannière est enregistrée ; un refus ferme
                la bannière pour la session en cours sans écrire de cookie de refus.
              </p>
              <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-4 not-prose">
                <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Les durées ci-dessus sont celles définies dans le code. Elles seront mises à jour ici
                  en même temps que toute évolution de leur implémentation.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Contact</h2>
              <p>
                Pour une question sur cette page ou vos données, écrivez à{' '}
                <a href="mailto:francoisnoel62@gmail.com" className="text-primary hover:underline">francoisnoel62@gmail.com</a>.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/politique-confidentialite" className="text-sm text-primary hover:underline">Politique de confidentialité</Link>
              <Link href="/conditions-generales-utilisation" className="text-sm text-primary hover:underline">Conditions Générales d&apos;Utilisation</Link>
              <Link href="/mentions-legales" className="text-sm text-primary hover:underline">Mentions légales</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
