---
date: 2026-06-14T21:29:56+0000
researcher: Claude (claude-opus-4-8)
git_commit: 2f5d713f355260509a3a908e3be324bf44353fdf
branch: claude/confident-babbage-6kyh1z
repository: revise
topic: "IA trop dispersée vs. autocomplétion littéraire manuscrit-premier — validation du diagnostic"
tags: [research, codebase, autocompletion, ai-context, metadata, observability, chapter-generation]
status: complete
last_updated: 2026-06-14
last_updated_by: Claude (claude-opus-4-8)
total_pages: 1
page: 1
---

# Research : IA trop dispersée vs. autocomplétion littéraire manuscrit-premier

**Date** : 2026-06-14T21:29:56+0000
**Researcher** : Claude (claude-opus-4-8)
**Git Commit** : 2f5d713f355260509a3a908e3be324bf44353fdf
**Branch** : claude/confident-babbage-6kyh1z
**Repository** : revise

## Research Question

L'IA de Revise est-elle, dans le code, trop dispersée vers des fonctionnalités « spectaculaires »
(génération de chapitre, métadonnées injectées partout) qui produisent du texte plausible mais
peu utile et interrompent le geste d'écriture ? Le manuscrit est-il aujourd'hui réellement
concurrencé par ses métadonnées dérivées dans le chemin d'écriture ? L'autocomplétion
manuscrit-premier est-elle sous-développée et sous-mesurée ? Documents cadres :
`docs/strategie-autocompletion.md`, `docs/roadmap-autocompletion.md`, `docs/strategie-ia-contexte.md`.

## Summary

Le diagnostic est **confirmé par le code**, avec trois constats vérifiables :

1. **Les métadonnées dérivées sont dans le chemin chaud de l'écriture.** L'autocomplétion injecte
   par défaut 5 types de métadonnées générées (style, narration, personnages, intrigue, univers)
   plus les research docs, dans le même bloc de contexte que le manuscrit
   (`AIContextBuilder.buildCompletionContext`, `completion/stream/route.ts`). Le manuscrit réel
   n'est représenté que par une fenêtre locale étroite (**500 caractères avant / 100 après** le
   curseur), tandis que les métadonnées (interprétations compressées, plafonnées à 400 car./champ)
   occupent une place structurellement centrale. C'est exactement la « surcharge contextuelle » et
   la « fausse autorité des métadonnées » décrites dans la stratégie.

2. **La surface de génération longue est proéminente et autonome.** `GenerateChapterUseCase` charge
   tout le projet, concatène **le manuscrit entier**, ajoute le contexte enrichi le plus lourd
   (6 métadonnées, caps 800/1500) et produit un bloc autonome (jusqu'à ~1000 mots). Ces fonctions
   sont mises en avant dans 3 surfaces UI (carte flottante, menu IA, palette de commandes), alors
   que l'autocomplétion y est réduite à un simple toggle.

3. **L'autocomplétion est sous-développée et quasi non mesurée.** Acceptation tout-ou-rien (un seul
   `insertContent`), aucune acceptation partielle, prompt généraliste citant encore `[MÉTADONNÉES]`.
   Côté mesure : on suit tokens / coût / durée totale, mais **aucun** signal de latence au premier
   token, ni d'acceptation, rejet, ou suppression-après-insertion. Les métriques actuelles mesurent
   le *volume*, pas la *valeur* — ce qui justifie l'instrumentation comme Phase 1.

Conséquence : la conviction « le manuscrit est la source de vérité, la meilleure interaction est une
autocomplétion fine manuscrit-premier » est cohérente avec ce que révèle le code. La codebase est
techniquement riche (Clean Architecture, 1700+ tests) mais investit son contexte IA d'écriture dans
le contexte *dérivé* plutôt que dans le *texte vivant* et la qualité de l'interaction quotidienne.

## Detailed Findings

### 1. Métadonnées dans le chemin chaud de l'écriture (autocomplétion)

Le constructeur de contexte de complétion injecte cinq familles de métadonnées générées, chacune
tronquée, puis les research docs :

- `src/application/services/AIContextBuilder.ts:59` — `buildCompletionContext(ownerId, projectId, chapterId?)`
- `src/application/services/AIContextBuilder.ts:60-62` — résout 5 types : `stylistic-dna, narrative-analysis, characters, plot, worldbuilding`
- `src/application/services/AIContextBuilder.ts:66-95` — blocs `[MÉTADONNÉES - STYLE / NARRATION / PERSONNAGES / INTRIGUE / UNIVERS]` (personnages plafonnés aux 3 premiers, `:77`)
- `src/application/services/AIContextBuilder.ts:21` — `COMPLETION_RAWTEXT_CAP = 400` (cap par champ)
- `src/application/services/AIContextBuilder.ts:28` — `COMPLETION_RESEARCH_CAP = 600` (research docs, contexte intentionnel)
- `src/application/services/AIContextBuilder.ts:97` + `:240-292` — `projectResearch(...)` ajoute le contexte intentionnel de l'auteur (mieux aligné philosophiquement, mais mêlé au même bloc)
- `src/application/services/AIContextBuilder.ts:313-345` — règle « l'édition de l'auteur l'emporte » : `structuredData` n'est utilisé que si `!wasEditedSinceGeneration()` (`:328`), sinon repli sur le texte édité (`:337-338`)

La route streaming consomme ce bloc et le passe au provider comme contexte :

- `src/app/api/completion/stream/route.ts:17-22` — body `{ projectId, textBeforeCursor, textAfterCursor?, chapterId? }`
- `src/app/api/completion/stream/route.ts:78-86` — lecture `MetadataCache` puis `buildCompletionContext(...)` en cas de miss (cache par `chapterId`)
- `src/app/api/completion/stream/route.ts:95-99` — `generateCompletionStream(textBeforeCursor, textAfterCursor, projectContext)` — le bloc métadonnées est le 3ᵉ argument

Le manuscrit réel, lui, n'entre que par une fenêtre locale très étroite :

- `src/components/editor/extensions/Autocomplete.ts:77` — **500 caractères avant** le curseur (`doc.textBetween(pos-500, pos, ...)`)
- `src/components/editor/extensions/Autocomplete.ts:80-85` — **100 caractères après** le curseur

**Lecture du constat :** dans le chemin chaud, le texte vivant = 500/100 caractères ; le contexte
dérivé = 5 métadonnées interprétées + research docs. Le déséquilibre est structurel et confirme la
« surcharge contextuelle » (le manuscrit envoyé deux fois : vivant et compressé) de
`docs/strategie-autocompletion.md` §2.

### 2. Surface de génération longue : proéminente et autonome

`GenerateChapterUseCase` est structurellement orienté production autonome :

- `src/application/use-cases/GenerateChapterUseCase.ts:46-54` — charge **tout le projet**
- `src/application/use-cases/GenerateChapterUseCase.ts:56-62`, `:89-103` — concatène **le manuscrit entier** (`# titre` + `\n\n---\n\n`)
- `src/application/use-cases/GenerateChapterUseCase.ts:64-68` — `buildChapterContext(...)` (contexte le plus lourd)
- `src/application/services/AIContextBuilder.ts:102-145` — 6 métadonnées (dont `chapter-summaries`), caps `CHAPTER_RAWTEXT_CAP = 800` (`:22`) et `CHAPTER_RESEARCH_CAP = 1500` (`:29`)
- `src/application/use-cases/GenerateChapterUseCase.ts:70-75` — `generateChapter(fullText, generationType, projectContext)`

Trois types, jusqu'à ~1000 mots :

- `src/domain/value-objects/ChapterGenerationType.ts:16-33` — `chapter-beginning` (200), `chapter-full` (1000), `chapter-outline` (500)
- `docs/prompt/chapter-generation/chapter-beginning.md:17,23` — « GÉNÉRER LE DÉBUT… EXACTEMENT 8 À 12 PHRASES »
- `docs/prompt/chapter-generation/chapter-full.md:17,19` — « GÉNÉRER LE CHAPITRE COMPLET (maximum 1000 mots) »
- `docs/prompt/chapter-generation/chapter-outline.md:17,19` — « GÉNÉRER LE PLAN DU PROCHAIN CHAPITRE »

Mise en avant dans l'UI (3 surfaces) vs. autocomplétion réduite à un toggle :

- `src/components/editor/FloatingGenerationMenu.tsx:63-95` — carte proéminente « Génération IA » avec les 3 boutons (`:65-81`)
- `src/components/editor/AIMenuDropdown.tsx:89-105`, `:171-195` — les 3 générations ; `:267-279` — autocomplétion = simple **Switch**
- `src/components/editor/CommandPalette.tsx:135-164` — `generate-beginning/chapter/outline` ; `:186-196` — toggle autocomplétion
- Note d'inventaire : le composant est en `src/components/editor/AIMenuDropdown.tsx` (et non `src/components/ai/`)

Action serveur (rate-limit et usage **partagés avec les métadonnées**) :

- `src/app/actions/chapter-generation-actions.ts:40-44` — `generateChapterAction(projectId, generationType, providerId?)`
- `src/app/actions/chapter-generation-actions.ts:57-64,67-68` — `canGenerateMetadata` / `recordMetadataGeneration` clé `chapter-${type}`

### 3. Autocomplétion sous-développée + observabilité orientée volume

Interaction pauvre (tout-ou-rien, prompt généraliste) :

- `src/components/editor/extensions/Autocomplete.ts:262,270-278` — `Tab` ; acceptation = un seul `editor.commands.insertContent(suggestion)` (aucune acceptation partielle mot/fragment)
- `src/components/editor/extensions/Autocomplete.ts:290-306` — `Escape` annule/efface (sans télémétrie)
- `src/components/editor/extensions/Autocomplete.ts:162-199` — boucle SSE (aucun horodatage du premier chunk, rien renvoyé au serveur)
- `docs/prompt/autocompletion.md:16` — le prompt cite encore `[MÉTADONNÉES]` (incohérent avec la décision manuscrit-premier)

Ce qui est mesuré aujourd'hui = volume/coût/durée totale uniquement :

- `src/infrastructure/ai/TrackedLLMProvider.ts:322-349` — wrapper `generateCompletionStream`
- `src/infrastructure/ai/TrackedLLMProvider.ts:327` — un seul `startTime` ; `:336-338` re-yield des chunks **sans** timestamp du premier ; `:340/345` `durationMs` = durée totale de fin de flux
- `src/infrastructure/ai/TrackedLLMProvider.ts:341-343` — capture tokens + exchange, puis `recordUsage('completion', durationMs)`
- `src/domain/entities/AIUsageRecord.ts:6-19` — champs : id, userId, projectId, operation, provider, model, inputTokens, outputTokens, cachedInputTokens?, costEur?, durationMs, createdAt
- `src/domain/value-objects/AIOperationType.ts:14,36` — `'completion'` / label « Autocomplétion »
- `src/infrastructure/persistence/MongoDBUsageRepository.ts:16-24,112-122,229-239` — agrégations strictement count/tokens/coût/durée

Absences confirmées (rien de tout cela n'existe en code) :

- **Latence premier token** : inexistante ; seul `durationMs` total existe.
- **Acceptation** (Tab) : pure mutation d'état UI (`Autocomplete.ts:270-278`), rien n'est persisté.
- **Rejet / annulation** (Escape) : UI seulement (`Autocomplete.ts:290-306`), rien persisté.
- **Suppression-après-insertion / qualité** : aucun champ, aucune agrégation.
- Les seules occurrences de `firstTokenMs` dans le dépôt sont **les docs de roadmap**
  (`docs/roadmap-autocompletion.md:89,113`), pas le code.

C'est la base factuelle de la Phase 1 (instrumentation) : sans ces signaux, impossible de prouver
qu'une nouvelle autocomplétion est meilleure.

## Code References

- `src/application/services/AIContextBuilder.ts:59-97` — `buildCompletionContext` : injection des 5 métadonnées + research dans le chemin chaud
- `src/application/services/AIContextBuilder.ts:21,28` — caps complétion (400 / 600)
- `src/application/services/AIContextBuilder.ts:313-345` — « l'édition de l'auteur l'emporte » (déjà implémenté, Phase 8.0)
- `src/app/api/completion/stream/route.ts:78-99` — cache + build context + appel provider
- `src/components/editor/extensions/Autocomplete.ts:77,80-85` — fenêtre locale 500/100 caractères
- `src/components/editor/extensions/Autocomplete.ts:270-278,290-306` — acceptation tout-ou-rien, Escape
- `src/application/use-cases/GenerateChapterUseCase.ts:46-103` — manuscrit entier + contexte enrichi
- `src/domain/value-objects/ChapterGenerationType.ts:16-33` — types/longueurs de génération
- `src/components/editor/FloatingGenerationMenu.tsx:63-95` — proéminence UI de la génération
- `src/components/editor/AIMenuDropdown.tsx:171-195,267-279` — génération vs. toggle autocomplétion
- `src/components/editor/CommandPalette.tsx:135-196` — commandes génération + toggle
- `src/infrastructure/ai/TrackedLLMProvider.ts:322-349` — suivi complétion (durée totale uniquement)
- `src/domain/entities/AIUsageRecord.ts:6-19` — champs persistés (aucun signal de valeur)
- `src/infrastructure/persistence/MongoDBUsageRepository.ts:16-24,252-302` — agrégations volume/coût
- `docs/prompt/autocompletion.md:16` — `[MÉTADONNÉES]` encore mentionné

## Architecture Insights

- **Clean Architecture respectée** : Domain → Application → Infrastructure/Interface. La projection
  des métadonnées vit dans l'Application (`AIContextBuilder`, Phase 8.0), les providers ne décident
  plus *quoi* injecter — ce qui rend faisable un **builder dédié à l'autocomplétion** (roadmap
  chantier 5) sans toucher aux providers.
- **Multi-tenant par `ownerId`** systématique sur tous les repositories — la future entité
  `AutocompleteEvent` (instrumentation) devra suivre ce pattern (cf. `MongoDBUsageRepository`).
- **Le contexte intentionnel (research docs) est déjà branché et mieux aligné** que les métadonnées
  dérivées : la décision n'est pas de tout débrancher mais de **déclasser le dérivé** et de remettre
  le manuscrit au centre.
- **Cache de contexte par `chapterId`** (`MetadataCache`) : un effet de bord est que les changements
  de research docs liés au chapitre n'apparaissent qu'après invalidation/expiration — à garder en
  tête quand on retravaillera le contexte de complétion.
- **Couplage rate-limit/usage** entre génération de chapitre et métadonnées (`chapter-${type}`) :
  déclasser la génération sans casser la télémétrie demandera de découpler proprement.

## Historical Context (from docs/)

- `docs/strategie-ia-contexte.md` — stratégie **adoptée le 2026-06-02** ; son §2.4 positionnait la
  génération de chapitre comme cœur de productivité. **Amendée le 2026-06-14** (encart en tête du
  doc) : la génération est désormais déclassée. Ses acquis restent valables (contexte intentionnel,
  « l'édition de l'auteur l'emporte »).
- `docs/strategie-autocompletion.md` — décision (2026-06-14) : autocomplétion centrale,
  manuscrit-premier, métadonnées déclassées non supprimées, l'IA propose toujours (pas de silence).
- `docs/roadmap-autocompletion.md` — feuille de route en 8 chantiers + A/B, Phase 1 instrumentation
  détaillée (c'est là que `firstTokenMs` et les signaux d'acceptation sont *proposés*).
- `docs/architecture.md` — Clean Architecture, `AIContextBuilder` (Phase 8.0), `TrackedLLMProvider`,
  `AIUsageRecord` (Phase 9.0, coût €).
- `docs/transparency-ledger.md` — `AIExchange` (contenu d'échange opt-in, chiffré) : utile pour
  inspecter « ce que l'IA a vu », complémentaire de l'instrumentation d'acceptation.

## Open Questions

- **Découplage rate-limit/usage** génération↔métadonnées : à traiter avant le déclassement (chantier 8)
  pour ne pas casser la télémétrie partagée (`chapter-generation-actions.ts:57-68`).
- **Corrélation client↔serveur** : quel `suggestionId` relie un event client (acceptation) à un
  `AIUsageRecord` serveur ? (à définir en Phase 1).
- **`firstTokenMs` côté serveur** : faisable à faible coût dans `TrackedLLMProvider` en horodatant le
  premier chunk yieldé (`:336-338`), mais la latence *perçue* (client) reste la mesure de référence.
- **Invalidation du cache de contexte** lors d'un futur builder dédié manuscrit-premier (effet
  `MetadataCache` par `chapterId`).
- **Budget de contexte manuscrit** : quelle fenêtre remplace le 500/100 actuel (scène, paragraphe,
  chapitre) sans dégrader la latence ? — à trancher par la mesure (Phase 1 → A/B Phase 12).
