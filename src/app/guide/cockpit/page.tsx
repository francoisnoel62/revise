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
            <h2 className="text-2xl font-semibold">Objectifs &amp; quotas d&apos;écriture</h2>
            <p>Revise distingue deux façons de vous fixer un cap :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Un objectif ponctuel</strong> — un nombre de mots cible pour le projet, avec
                une échéance optionnelle. Utile pour un « je veux finir ce roman avant le 1er
                décembre ».
              </li>
              <li>
                <strong>Un quota récurrent</strong> — un rythme quotidien ou hebdomadaire (« 500 mots
                par jour ») que Revise suit dans le temps plutôt qu&apos;une seule fois. Une session
                de coupe ne vous fait jamais passer en négatif.
              </li>
            </ul>
            <p>
              Un graphique d&apos;activité affiche votre rythme réel jour après jour, à comparer à
              votre quota — utile pour voir si vous tenez la cadence sans attendre la fin du
              manuscrit pour le découvrir.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Documents de recherche</h2>
            <p>
              Rassemblez vos notes d&apos;univers, biographies et repères historiques. Elles peuvent
              nourrir certains outils IA, notamment la génération de chapitre, la réécriture et la
              persona des personnages. Elles ne sont pas injectées dans le flux streaming
              d&apos;autocomplétion actuel.
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
                <strong>Acceptation partielle</strong> — Utilisez <code>Ctrl/⌘ + →</code> pour
                accepter un mot ou <code>Alt + →</code> pour accepter un fragment.
              </li>
              <li>
                <strong>Partage des statistiques d&apos;usage</strong> — Opt-in : enregistre des
                longueurs, délais, acceptations et rejets associés au projet, sans le texte des
                suggestions. Ces données servent au suivi d&apos;usage ; elles n&apos;adaptent pas encore
                automatiquement vos suggestions.
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
              faits et états établis concernant les personnages connus — faits objectifs,
              connaissances, croyances et relations — et les tient à jour au fil de l&apos;écriture.
            </p>
            <p>
              Ces faits sont injectés dans le contexte des suggestions pour éviter les incohérences
              : un personnage aux yeux verts ne les retrouvera pas bleus au chapitre 12, un lieu
              décrit au nord ne migrera pas au sud.
            </p>
            <p>
              Dans cette section du Cockpit, vous pouvez consulter les faits détectés, en ajouter,
              les modifier ou les supprimer. Une modification manuelle devient une information
              d&apos;auteur et est préservée lors des régénérations.
            </p>
            <div className="rounded-lg border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
              L&apos;extraction est une proposition d&apos;IA à partir de votre manuscrit. Relisez les faits
              générés avant de vous y fier et corrigez-les si votre intention narrative diffère.
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
