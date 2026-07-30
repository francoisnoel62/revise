# Tests manuels — efficacité de l'IA contextuelle (Actes 1 → 3)

But : vérifier, de façon **facile à suivre**, que tout ce qui a été construit fonctionne :
le contexte intentionnel (research docs), le respect des éditions de l'auteur, la fraîcheur des analyses, et la non-régression des features IA.

> Chaque workflow A–D a aussi un pendant **automatisé** : `workflow-A-plan-vers-prose.test.ts`,
> `workflow-B-auteur-corrige-ia-suit.test.ts`, `workflow-C-non-regression-providers.test.ts`,
> `workflow-D-boucle-research-fraicheur.test.ts` (Vitest, mocks sur `AIContextBuilder`/
> `ResearchDocument`). Ce README ne documente que le protocole **manuel** ci-dessous — les tests
> automatisés tournent avec `npm test` comme le reste de la suite et ne nécessitent pas de provider
> IA réel ni de suivre ce guide pas-à-pas.

## Comment ça marche
Chaque dossier `workflow-*` contient :
- un ou plusieurs **extraits de roman** (`.md`) à **copier-coller** dans l'éditeur ou dans un document de recherche ;
- un **`guide.md`** pas-à-pas, avec cases à cocher, résultat attendu, et **verdict**.

### La méthode des « sentinelles »
Les suggestions IA sont **probabilistes** : on ne peut pas prouver l'injection d'un contexte par une égalité stricte. On place donc dans les textes des **faits sentinelles très distinctifs** (noms inventés, couleurs improbables, lieux uniques) qui n'ont aucune raison d'apparaître *sauf* si l'IA a bien lu le contexte. Si la sentinelle ressort → le contexte est pris en compte. Relancer 2-3 fois si besoin.

## Prérequis (à faire une fois)
1. `npm run build` puis `npm run dev` (le build complet n'a pas pu être lancé en sandbox).
2. Être connecté, **un provider IA configuré et assigné au projet** (cockpit → providers).
3. Savoir déclencher les features :
   - **Complétion** : dans l'éditeur, placer le curseur en fin de texte, appuyer sur **Tab** (texte fantôme), 2ᵉ **Tab** pour insérer, **Échap** pour annuler.
   - **Reformulation** : sélectionner du texte → action *Reformuler*.
   - **Génération de chapitre** : bouton de génération (début / complet / plan).
   - **Métadonnées** : page cockpit → *Métadonnées* (générer / régénérer).
   - **Recherche** : page cockpit → *Recherches* (créer une note avec un **Corps**).

## ⚠️ Limite connue à garder en tête
L'UI de recherche **ne permet pas encore de lier un document à un chapitre** (`linkedChapterIds`).
La logique de **localité par chapitre** (Acte 2) est branchée de bout en bout dans le code, mais via l'UI seuls les **documents globaux** (sans lien) sont testables. Le test de localité par chapitre (Workflow A bis) nécessite une insertion en base, ou un futur écran de liaison (backlog n°1).

## Quels workflows couvrent quoi
| Workflow | Couvre | Durée |
|---|---|---|
| **A — Du plan à la prose** | Corps des notes, Acte 2 (intention globale), complétion, génération | ~10 min |
| **B — L'auteur corrige, l'IA suit** | Acte 1 (édition fait foi) + Acte 3 (péremption / régénération) | ~10 min |
| **C — Non-régression multi-providers** | Reformulation, complétion, génération sur Claude/OpenAI/Gemini | ~10 min |
| **D — Boucle research → écriture → fraîcheur** | Acte 2 (global) + Acte 3 (boucle dérivé ↔ intentionnel) | ~15 min |

## Ordre conseillé
**A** (voir l'intention nourrir l'IA) → **B** (le cœur : auteur prioritaire + péremption) → **D** (la boucle) → **C** (non-régression).

> Les tests marqués **(cœur)** dans chaque guide sont ceux qui prouvent la valeur. Commence par eux si tu es pressé.
