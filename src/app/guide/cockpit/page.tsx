// ABOUTME: Guide « Le Project Cockpit » — tableau de bord du projet : tâches, objectifs, recherche, préférences autocomplétion, registre canon, statistiques IA.
// ABOUTME: Reflète les sous-sections réelles du cockpit (characters, tasks, objectives, research, settings, canon, usage).

import Link from 'next/link';

export const metadata = {
  title: 'Le Project Cockpit de Revise',
  description:
    "Le tableau de bord de votre projet : personnages, tâches, objectifs, documents de recherche, préférences d'autocomplétion, registre canon et statistiques IA.",
};

export default function GuideCockpitPage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-muted-foreground mb-3">Guide · Project Cockpit</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Le Project Cockpit</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Au-delà du texte, un roman se pilote. Le Cockpit rassemble tout ce qui entoure
          l&apos;écriture — et que l&apos;IA peut mobiliser pour mieux vous aider. Il est accessible
          depuis votre projet, et un raccourci vers le Cockpit existe dans l&apos;éditeur.
        </p>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Tableau de bord</h2>
            <p>
              Une vue d&apos;ensemble de votre projet : avancement, image de couverture et accès
              rapide à chaque espace du Cockpit.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Personnages</h2>
            <p>
              Créez et gérez les fiches de vos personnages. C&apos;est aussi d&apos;ici que vous
              lancez le <Link href="/guide/personnages" className="text-primary hover:underline">chat avec un personnage</Link>{' '}
              et l&apos;Auto-fill de sa fiche.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Tâches</h2>
            <p>
              Une liste de tâches propre au projet, avec priorité et statut : « revoir le chapitre 3 »,
              « clarifier la motivation de l&apos;antagoniste »… Gardez vos intentions au même endroit
              que votre texte.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Objectifs d&apos;écriture</h2>
            <p>
              Fixez des objectifs <strong>quotidiens, hebdomadaires ou totaux</strong> (en nombre de
              mots) et suivez votre progression. La régularité, plus que l&apos;inspiration, fait les
              manuscrits terminés.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Documents de recherche</h2>
            <p>
              Rassemblez vos notes d&apos;univers, biographies, repères historiques. Ces documents
              ne servent pas qu&apos;à vous : ils <strong>nourrissent le contexte de l&apos;IA</strong>,
              pour des suggestions plus fidèles à votre monde (voir{' '}
              <Link href="/guide/assistant-ia" className="text-primary hover:underline">d&apos;où l&apos;IA tire son contexte</Link>).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Préférences d&apos;autocomplétion</h2>
            <p>
              Cette section vous permet de régler le comportement de l&apos;autocomplétion pour ce
              projet spécifiquement — les préférences sont indépendantes d&apos;un projet à l&apos;autre.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Longueur des suggestions</strong> — <em>Courte</em> : un mot ou deux.{' '}
                <em>Moyenne</em> : demi-phrase. <em>Longue</em> : phrase complète ou plus.
              </li>
              <li>
                <strong>Audace</strong> — <em>Prudente</em> : la suite la plus attendue, proche de
                votre tournure. <em>Équilibrée</em> : légère prise de risque. <em>Audacieuse</em> :
                ose une image, une formulation inattendue.
              </li>
              <li>
                <strong>Prérécupération silencieuse</strong> — Revise prépare une suggestion en
                arrière-plan pendant que vous écrivez. Quand le point animé est visible, la
                suggestion s&apos;affiche sans délai.
              </li>
              <li>
                <strong>Acceptation mot à mot</strong> — Active ou désactive la flèche droite (→)
                pour accepter un seul mot à la fois.
              </li>
              <li>
                <strong>Apprentissage depuis les rejets</strong> — Opt-in : permet à Revise
                d&apos;enregistrer vos acceptations et rejets pour affiner les suggestions au fil du
                temps. Aucune donnée n&apos;est partagée sans votre accord explicite.
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Pour comprendre comment utiliser ces réglages depuis l&apos;éditeur, voir{' '}
              <Link href="/guide/assistant-ia" className="text-primary hover:underline">les outils d&apos;écriture IA</Link>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Registre canon</h2>
            <p>
              Sur un roman long, l&apos;IA ne peut pas relire l&apos;ensemble du manuscrit à chaque
              suggestion. Le registre canon résout ce problème : il extrait automatiquement les
              faits établis de votre texte — personnages, lieux, relations, événements — et les
              tient à jour au fil de l&apos;écriture.
            </p>
            <p>
              Ces faits sont injectés dans le contexte des suggestions pour éviter les incohérences
              : un personnage aux yeux verts ne les retrouvera pas bleus au chapitre 12, un lieu
              décrit au nord ne migrera pas au sud.
            </p>
            <p>
              Dans cette section du Cockpit, vous pouvez consulter les faits détectés et en{' '}
              <strong>valider ou invalider</strong> certains. Un fait invalidé n&apos;est plus utilisé
              dans les suggestions — utile si le modèle a extrait une interprétation erronée ou si
              votre roman a délibérément évolué.
            </p>
            <div className="rounded-lg border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
              Le registre canon est alimenté uniquement par ce que vous avez <em>écrit</em> dans le
              manuscrit. Revise n&apos;invente pas de faits et ne présente jamais une déduction comme
              une certitude établie.
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Statistiques &amp; coûts IA</h2>
            <p>
              Comme vous utilisez votre propre clé API, Revise suit vos appels et estime leur{' '}
              <strong>coût en euros</strong>, calculé par token selon le modèle utilisé. Vous gardez
              une vision claire de votre consommation, sans surprise.
            </p>
            <p>
              La section Autocomplétion des statistiques détaille les suggestions proposées,
              acceptées et rejetées par période — utile pour comprendre si les réglages d&apos;audace
              ou de longueur correspondent à votre usage réel.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/guide/personnages" className="text-sm text-primary hover:underline">Vos personnages</Link>
            <Link href="/guide/assistant-ia" className="text-sm text-primary hover:underline">Les outils d&apos;écriture IA</Link>
            <Link href="/guide/providers" className="text-sm text-primary hover:underline">Configurer l&apos;IA</Link>
            <Link href="/guide/manuscrit" className="text-sm text-primary hover:underline">Gérer son manuscrit</Link>
            <Link href="/guide" className="text-sm text-primary hover:underline">Retour au guide</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
