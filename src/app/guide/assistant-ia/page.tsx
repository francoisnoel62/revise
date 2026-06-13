// ABOUTME: Guide « Les outils d'écriture IA » — réécriture 3 styles, palette de commandes, autocomplétion, génération, stratégie de contexte.
// ABOUTME: Insiste sur le principe « l'IA suggère, l'auteur décide » présent dans chaque fonctionnalité.

import Link from 'next/link';

export const metadata = {
  title: "Les outils d'écriture IA de Revise",
  description:
    "Réécriture en 3 styles, palette de commandes IA, autocomplétion au Tab, génération de texte et stratégie de contexte. L'IA suggère, vous décidez.",
};

export default function GuideAssistantIaPage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-muted-foreground mb-3">Guide · Outils d&apos;écriture IA</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Les outils d&apos;écriture IA</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Tous ces outils partagent une règle : l&apos;IA <strong>propose</strong>, vous{' '}
          <strong>décidez</strong>. Jamais une réponse unique imposée — toujours un choix que vous
          gardez la liberté d&apos;insérer, d&apos;adapter ou d&apos;ignorer.
        </p>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Réécriture en 3 styles</h2>
            <p>
              Sélectionnez un passage, cliquez <strong>Réécrire</strong>, et comparez trois
              alternatives distinctes :
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Épuré</strong> — va à l&apos;essentiel, resserre la phrase.</li>
              <li><strong>Lyrique</strong> — travaille le souffle, les images, la musicalité.</li>
              <li><strong>Amplifié</strong> — pousse l&apos;intensité, l&apos;émotion, la tension.</li>
            </ul>
            <p>
              Trois propositions, ni plus ni moins : assez pour avoir un vrai choix, sans surcharge
              cognitive. Vous insérez celle qui vous parle, ou aucune.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">La palette de commandes IA</h2>
            <p>
              Appuyez sur <code className="bg-muted px-1 py-0.5 rounded text-sm">Ctrl/⌘ + Shift + I</code>{' '}
              pour ouvrir la palette de commandes : un menu unifié qui regroupe les actions IA
              accessibles au clavier, sans quitter le texte.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Autocomplétion au Tab</h2>
            <p>
              En cours de phrase, appuyez sur <code className="bg-muted px-1 py-0.5 rounded text-sm">Tab</code>{' '}
              pour déclencher une suggestion de continuation, qui s&apos;affiche en temps réel
              (streaming). Un second <code className="bg-muted px-1 py-0.5 rounded text-sm">Tab</code>{' '}
              l&apos;accepte ; sinon, continuez simplement à écrire et elle disparaît.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Générer le début d&apos;un chapitre</h2>
            <p>
              Face à une page blanche, demandez à Revise de générer un début de chapitre. La
              génération s&apos;appuie sur le contexte de votre projet pour rester cohérente avec
              votre univers — un point de départ à retravailler, pas un texte « final ».
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">D&apos;où l&apos;IA tire son contexte</h2>
            <p>
              Les suggestions sont d&apos;autant meilleures qu&apos;elles connaissent votre univers.
              Revise nourrit l&apos;IA avec :
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>les <strong>métadonnées</strong> et analyses de votre manuscrit ;</li>
              <li>vos <strong>documents de recherche</strong> (voir le Cockpit) ;</li>
              <li>le contenu du chapitre en cours.</li>
            </ul>
            <p>
              Deux garde-fous essentiels : <strong>l&apos;édition de l&apos;auteur l&apos;emporte</strong>{' '}
              (ce que vous écrivez prime sur ce que l&apos;IA avait compris), et un{' '}
              <strong>indicateur de péremption</strong> vous signale quand une analyse n&apos;est plus
              à jour avec votre texte.
            </p>
            <p className="text-muted-foreground">
              La langue est préservée : un texte français reste réécrit en français, un texte
              anglais en anglais.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/guide/analyses" className="text-sm text-primary hover:underline">Analyser &amp; vérifier</Link>
            <Link href="/guide/cockpit" className="text-sm text-primary hover:underline">Documents de recherche (Cockpit)</Link>
            <Link href="/guide/providers" className="text-sm text-primary hover:underline">Configurer l&apos;IA</Link>
            <Link href="/guide" className="text-sm text-primary hover:underline">Retour au guide</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
