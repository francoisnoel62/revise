// ABOUTME: Guide « Analyser & vérifier » — les 7 analyses de manuscrit et la vérification de chapitre.
// ABOUTME: Décrit uniquement les capacités présentes dans le code (pas d'export Markdown du rapport, non implémenté).

import Link from 'next/link';

export const metadata = {
  title: 'Analyser et vérifier son texte avec Revise',
  description:
    "Sept analyses de manuscrit (narrative, personnages, intrigue, ADN stylistique, worldbuilding, résumés, synthèse) et la vérification de chapitre : orthographe, grammaire, ponctuation, style, répétitions.",
};

const analyses: [string, string][] = [
  ['Narrative', 'Point de vue, structure, temporalité, voix'],
  ['Personnages', 'Profils, relations, hiérarchie narrative'],
  ['Intrigue', 'Structure, conflits, progression, fils narratifs'],
  ['ADN stylistique', "Registre, syntaxe, figures de style, règles d'écriture"],
  ['Worldbuilding', 'Thèmes, symbolisme, décor, contexte social'],
  ['Résumés des chapitres', 'Résumé concis de chaque chapitre + arc narratif global'],
  ['Synthèse', 'Méta-analyse avec retour éditorial'],
];

const checks: [string, string][] = [
  ['Orthographe', 'Fautes d’orthographe, avec suggestions de correction'],
  ['Grammaire', 'Erreurs grammaticales et accords'],
  ['Ponctuation', 'Erreurs de ponctuation et typographie'],
  ['Style', "Suggestions d'amélioration stylistique"],
  ['Répétitions', 'Mots et phrases revenant trop souvent'],
];

export default function GuideAnalysesPage() {
  return (
    <main className="container mx-auto px-4 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-muted-foreground mb-3">Guide · Analyser &amp; vérifier</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Analyser &amp; vérifier son texte</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Deux familles d&apos;outils complémentaires : <strong>comprendre</strong> votre texte en
          profondeur, et <strong>corriger</strong> ses erreurs concrètes.
        </p>

        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Les 7 analyses de manuscrit</h2>
            <p>
              Revise lit votre manuscrit sous sept angles complémentaires pour vous renvoyer une
              image claire de ce que vous avez écrit :
            </p>
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Analyse</th>
                    <th className="px-4 py-3 text-left font-semibold">Ce qu&apos;elle révèle</th>
                  </tr>
                </thead>
                <tbody>
                  {analyses.map(([name, what]) => (
                    <tr key={name} className="border-t">
                      <td className="px-4 py-3 font-medium">{name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{what}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              <strong>Cache intelligent</strong> : une analyse n&apos;est régénérée que si votre
              contenu change réellement (empreinte SHA-256). Vous ne payez ni n&apos;attendez pour
              rien. Le menu contextuel (les trois points) permet de relancer une analyse à la
              demande, et un indicateur vous prévient quand une analyse n&apos;est plus à jour.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">La vérification de chapitre</h2>
            <p>Analysez un chapitre pour détecter et corriger ses erreurs, par catégorie :</p>
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Catégorie</th>
                    <th className="px-4 py-3 text-left font-semibold">Ce qu&apos;elle détecte</th>
                  </tr>
                </thead>
                <tbody>
                  {checks.map(([name, what]) => (
                    <tr key={name} className="border-t">
                      <td className="px-4 py-3 font-medium">{name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{what}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>3 niveaux de rigueur</strong> : strict, équilibré ou léger, selon que vous polissez ou dégrossissez.</li>
              <li><strong>Application en un clic</strong> : acceptez les corrections proposées sans réécrire à la main.</li>
              <li><strong>Exclusion de mots</strong> : retirez vos noms de personnages du repérage des répétitions.</li>
              <li><strong>Historique par chapitre</strong> : retrouvez vos analyses et corrections précédentes.</li>
            </ul>
            <p className="text-muted-foreground">
              Là encore, rien n&apos;est appliqué sans vous : chaque correction est une suggestion
              que vous validez.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Voir aussi :</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/guide/assistant-ia" className="text-sm text-primary hover:underline">Les outils d&apos;écriture IA</Link>
            <Link href="/guide/personnages" className="text-sm text-primary hover:underline">Vos personnages</Link>
            <Link href="/guide/cockpit" className="text-sm text-primary hover:underline">Le Project Cockpit</Link>
            <Link href="/guide" className="text-sm text-primary hover:underline">Retour au guide</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
