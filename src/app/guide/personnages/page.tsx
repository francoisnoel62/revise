// ABOUTME: Guide « Vos personnages » — chat immersif avec les personnages et fiche personnage auto-générée.
// ABOUTME: Décrit le chat SSE persisté et l'Auto-fill, en gardant le contrôle final à l'auteur.

import Link from 'next/link';

export const metadata = {
  title: 'Donner vie à ses personnages avec Revise',
  description:
    "Discutez avec vos personnages dans leur voix, conversation persistée et streaming en temps réel, et laissez l'IA pré-remplir leur fiche à partir du manuscrit.",
};

export default function GuidePersonnagesPage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-muted-foreground mb-3">Guide · Personnages</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Donner vie à vos personnages</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Quand un personnage sonne faux, le meilleur moyen de le comprendre est de lui parler.
          Revise vous laisse faire exactement cela.
        </p>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Discuter avec un personnage</h2>
            <p>
              Engagez une conversation avec n&apos;importe quel personnage de votre projet. Il
              répond <strong>dans sa voix</strong>, en s&apos;appuyant sur sa fiche (traits,
              motivations, arcs), sur votre manuscrit et sur les métadonnées du projet.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Streaming en temps réel</strong> : les réponses arrivent mot par mot, comme un vrai dialogue.</li>
              <li><strong>Historique persisté</strong> : la conversation est sauvegardée et reprend à la réouverture.</li>
              <li><strong>Copie rapide</strong> : un bouton « Copier » sur chaque réponse pour insérer une réplique dans votre manuscrit.</li>
            </ul>
            <p className="text-muted-foreground">
              C&apos;est un outil d&apos;exploration : tester une réaction, trouver le ton juste,
              débloquer un dialogue. Ce qui entre dans le roman, c&apos;est toujours votre choix.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">La fiche personnage auto-générée</h2>
            <p>
              Remplir une fiche personnage de zéro est fastidieux. Le bouton{' '}
              <strong>« Auto-fill »</strong> analyse votre manuscrit et propose un contenu pour les
              huit champs de la fiche.
            </p>
            <p>
              Conformément au principe de Revise, c&apos;est une <strong>proposition</strong> : vous
              gardez le contrôle final et ajustez chaque champ comme vous l&apos;entendez.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/guide/cockpit" className="text-sm text-primary hover:underline">Le Project Cockpit</Link>
            <Link href="/guide/analyses" className="text-sm text-primary hover:underline">Analyse des personnages</Link>
            <Link href="/guide/assistant-ia" className="text-sm text-primary hover:underline">Les outils d&apos;écriture IA</Link>
            <Link href="/guide" className="text-sm text-primary hover:underline">Retour au guide</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
