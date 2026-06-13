// ABOUTME: Guide « Vos données & votre sécurité » — propriété des écrits, RGPD, chiffrement, export et suppression de compte.
// ABOUTME: Page de confiance (argument marketing) renvoyant aux pages légales pour le détail juridique.

import Link from 'next/link';

export const metadata = {
  title: 'Vos données & votre sécurité dans Revise',
  description:
    "Vos écrits vous appartiennent et ne servent jamais à l'entraînement. Chiffrement AES-256-GCM, isolation par compte, export de vos données et suppression de compte (RGPD).",
};

export default function GuideConfidentialitePage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-muted-foreground mb-3">Guide · Données &amp; sécurité</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Vos données &amp; votre sécurité</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Un auteur confie son œuvre à Revise. Ce n&apos;est pas un détail technique, c&apos;est un
          pacte. Voici, concrètement, comment nous le respectons.
        </p>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Vos écrits vous appartiennent</h2>
            <p>
              Les textes que vous créez ou importez restent <strong>votre propriété exclusive</strong>.
              Ils ne sont <strong>jamais utilisés pour entraîner</strong> une IA. Revise est un outil
              au service de votre voix, pas une source d&apos;entraînement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Isolation par compte</h2>
            <p>
              Chaque projet est cloisonné : vos données ne sont accessibles qu&apos;à vous. Cette
              isolation par utilisateur est appliquée jusque dans la base de données.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Chiffrement &amp; authentification</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Vos clés API sont chiffrées en <strong>AES-256-GCM</strong> et jamais exposées côté navigateur.</li>
              <li>Vos mots de passe sont hachés avec <strong>bcrypt</strong>.</li>
              <li>L&apos;accès est protégé contre les abus : <strong>rate limiting</strong> et vérification anti-robot (hCaptcha) à l&apos;inscription.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Vos droits RGPD, en pratique</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Export de vos données</strong> personnelles (droit à la portabilité, article 20).</li>
              <li><strong>Suppression de compte</strong> avec effacement de toutes les données associées.</li>
              <li><strong>Consentement</strong> enregistré, et bannière de cookies conforme.</li>
            </ul>
            <p>
              Ces actions se gèrent depuis vos{' '}
              <Link href="/settings" className="text-primary hover:underline">paramètres</Link>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Documents juridiques</h2>
            <p>Pour le détail complet, consultez nos pages dédiées :</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/conditions-generales-utilisation" className="text-sm text-primary hover:underline">CGU</Link>
              <Link href="/conditions-generales-vente" className="text-sm text-primary hover:underline">CGV</Link>
              <Link href="/mentions-legales" className="text-sm text-primary hover:underline">Mentions légales</Link>
              <Link href="/politique-confidentialite" className="text-sm text-primary hover:underline">Politique de confidentialité</Link>
              <Link href="/politique-cookies" className="text-sm text-primary hover:underline">Politique de cookies</Link>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/guide/providers" className="text-sm text-primary hover:underline">Configurer l&apos;IA</Link>
            <Link href="/guide/demarrer" className="text-sm text-primary hover:underline">Premiers pas</Link>
            <Link href="/guide" className="text-sm text-primary hover:underline">Retour au guide</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
