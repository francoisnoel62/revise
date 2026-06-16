// ABOUTME: Guide « Les outils d'écriture IA » — réécriture 3 styles, palette de commandes, autocomplétion (gestes, variantes, dot), contexte manuscrit-premier.
// ABOUTME: Insiste sur le principe « l'IA suggère, l'auteur décide » présent dans chaque fonctionnalité.

import Link from 'next/link';

export const metadata = {
  title: "Les outils d'écriture IA de Revise",
  description:
    "Réécriture en 3 styles, palette de commandes IA, autocomplétion au Tab avec acceptation partielle et variantes — l'IA suggère, vous décidez.",
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
            <h2 className="text-2xl font-semibold">Autocomplétion</h2>
            <p>
              L&apos;autocomplétion est la fonctionnalité IA centrale de Revise. Elle vous tend
              la prochaine phrase possible — sans jamais finir votre chapitre à votre place.
            </p>

            <h3 className="text-lg font-semibold mt-4">Le point animé</h3>
            <p>
              Un petit point discret apparaît parfois dans la marge de l&apos;éditeur. Il indique
              qu&apos;une suggestion est déjà prête en arrière-plan. Quand il est visible, appuyer
              sur{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-sm">Tab</code> affiche la
              suggestion instantanément, sans aucune attente.
            </p>

            <h3 className="text-lg font-semibold mt-4">Les trois gestes</h3>
            <p>
              Une fois la suggestion affichée à l&apos;écran, vous avez trois options :
            </p>
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Geste</th>
                    <th className="px-4 py-3 text-left font-semibold">Effet</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">Tab</td>
                    <td className="px-4 py-3">Accepter toute la suggestion</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">→ (flèche droite)</td>
                    <td className="px-4 py-3">Accepter seulement le premier mot</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">Échap ou continuer à écrire</td>
                    <td className="px-4 py-3">Ignorer la suggestion</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground">
              L&apos;acceptation mot à mot est utile quand seul le début de la suggestion vous
              convient. Vous piochez ce dont vous avez besoin sans rien supprimer.
            </p>

            <h3 className="text-lg font-semibold mt-4">Les variantes</h3>
            <p>
              Selon le ton de votre scène — dialogue, description, introspection — Revise peut
              proposer plusieurs continuations possibles, chacune calibrée différemment. Les hints
              affichés sous la suggestion vous indiquent les touches{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-sm">1</code>,{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-sm">2</code>,{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-sm">3</code>… pour naviguer entre
              elles sans quitter le texte.
            </p>

            <div className="rounded-lg border bg-muted/30 px-5 py-4 text-sm space-y-2">
              <p className="font-semibold">Ce que Revise n&apos;apprend pas</p>
              <p className="text-muted-foreground">
                Le système peut s&apos;adapter à vos préférences d&apos;assistance (longueur des
                suggestions, audace) à partir de vos acceptations et rejets. Il n&apos;apprend
                jamais à imiter votre style ou à standardiser votre voix. La singularité du texte
                reste la vôtre.
              </p>
              <p className="text-muted-foreground">
                Ces réglages se configurent dans le{' '}
                <Link href="/guide/cockpit" className="text-primary hover:underline">Cockpit du projet</Link>.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">D&apos;où l&apos;IA tire son contexte</h2>
            <p>
              Pour l&apos;autocomplétion, Revise part toujours du <strong>texte réel</strong> que vous
              avez écrit — les paragraphes autour de votre curseur. C&apos;est ce que vous avez écrit
              qui prime, pas un résumé ou une analyse générée à un autre moment.
            </p>
            <p>
              Ce principe — <em>manuscrit-premier</em> — évite deux problèmes courants : des
              suggestions qui contredisent ce que vous venez d&apos;écrire, et une IA qui répond à
              une ancienne version de votre texte.
            </p>
            <p>
              Pour les romans longs, le{' '}
              <Link href="/guide/cockpit" className="text-primary hover:underline">registre canon</Link>{' '}
              complète ce contexte local avec les faits établis de votre univers — personnages,
              lieux, relations — extraits du manuscrit lui-même.
            </p>
            <p className="text-muted-foreground">
              La langue est préservée : un texte français reste complété en français, un texte
              anglais en anglais.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/guide/cockpit" className="text-sm text-primary hover:underline">Préférences d&apos;autocomplétion (Cockpit)</Link>
            <Link href="/guide/analyses" className="text-sm text-primary hover:underline">Analyser &amp; vérifier</Link>
            <Link href="/guide/providers" className="text-sm text-primary hover:underline">Configurer l&apos;IA</Link>
            <Link href="/guide" className="text-sm text-primary hover:underline">Retour au guide</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
