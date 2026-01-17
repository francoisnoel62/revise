// ABOUTME: Page de politique de cookies conforme à la directive ePrivacy et RGPD
// ABOUTME: Décrit les cookies utilisés, leurs finalités et la gestion du consentement

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Cookie, Shield, Clock, Settings } from 'lucide-react';

export const metadata = {
  title: 'Politique de cookies - Revise',
  description: 'Informations sur l\'utilisation des cookies et traceurs par Revise',
};

export default function PolitiqueCookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
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

      {/* Content */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Politique de cookies</h1>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <p className="text-lg">
              Cette politique vous informe sur l&apos;utilisation des cookies et technologies similaires
              sur le site Revise, conformément à la directive européenne &quot;ePrivacy&quot; et au RGPD.
            </p>

            {/* Quick summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Cookies essentiels uniquement</p>
                  <p className="text-sm text-muted-foreground">Pas de cookies publicitaires ou de tracking</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Respect de votre vie privée</p>
                  <p className="text-sm text-muted-foreground">Aucune revente de données</p>
                </div>
              </div>
            </div>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
              <p>
                Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, tablette,
                smartphone) lors de votre visite sur un site web. Il permet au site de mémoriser
                certaines informations sur votre session, comme vos préférences ou votre statut
                de connexion.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Cookies utilisés par Revise</h2>
              <p>
                Nous utilisons exclusivement des <strong>cookies strictement nécessaires</strong> au
                fonctionnement du service. Ces cookies ne requièrent pas votre consentement préalable
                car ils sont indispensables à la fourniture du service que vous avez demandé.
              </p>

              <h3 className="text-xl font-medium mt-6">2.1 Cookies d&apos;authentification</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Nom</th>
                      <th className="text-left py-2 pr-4">Finalité</th>
                      <th className="text-left py-2 pr-4">Durée</th>
                      <th className="text-left py-2">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">authjs.session-token</td>
                      <td className="py-2 pr-4">Maintien de votre session de connexion</td>
                      <td className="py-2 pr-4">30 jours</td>
                      <td className="py-2">Essentiel</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">authjs.csrf-token</td>
                      <td className="py-2 pr-4">Protection contre les attaques CSRF</td>
                      <td className="py-2 pr-4">Session</td>
                      <td className="py-2">Essentiel</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">authjs.callback-url</td>
                      <td className="py-2 pr-4">Redirection après connexion</td>
                      <td className="py-2 pr-4">Session</td>
                      <td className="py-2">Essentiel</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-medium mt-6">2.2 Cookies techniques (Vercel)</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Nom</th>
                      <th className="text-left py-2 pr-4">Finalité</th>
                      <th className="text-left py-2 pr-4">Durée</th>
                      <th className="text-left py-2">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">__vercel_live_token</td>
                      <td className="py-2 pr-4">Prévisualisation en développement</td>
                      <td className="py-2 pr-4">Session</td>
                      <td className="py-2">Technique</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Cookies que nous n&apos;utilisons PAS</h2>
              <p>Pour respecter votre vie privée, Revise n&apos;utilise pas :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Cookies publicitaires</strong> - Pas de publicité, pas de remarketing
                </li>
                <li>
                  <strong>Cookies de tracking tiers</strong> - Pas de Google Analytics, Facebook Pixel, etc.
                </li>
                <li>
                  <strong>Cookies de réseaux sociaux</strong> - Pas de boutons de partage avec tracking
                </li>
                <li>
                  <strong>Cookies de profilage</strong> - Pas d&apos;analyse comportementale à des fins commerciales
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Stockage local (localStorage)</h2>
              <p>
                En plus des cookies, nous utilisons le localStorage de votre navigateur pour
                améliorer votre expérience :
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Clé</th>
                      <th className="text-left py-2 pr-4">Finalité</th>
                      <th className="text-left py-2">Durée</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">revise-store</td>
                      <td className="py-2 pr-4">État de l&apos;application (projet actif, préférences)</td>
                      <td className="py-2">Persistant (jusqu&apos;à suppression manuelle)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted-foreground">
                Le localStorage n&apos;est pas transmis aux serveurs et reste entièrement sur votre appareil.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Gérer les cookies</h2>
              <p>
                Vous pouvez à tout moment configurer votre navigateur pour accepter, refuser ou
                supprimer les cookies. Voici comment faire selon votre navigateur :
              </p>

              <div className="grid gap-3 not-prose mt-4">
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Google Chrome</p>
                    <p className="text-sm text-muted-foreground">Paramètres &gt; Confidentialité et sécurité</p>
                  </div>
                </a>
                <a
                  href="https://support.mozilla.org/fr/kb/effacer-cookies-donnees-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Mozilla Firefox</p>
                    <p className="text-sm text-muted-foreground">Options &gt; Vie privée et sécurité</p>
                  </div>
                </a>
                <a
                  href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Safari</p>
                    <p className="text-sm text-muted-foreground">Préférences &gt; Confidentialité</p>
                  </div>
                </a>
                <a
                  href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Microsoft Edge</p>
                    <p className="text-sm text-muted-foreground">Paramètres &gt; Cookies et autorisations</p>
                  </div>
                </a>
              </div>

              <div className="mt-6 p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                <p className="text-sm">
                  <strong>Attention :</strong> Si vous bloquez les cookies essentiels, vous ne pourrez
                  pas vous connecter à votre compte Revise ni accéder à vos projets sauvegardés.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Durée de conservation</h2>
              <div className="flex items-start gap-3 p-4 rounded-lg border bg-card not-prose">
                <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Cookie de session : 30 jours maximum</p>
                  <p className="text-sm text-muted-foreground">
                    Votre session expire automatiquement après 30 jours d&apos;inactivité.
                    Vous pouvez vous déconnecter manuellement à tout moment via le menu utilisateur.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Mises à jour de cette politique</h2>
              <p>
                Cette politique peut être mise à jour pour refléter des changements dans nos pratiques
                ou pour des raisons légales. En cas de modification substantielle, nous vous en
                informerons par email ou via une notification sur le site.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Contact</h2>
              <p>
                Pour toute question concernant notre utilisation des cookies, contactez-nous à :{' '}
                <a href="mailto:francoisnoel62@gmail.com" className="text-primary hover:underline">francoisnoel62@gmail.com</a>
              </p>
            </section>
          </div>

          {/* Navigation links */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/conditions-generales-utilisation" className="text-sm text-primary hover:underline">
                Conditions Générales d&apos;Utilisation
              </Link>
              <Link href="/conditions-generales-vente" className="text-sm text-primary hover:underline">
                Conditions Générales de Vente
              </Link>
              <Link href="/mentions-legales" className="text-sm text-primary hover:underline">
                Mentions légales
              </Link>
              <Link href="/politique-confidentialite" className="text-sm text-primary hover:underline">
                Politique de confidentialité
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
