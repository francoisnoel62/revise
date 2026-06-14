// ABOUTME: Guide « Gérer son manuscrit » — chapitres, import .docx/Markdown, export DOCX/PDF, couverture, temps de lecture, partage public.
// ABOUTME: Couvre la gestion documentaire du projet, sans logique métier (page statique).

import Link from 'next/link';

export const metadata = {
  title: 'Gérer son manuscrit dans Revise',
  description:
    "Organiser ses chapitres, importer un .docx ou un dossier Markdown, exporter en DOCX/PDF avec couverture, et partager son projet via un lien public en lecture seule.",
};

export default function GuideManuscritPage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-muted-foreground mb-3">Guide · Manuscrit</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Gérer son manuscrit</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Un roman, c&apos;est des chapitres qui bougent, des imports, des exports et, un jour, un
          texte qu&apos;on montre. Revise gère tout ce cycle de vie.
        </p>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Organiser ses chapitres</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Un <strong>panneau latéral</strong> liste tous vos chapitres.</li>
              <li>Réordonnez-les par <strong>glisser-déposer</strong>.</li>
              <li>Renommez un chapitre <strong>directement en ligne</strong>, sans boîte de dialogue.</li>
              <li>Changez de chapitre instantanément, votre travail étant déjà sauvegardé.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Importer un manuscrit existant</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Fichier .docx</strong> : Revise découpe automatiquement votre document en
                chapitres à partir des titres de niveau 1 (H1).
              </li>
              <li>
                <strong>Dossier Markdown</strong> : importez un dossier de fichiers{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-sm">.md</code> — chaque fichier
                devient un chapitre.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Exporter son texte</h2>
            <p>Exportez votre manuscrit en deux formats, en conservant votre typographie :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>DOCX</strong> — pour Word, vos relectures, vos bêta-lecteurs.</li>
              <li><strong>PDF</strong> — pour partager une version figée, avec image de couverture.</li>
            </ul>
            <p>
              Vous <strong>choisissez les chapitres</strong> à inclure : exportez tout le roman, ou
              seulement les chapitres prêts.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Image de couverture</h2>
            <p>
              Ajoutez une image de couverture à votre projet. Elle illustre votre tableau de bord et
              accompagne vos exports PDF.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Temps de lecture</h2>
            <p>
              Revise estime le temps de lecture de chaque chapitre — utile pour jauger le rythme de
              votre récit et calibrer vos chapitres.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Partager son projet</h2>
            <p>
              Générez un <strong>lien public unique en lecture seule</strong> pour faire lire votre
              projet à un proche, un bêta-lecteur ou un éditeur — sans qu&apos;il puisse modifier
              quoi que ce soit, et en choisissant les chapitres partagés.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/guide/editeur" className="text-sm text-primary hover:underline">L&apos;éditeur</Link>
            <Link href="/guide/cockpit" className="text-sm text-primary hover:underline">Le Project Cockpit</Link>
            <Link href="/guide/analyses" className="text-sm text-primary hover:underline">Analyser &amp; vérifier</Link>
            <Link href="/guide" className="text-sm text-primary hover:underline">Retour au guide</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
