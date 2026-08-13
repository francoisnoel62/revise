// ABOUTME: Guide « L'éditeur » — manuscrit, publication, raccourcis clavier, compteur de mots et auto-save.
// ABOUTME: Décrit uniquement les capacités réellement présentes dans l'éditeur TipTap de Revise.

import Link from 'next/link';

export const metadata = {
  title: "L'éditeur Revise — Écrire comme dans un roman",
  description:
    "Le manuscrit, les profils de publication, le compteur de mots en temps réel, l'auto-save et les raccourcis clavier de l'éditeur Revise.",
};

const shortcuts: [string, string][] = [
  ['Gras', 'Ctrl/⌘ + B'],
  ['Italique', 'Ctrl/⌘ + I'],
  ['Souligné', 'Ctrl/⌘ + U'],
  ['Surligné', 'Ctrl/⌘ + Shift + H'],
  ['Tiret cadratin (—)', 'Ctrl/⌘ + K'],
  ['Annuler', 'Ctrl/⌘ + Z'],
  ['Rétablir', 'Ctrl/⌘ + Shift + Z'],
  ['Autocomplétion — déclencher / accepter tout', 'Tab'],
  ['Autocomplétion — accepter un mot', 'Ctrl/⌘ + →'],
  ['Autocomplétion — accepter un fragment', 'Alt + →'],
  ['Autocomplétion — ignorer', 'Échap'],
  ['Palette de commandes IA', 'Ctrl/⌘ + Shift + I'],
];

export default function GuideEditeurPage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-muted-foreground mb-3">Guide · L&apos;éditeur</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Écrire dans l&apos;éditeur</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Revise n&apos;est pas une fenêtre de chat : c&apos;est une vraie page de roman. L&apos;objectif
          est que vous oubliiez l&apos;outil et restiez dans votre texte.
        </p>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Le manuscrit et sa publication</h2>
            <p>
              Votre texte s&apos;affiche sur une page réaliste de 794&nbsp;px, avec ombres et marges
              confortables. Cette surface sert à écrire le manuscrit : elle ne constitue pas, à elle
              seule, le rendu final imprimé.
            </p>
            <p>
              Pour visualiser le livre publié, choisissez un profil KDP 6×9 ou A5 et ouvrez
              l&apos;aperçu de publication. Il s&apos;agit d&apos;un rendu paginé séparé ; le profil Passerelle
              est destiné au flux DOCX/Word ou Google Docs.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Typographie de roman</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Police</strong> : Georgia ou Times New Roman, de 11 à 16&nbsp;pt.</li>
              <li><strong>Mise en page</strong> : alignement, indentation de première ligne, interligne 1,5.</li>
              <li>Tous ces réglages se pilotent depuis la barre d&apos;outils de mise en forme.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Compteur de mots en temps réel</h2>
            <p>
              Le nombre de caractères et de mots se met à jour pendant que vous écrivez — pratique
              pour suivre votre progression face à un objectif (voir{' '}
              <Link href="/guide/cockpit" className="text-primary hover:underline">le Project Cockpit</Link>).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Annuler / Rétablir</h2>
            <p>
              Des boutons dédiés dans la barre d&apos;outils, doublés des raccourcis clavier
              habituels. Vous n&apos;avez jamais peur d&apos;expérimenter.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Sauvegarde automatique</h2>
            <p>
              Vos modifications sont enregistrées automatiquement, environ une seconde après que
              vous arrêtez d&apos;écrire. Un indicateur vous confirme l&apos;état de la sauvegarde —
              rien à cliquer, rien à perdre.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Notes de bas de page</h2>
            <p>
              Insérez un appel de note directement dans le texte ; une petite bulle affiche son
              contenu au survol. Un panneau dédié liste toutes les notes du chapitre, permet de les
              éditer ou de les supprimer, et fonctionne même sur un chapitre que vous n&apos;avez pas
              ouvert. À l&apos;export, elles deviennent de vraies notes de bas de page Word (DOCX) ou
              une section de fin d&apos;ouvrage (PDF).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Thésaurus contextuel</h2>
            <p>
              Cliquez sur un mot pour ouvrir une palette d&apos;alternatives : une recherche lexicale
              instantanée (aucun appel IA) et, à la demande, une suggestion IA ancrée sur votre
              propre voix plutôt que sur un registre générique.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Historique de versions</h2>
            <p>
              Revise capture régulièrement des <strong>snapshots</strong> de votre projet —
              automatiquement selon l&apos;intervalle que vous choisissez, ou manuellement à tout
              moment. Consultez l&apos;historique, comparez une version passée à l&apos;état actuel,
              et restaurez-la sans perdre votre travail en cours : un snapshot de sécurité est pris
              avant toute restauration.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Une attente jamais vide</h2>
            <p>
              Quand l&apos;IA réfléchit, l&apos;écran d&apos;attente fait défiler une centaine de
              citations d&apos;auteurs. Un détail, mais qui transforme une attente technique en
              respiration créative.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Tous les raccourcis clavier</h2>
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Action</th>
                    <th className="px-4 py-3 text-left font-semibold">Raccourci</th>
                  </tr>
                </thead>
                <tbody>
                  {shortcuts.map(([action, keys]) => (
                    <tr key={action} className="border-t">
                      <td className="px-4 py-3">{action}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{keys}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/guide/assistant-ia" className="text-sm text-primary hover:underline">Les outils d&apos;écriture IA</Link>
            <Link href="/guide/manuscrit" className="text-sm text-primary hover:underline">Gérer son manuscrit</Link>
            <Link href="/guide/publication" className="text-sm text-primary hover:underline">Profils de publication &amp; aperçu du livre</Link>
            <Link href="/guide/cockpit" className="text-sm text-primary hover:underline">Le Project Cockpit</Link>
            <Link href="/guide" className="text-sm text-primary hover:underline">Retour au guide</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
