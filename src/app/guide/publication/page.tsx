// ABOUTME: Guide « Profils de publication & aperçu du livre » — profils KDP 6×9/A5/passerelle, typographie par profil, TOC, annexes, aperçu paginé du livre entier.
// ABOUTME: Décrit le pipeline de mise en page unifié qui pagine à la fois l'éditeur et l'export.

import Link from 'next/link';

export const metadata = {
  title: 'Profils de publication & aperçu du livre — Revise',
  description:
    "Choisissez un profil d'impression (KDP 6×9, A5, passerelle), personnalisez la table des matières et les annexes, et prévisualisez votre livre entier paginé avant export.",
};

export default function GuidePublicationPage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-muted-foreground mb-3">Guide · Publication</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          Profils de publication &amp; aperçu du livre
        </h1>
        <p className="text-lg text-muted-foreground mb-10">
          Un manuscrit et un livre publié n&apos;ont pas la même mise en page. Revise fait
          disparaître l&apos;aller-retour habituel vers un logiciel de mise en page : l&apos;éditeur
          et l&apos;export utilisent le même moteur de pagination, avec le même résultat.
        </p>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Choisir un profil d&apos;impression</h2>
            <p>Un projet a un profil de publication, qui détermine le format final :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>KDP 6×9</strong> — le format le plus courant pour l&apos;auto-édition sur
                Amazon KDP.
              </li>
              <li>
                <strong>A5</strong> — format européen classique, adapté à d&apos;autres plateformes
                d&apos;impression à la demande.
              </li>
              <li>
                <strong>Passerelle</strong> — un mode de transition non paginé, pour retravailler le
                texte librement avant de choisir un format d&apos;impression définitif.
              </li>
            </ul>
            <p>
              Basculez de profil directement depuis l&apos;éditeur : la mise en page se recalcule
              immédiatement, marges et police comprises.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Une typographie par profil</h2>
            <p>
              Chaque profil garde ses propres réglages de police, taille, graisse et interligne pour
              chaque type de bloc (corps de texte, titre de chapitre, sous-titre, citation…). Changer
              de profil ne réécrit jamais votre texte : seule sa présentation s&apos;adapte.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Table des matières &amp; pages liminaires</h2>
            <p>
              La table des matières se génère automatiquement, avec une profondeur (chapitres seuls,
              ou chapitres et sous-titres) et un style — classique, épuré ou littéraire — que vous
              choisissez. Les pages liminaires (page de titre, copyright) sont numérotées en folios
              romains, comme dans un livre imprimé.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Annexes personnalisées</h2>
            <p>
              Ajoutez des annexes en tête ou en fin d&apos;ouvrage — dédicace, épigraphe, mentions
              légales, ou tout texte personnalisé — et choisissez leur ordre d&apos;apparition.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Aperçu du livre entier</h2>
            <p>
              Avant d&apos;exporter, prévisualisez votre roman entier tel qu&apos;il sera imprimé :
              pagination réelle, sauts de page, numérotation continue. Naviguez chapitre par
              chapitre ou sous-titre par sous-titre directement dans l&apos;aperçu.
            </p>
            <p>
              C&apos;est ce même rendu qui est utilisé pour l&apos;export final — ce que vous voyez
              dans l&apos;aperçu est ce que vous obtiendrez en PDF.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/guide/editeur" className="text-sm text-primary hover:underline">L&apos;éditeur</Link>
            <Link href="/guide/manuscrit" className="text-sm text-primary hover:underline">Gérer son manuscrit</Link>
            <Link href="/guide" className="text-sm text-primary hover:underline">Retour au guide</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
