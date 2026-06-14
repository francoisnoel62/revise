// ABOUTME: Guide « Configurer l'IA » — multi-providers (OpenAI, Anthropic, Google AI), clé apportée par l'utilisateur, modèle, coûts.
// ABOUTME: Explique le modèle BYOK et le chiffrement des clés, sans exposer de détail d'implémentation.

import Link from 'next/link';

export const metadata = {
  title: "Configurer l'IA dans Revise — Apportez votre clé",
  description:
    "Connectez votre propre clé OpenAI, Anthropic ou Google AI, choisissez votre modèle et suivez vos dépenses. Vos clés sont chiffrées et jamais exposées côté client.",
};

export default function GuideProvidersPage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-muted-foreground mb-3">Guide · Configurer l&apos;IA</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Configurer l&apos;IA</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Revise fonctionne avec <strong>votre propre clé API</strong> : vous choisissez le
          fournisseur, le modèle, et vous maîtrisez vos coûts. Pas d&apos;abonnement IA opaque.
        </p>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Trois fournisseurs au choix</h2>
            <p>Connectez le fournisseur d&apos;IA de votre choix :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>OpenAI</strong></li>
              <li><strong>Anthropic</strong> (Claude)</li>
              <li><strong>Google AI</strong> (Gemini)</li>
            </ul>
            <p>
              Tous passent par la même abstraction interne : où que vous écriviez, l&apos;expérience
              reste identique, seul le moteur change.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Ajouter une clé</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Ouvrez vos <Link href="/settings" className="text-primary hover:underline">paramètres</Link>.</li>
              <li>Ajoutez la clé API du fournisseur choisi.</li>
              <li>Sélectionnez le modèle à utiliser.</li>
            </ol>
            <p className="text-muted-foreground">
              Vous pouvez créer un projet et écrire sans clé : elle n&apos;est requise que pour les
              fonctionnalités IA (réécriture, analyses, chat de personnage…).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Vos clés sont protégées</h2>
            <p>
              Votre clé API est <strong>chiffrée (AES-256-GCM)</strong> au repos et n&apos;est{' '}
              <strong>jamais exposée côté navigateur</strong>. Les appels à l&apos;IA passent par le
              serveur de Revise, jamais directement depuis votre page.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Suivre ses dépenses</h2>
            <p>
              Chaque appel est mesuré et son coût estimé en euros, par token, selon le modèle. Vous
              retrouvez ce suivi dans les{' '}
              <Link href="/guide/cockpit" className="text-primary hover:underline">statistiques du Cockpit</Link>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/guide/demarrer" className="text-sm text-primary hover:underline">Premiers pas</Link>
            <Link href="/guide/cockpit" className="text-sm text-primary hover:underline">Statistiques &amp; coûts IA</Link>
            <Link href="/guide/confidentialite" className="text-sm text-primary hover:underline">Vos données &amp; votre sécurité</Link>
            <Link href="/guide" className="text-sm text-primary hover:underline">Retour au guide</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
