<!-- ABOUTME: Stratégie produit et technique de l'usage de l'IA contextuelle dans Revise — vision, diagnostic, feuille de route. -->
<!-- ABOUTME: Référence pour les chantiers métadonnées ↔ IA ; à lire avant de planifier un chantier de contexte IA. -->

# Stratégie — l'IA contextuelle dans Revise

> Statut : adoptée le 2026-06-02. Découle de [.claude/philosophie.md](../.claude/philosophie.md) (binding).
> Ce document fixe le cap ; les chantiers concrets se planifient en TDD au fil de l'eau.

## 1. Vision

**Principe directeur :** l'IA de Revise ne sert pas à *écrire le roman* ni seulement à *commenter le roman écrit* — elle sert à **tenir l'intention de l'auteur** entre ce qu'il a prévu et ce qu'il écrit, et à l'aider à franchir la distance entre les deux.

**Le déplacement clé — deux natures de contexte :**

| | **Contexte dérivé** | **Contexte intentionnel** |
|---|---|---|
| Source | Métadonnées : l'IA les **extrait du texte déjà écrit** | Research docs : l'auteur les **écrit pour dire son intention** (scénario, plan, fiches) |
| Nature | « Voici ce que tu *as* écrit » | « Voici ce que je *veux* écrire » |
| Risque philosophique | Moyen (peut être périmé, peut contredire l'auteur) | Quasi nul — c'est le matériau propre de l'auteur |

L'intention prime sur l'écho. Aujourd'hui l'IA ne connaît que le contexte dérivé ; la stratégie consiste d'abord à brancher le contexte intentionnel.

**Trois engagements (dérivés de la philosophie) :**
1. **L'IA part toujours du matériau de l'auteur** — son texte, ses notes, son plan — jamais d'un savoir générique.
2. **L'IA propose au bon endroit** — la pertinence est locale (scène, chapitre courant), pas un instantané global plaqué partout.
3. **L'IA reste réfutable** — toute production est offerte comme un choix qui doit provoquer adhésion, rejet *ou* réécriture. La voix gagne toujours.

**Ce que la vision exclut :** une IA qui écrit en autonomie sans intention de l'auteur en entrée ; une IA qui standardise (une seule « bonne » suite) ; une IA dont l'auteur ne peut pas inspecter ni corriger le contexte utilisé ; toute insertion de texte généré **sans action explicite** de l'auteur.

**Promesse mesurable :** réduire le temps entre « je sais ce que je veux dans cette scène » et « le brouillon de cette scène existe » — sans que ce brouillon cesse d'être *le sien*.

## 2. Diagnostic (état au 2026-06-02, vérifié dans le code)

- 🔴 **Divergence `content ↔ structuredData`.** `UpdateMetadataContentUseCase` n'appelle que `updateContent()`, jamais `structuredData`. Quand l'auteur corrige une fiche, ce qu'il voit (`content`) change mais ce que l'IA lit (`structuredData`) reste l'ancienne version générée. La correction de l'auteur est invisible à l'IA.
- 🟠 **Projection dupliquée.** `AnthropicProvider` et `OpenAIProvider` (et probablement `GoogleProvider`) ré-implémentent chacun `enhanceCompletionPrompt` / `enhanceChapterGeneration…` champ par champ. La sélection « quels champs comptent » — décision produit — est triplée dans l'infrastructure.
- 🟠 **Research docs débranchés.** L'entité `ResearchDocument` (note/link/quote/reference/image, avec `tags` et `linkedChapterIds`) a CRUD + UI complets, mais **aucune** fonctionnalité IA ne les lit.
- 🟡 **Régénération 100 % manuelle.** Déclenchée par action explicite, rate-limitée, cache par `contentHash`. Pas d'auto-régénération quand le manuscrit évolue → le contexte peut retarder.
- **Localité.** `linkedChapterIds` (sur research docs) est le **seul** primitif de localisation du système ; les métadonnées sont chargées globalement par projet.

## 3. Feuille de route — 3 actes

### Acte 1 — Assainir le contexte (prérequis)
Objectif : un contexte toujours fidèle à ce que l'auteur a décidé, et une sélection du contexte centralisée et inspectable.

- **1.1 — L'édition de l'auteur est la vérité.** Le `MetadataContextBuilder` ne fait confiance au `structuredData` que s'il n'a pas été édité depuis sa génération (comparer `lastEdited` / `generatedAt`, ou `contentHash`). Sinon, injecter le **texte du `content`** à la place. Pas d'appel LLM ; l'auteur a toujours raison.
- **1.2 — La projection vit dans l'application.** Extraire la sélection/troncature/ordre des champs vers la couche application (un `ContextProjection` ou extension du builder), qui produit un *bloc de contexte* prêt. Les providers ne décident plus *quoi* mettre, seulement *où* (system/user, échappement). Supprimer la duplication des 3 providers. Ouvre l'affichage « voici ce que l'IA sait » (engagement n°3).

### Acte 2 — Brancher l'intention (cœur de valeur)
Objectif : les research docs nourrissent complétion **et** génération, filtrés par pertinence locale.

- **2.1 — Modèle de localité.** Docs sans `linkedChapterIds` = intention globale → toujours injectés. Docs liés à un chapitre → injectés seulement quand l'auteur écrit dans ce chapitre. *À vérifier au démarrage : câbler le `chapterId` courant jusqu'à la complétion.*
- **2.2 — Projection des research docs.** Pas de résumé LLM dans le chemin chaud. Injecter les types porteurs de texte (`note`, `quote`, `reference`) ; pour `link`/`image`, titre seul. Troncature à un budget, ordre par priorité de type.
- **2.3 — Budgets de latence distincts.** **Lean** pour la complétion (256 tokens, sans thinking, latence critique : digest scénario global + docs du chapitre, plafond strict). **Généreux** pour la génération de chapitre. Décision pilotée par mesure p50/p95 avant/après.
- **2.4 — Positionnement de la génération (décision produit, tranchée).** Génération **fidèle au plan et insérable en un geste** — productivité maximale. **Invariant non négociable (philosophie) : l'insertion est toujours déclenchée par l'auteur, jamais automatique, et le texte reste pleinement éditable.** L'auto-insertion exigerait d'amender `philosophie.md` au préalable.

### Acte 3 — Fraîcheur & boucle (finition)
Objectif : limiter le retard des métadonnées sur le manuscrit, sans brûler de tokens ni voler le contrôle à l'auteur.

- **3.1 — Péremption visible, pas d'auto-régen.** Exploiter `needsRegeneration` / `contentHash` pour afficher un bandeau discret « analyse basée sur une version antérieure — régénérer » + régénération en un clic. L'auto-régen viendra plus tard derrière un réglage. L'Acte 1 désamorce déjà le danger (le `structuredData` périmé ne ment plus).

## 4. Ordre recommandé
**Acte 1 → Acte 2 → Acte 3.** Dans l'Acte 1, traiter **1.1 et 1.2 ensemble** (même frontière de construction du contexte). L'Acte 2 livre la valeur ; l'Acte 3 polit.

## 5. Fichiers clés
- `src/application/services/MetadataContextBuilder.ts` — chargement du contexte (Actes 1 & 2)
- `src/domain/entities/ProjectMetadata.ts` — `content` / `structuredData` / `needsRegeneration`
- `src/domain/entities/ResearchDocument.ts` — contexte intentionnel + `linkedChapterIds`
- `src/application/use-cases/UpdateMetadataContentUseCase.ts` — point de la divergence 🔴
- `src/infrastructure/ai/AnthropicProvider.ts` (méthodes `enhance*`, ~1360–1610) — projection à extraire
- `.claude/philosophie.md` — principes binding
