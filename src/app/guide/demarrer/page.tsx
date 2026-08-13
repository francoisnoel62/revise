// ABOUTME: Guide « Premiers pas » — parcours de prise en main de Revise en 5 minutes (compte, IA, projet, première réécriture).
// ABOUTME: Page statique orientée tâche : le geste d'abord, l'explication ensuite.

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Premiers pas avec Revise — Démarrer en 5 minutes',
  description:
    "Créez votre compte, connectez une IA, créez ou importez un projet et vivez votre première réécriture en quelques minutes.",
};

export default function GuideDemarrerPage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-muted-foreground mb-3">Guide · Premiers pas</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Démarrer en 5 minutes</h1>
        <p className="text-lg text-muted-foreground mb-10">
          L&apos;objectif de cette page : vous faire vivre le « déclic » de la réécriture le plus
          vite possible. Quatre étapes, et vous écrivez.
        </p>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Créez votre compte</h2>
            <p>
              Rendez-vous sur la page d&apos;
              <Link href="/auth/signup" className="text-primary hover:underline">inscription</Link>{' '}
              et renseignez votre email et un mot de passe. Une vérification anti-robot (hCaptcha)
              protège le formulaire.
            </p>
            <p>
              Pour préserver la qualité du service, les inscriptions sont{' '}
              <strong>soumises à approbation</strong> : vous recevez un email dès que votre compte
              est validé. Vous pourrez ensuite vous{' '}
              <Link href="/auth/signin" className="text-primary hover:underline">connecter</Link>.
            </p>
            <p className="text-sm text-muted-foreground">
              Mot de passe oublié ? Un lien de réinitialisation est disponible depuis la page de
              connexion.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Connectez une IA (optionnel pour commencer)</h2>
            <p>
              Revise fonctionne avec <strong>votre propre clé API</strong>. Depuis le{' '}
              <Link href="/dashboard" className="text-primary hover:underline">tableau de bord</Link>,
              ouvrez <strong>Mes providers</strong> dans le menu utilisateur, puis ajoutez une clé
              OpenAI, Anthropic ou Google AI et choisissez votre modèle. Votre clé est chiffrée et
              n&apos;est jamais exposée côté navigateur.
            </p>
            <p>
              Vous pouvez créer un projet et écrire <strong>sans configurer d&apos;IA</strong> ; la
              clé n&apos;est requise que pour les fonctionnalités d&apos;assistance (réécriture,
              analyses, chat…). Voir{' '}
              <Link href="/guide/providers" className="text-primary hover:underline">Configurer l&apos;IA</Link>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Créez ou importez un projet</h2>
            <p>
              Depuis votre tableau de bord, créez un projet vierge ou importez un manuscrit existant :
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Import .docx</strong> : Revise détecte automatiquement vos chapitres à
                partir des titres de niveau 1 (H1).
              </li>
              <li>
                <strong>Import d&apos;un dossier Markdown</strong> : chaque fichier <code className="bg-muted px-1 py-0.5 rounded text-sm">.md</code> devient un chapitre.
              </li>
            </ul>
            <p>Détails dans <Link href="/guide/manuscrit" className="text-primary hover:underline">Gérer son manuscrit</Link>.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Votre première réécriture</h2>
            <p>C&apos;est le cœur de Revise, et c&apos;est sans friction :</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Sélectionnez un passage qui vous dérange dans votre texte.</li>
              <li>Cliquez sur <strong>Réécrire</strong>.</li>
              <li>Comparez <strong>3 alternatives</strong> — épuré, lyrique, amplifié.</li>
              <li>Insérez celle qui vous convient… ou aucune. C&apos;est vous l&apos;auteur.</li>
            </ol>
            <p className="text-muted-foreground">
              Pas de chat, pas d&apos;explications imposées : vous restez dans votre flow. Pendant
              que l&apos;IA travaille, une citation d&apos;auteur vous tient compagnie.
            </p>
          </section>
        </div>

        <div className="mt-12 rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold mb-2">Et ensuite ?</h2>
          <p className="text-muted-foreground mb-4">
            Une fois à l&apos;aise, explorez les outils qui font de Revise un véritable co-auteur.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/guide/assistant-ia">
              <Button>
                Les outils d&apos;écriture IA
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/guide/editeur">
              <Button variant="outline">Découvrir l&apos;éditeur</Button>
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/guide/providers" className="text-sm text-primary hover:underline">Configurer l&apos;IA</Link>
            <Link href="/guide/manuscrit" className="text-sm text-primary hover:underline">Gérer son manuscrit</Link>
            <Link href="/guide/confidentialite" className="text-sm text-primary hover:underline">Vos données &amp; votre sécurité</Link>
            <Link href="/guide" className="text-sm text-primary hover:underline">Retour au guide</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
