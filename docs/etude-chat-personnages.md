<!-- ABOUTME: Étude stratégique pour la fonctionnalité « chatter avec les personnages du roman ». -->
<!-- ABOUTME: Propositions, valeur, faisabilité technique et évolution de la philosophie associée. -->

# Étude — Chatter avec les personnages du roman

> **Nature : étude stratégique.** Évalue la valeur, les options et la faisabilité
> d'une fonctionnalité « discuter avec un personnage », dans un cadre qui **fait
> confiance à l'auteur**. Inclut une **proposition d'évolution de
> [.claude/philosophie.md](../.claude/philosophie.md)**, à valider séparément.

## Contexte

La récente stratégie de contexte IA (« Actes 1 à 3 », #87) a doté Revise d'un socle
décisif : [`AIContextBuilder`](../src/application/services/AIContextBuilder.ts) sait
projeter les métadonnées du projet (personnages, intrigue, univers, style…) en
**blocs de contexte IA optimisés et budgétés**, avec la règle « l'édition de
l'auteur l'emporte » (`wasEditedSinceGeneration()`).

Ce socle rend réaliste une idée à forte valeur : permettre à l'auteur de
**dialoguer avec ses personnages**. Tous les ingrédients existent déjà séparément ;
il manque la brique conversationnelle.

**Atouts déjà présents (réutilisables) :**
- Entité [`Character`](../src/domain/entities/Character.ts) riche : `identity`,
  `appearance`, **`voiceAndLanguage`**, `psychology`, `backstory`,
  `relationships`, `narrativeFunction`, **`openQuestions`** → matière première
  pour incarner un personnage *et* orienter l'entretien.
- Métadonnée `characters` (`Characters` value object) avec `relationalMap`,
  `narrativeHierarchy`, déjà projetée par `AIContextBuilder`.
- Streaming SSE éprouvé : [`src/app/api/completion/stream/route.ts`](../src/app/api/completion/stream/route.ts).
- Cache de contexte (`MetadataCache`, TTL 5 min) + isolation multi-tenant `ownerId`
  sur tous les repositories.
- **Insertion de contenu généré dans le manuscrit déjà pratiquée** : la génération
  de chapitre produit du TipTap JSON inséré dans l'éditeur, et les réécritures
  remplacent la sélection. Insérer une réplique de personnage suit le même pattern.

**Le seul vrai manque technique :** le
[`LLMProvider`](../src/domain/interfaces/LLMProvider.ts) n'a **aucune méthode
conversationnelle multi-tour** — uniquement des générations « one-shot ». C'est
l'ajout structurant.

## Principe directeur — confiance en l'auteur

La philosophie tient en *« l'IA suggère, l'auteur décide »*. Ce principe **inclut
le droit de l'auteur d'utiliser une suggestion comme il l'entend** — la lire, s'en
inspirer, la réécrire, ou l'insérer telle quelle. Bloquer l'insertion reviendrait
paradoxalement à *retirer* à l'auteur une décision : ce n'est pas le rôle de Revise.

**Posture retenue :** l'auteur est un professionnel responsable, seul juge de
l'usage des suggestions. Un auteur retravaille de toute façon ce qu'il intègre ;
sa voix reste la sienne par l'acte de sélection, d'édition et d'assemblage. Revise
maximise donc l'utilité et la fluidité (y compris l'insertion directe), et mise sur
**la transparence et le contrôle** plutôt que sur le blocage.

Le chat personnage offre ainsi **deux usages également légitimes**, au choix de
l'auteur :
1. **Découverte** — interroger le personnage pour mieux le connaître (cohérence,
   passé, mobiles, réactions hypothétiques).
2. **Matière d'écriture** — récupérer une réplique/un passage et l'insérer ou
   l'adapter dans le manuscrit.

## Les propositions (valeur croissante)

### A — « L'Interview du personnage » (socle)
Chat 1-à-1 ; le personnage répond *dans sa voix* à partir de sa fiche
(`voiceAndLanguage`, `psychology`, `backstory`).
- **Valeur** : déblocage créatif, test de cohérence interne, exploration du for
  intérieur. Les `openQuestions` de la fiche deviennent des amorces suggérées.
- **Coût** : faible — fiche seule en contexte.

### B — « Table ronde » (multi-personnages)
Faire dialoguer/réagir plusieurs personnages (via `relationships` /
`relationalMap`) ; tester un conflit ou écrire l'ébauche d'une scène à plusieurs
voix.
- **Valeur** : très élevée pour les dynamiques relationnelles et pour générer du
  dialogue brut que l'auteur retravaille.
- **Coût** : élevé (plusieurs personas + contexte relationnel).

### C — « Personnage ancré au manuscrit » ✅ MVP retenu
Le personnage est nourri du **texte réel** via la stratégie de contexte : l'auteur
peut l'interroger sur ses actes (« pourquoi as-tu fait X au ch. 3 ? ») et le
personnage répond *en cohérence avec ce qui est écrit*. S'il ne « sait » pas, il le
dit → cela fait remonter une `openQuestion` ou une **incohérence**.
- **Valeur** : double — outil de **cohérence narrative** *et* source de répliques
  fidèles au canon, directement réutilisables. C'est ce qui distingue Revise d'un
  simple « character.ai » : l'ancrage au manuscrit réel.
- **Coût** : moyen — réutilise exactement `AIContextBuilder`.

### D — « De la conversation à l'œuvre » (boucle de valeur, extension)
À tout moment, l'auteur peut **agir sur une réponse** du personnage :
- **Insérer / copier vers le manuscrit** (réplique, paragraphe) — insertion directe
  assumée.
- **Enrichir la fiche** : l'IA *propose* de résoudre une `openQuestion` ou de
  compléter `backstory` ; l'auteur valide/édite/refuse (pattern existant
  `SyncCharactersFromAnalysisUseCase`).
- **Capturer une incohérence** en note d'analyse.
- **Phase 2** recommandée pour les actions de fiche/incohérence.

## Recommandation

**MVP = Proposition C** (1-à-1, ancré au manuscrit), **conversations persistées**,
avec **insertion vers le manuscrit dès le MVP** (peu coûteux, réutilise le pattern
d'insertion existant, et c'est le cœur de la valeur côté écriture). Les autres
actions de D (enrichissement de fiche, capture d'incohérence) en phase 2.

Concrètement : depuis la fiche d'un personnage (cockpit), un bouton « Discuter avec
ce personnage » ouvre un panneau de chat en streaming ; le personnage répond dans
sa voix, ancré sur sa fiche **et** le manuscrit ; chaque réponse propose une action
« Insérer dans le manuscrit / Copier » ; l'historique est sauvegardé par personnage.

## Proposition d'évolution de la philosophie

Pour aligner explicitement le principe « l'auteur décide » avec la liberté
d'insertion (et lever toute ambiguïté pour les fonctionnalités futures), proposer
d'ajuster `.claude/philosophie.md` — **à valider séparément** :

- Préciser sous « L'IA suggère, l'auteur décide » : *« Décider, c'est aussi choisir
  librement d'insérer, d'adapter ou d'ignorer une suggestion. Revise facilite
  l'usage des suggestions (y compris l'insertion directe) et fait confiance à
  l'auteur, seul responsable de son œuvre. »*
- Reformuler « Ce qui n'a PAS sa place » : viser ce qui agit **sans décision de
  l'auteur** (automatisations silencieuses, opacité), plutôt que l'insertion
  elle-même. La singularité de la voix est préservée par **le contrôle et la
  transparence**, non par la restriction.

> Note : `CLAUDE.md` rend la philosophie contraignante ; cet ajustement doit donc
> être validé explicitement avant d'être appliqué, et idéalement commité à part.

## Idées complémentaires dans le même esprit

- **Entretiens guidés (modes d'interview)** : préréglages d'amorces — le
  psychologue (mobiles profonds), le journaliste (faits/chronologie), le
  contradicteur (confronte le personnage à ses incohérences). Offre des *choix*.
- **Insertion directe assumée** : action « Insérer dans le manuscrit » sur toute
  réponse (au curseur dans l'éditeur), en complément du copier-coller — fluidité
  maximale, l'auteur retravaille à sa guise.
- **Calibration de voix** : option « confronter cette réponse aux vrais dialogues du
  personnage dans le manuscrit » → mesure l'écart de voix, aide à fiabiliser
  l'incarnation et à éviter une voix générique.
- **Détecteur d'incohérences** : quand le personnage contredit le texte, proposer
  d'en faire une `openQuestion` ou une note d'analyse — pont vers les features
  d'analyse existantes.
- **Mode « Et si ? »** : explorer une réaction hypothétique (« et si elle
  refusait ? »), étiqueté *exploratoire*, comme terrain d'essai de scènes.

## Faisabilité technique (niveau étude)

Architecture cible, respectant la Clean Architecture et réutilisant l'existant :

- **Domain** — nouveau primitif conversationnel sur `LLMProvider` :
  `chatStream(messages: ChatMessage[], systemPrompt: string): AsyncIterableIterator<string>`
  (multi-tour générique, streaming). Nouvelle entité `CharacterConversation`
  (`id`, `ownerId`, `projectId`, `characterId`, `messages[]`, timestamps) +
  interface `CharacterConversationRepository` (toutes méthodes filtrées `ownerId`).
  Type `ChatMessage { role: 'author' | 'character'; content; createdAt }`.
- **Infrastructure** — implémenter `chatStream` dans les **3** providers
  (`Anthropic`/`OpenAI`/`Google` ; tous supportent déjà le streaming de complétion,
  l'ajout est mécanique). `MongoDBCharacterConversationRepository` + serializer
  (collection `character_conversations`, index `{ownerId, characterId}`), sur le
  modèle de `MongoDBCharacterRepository`. Le décorateur `TrackedLLMProvider` doit
  aussi tracer `chatStream` (coût/tokens).
- **Application** — `AIContextBuilder.buildCharacterPersona(ownerId, projectId,
  characterId)` : assemble le **system prompt** depuis la fiche `Character` +
  l'ancrage manuscrit/métadonnées (réutilise `resolve()` et les budgets existants).
  Le prompt impose : rester dans la voix, **s'ancrer sur la fiche et le manuscrit,
  admettre l'incertitude plutôt qu'inventer du canon**. Use-case
  `ChatWithCharacterUseCase` (orchestration persona → `chatStream` → persistance).
- **Interface** — route SSE `src/app/api/character-chat/stream/route.ts` calquée sur
  `completion/stream` ; server actions pour charger/lister/supprimer les
  conversations. UI : panneau de chat dans
  `src/app/project/[projectId]/cockpit/characters/`, ouvert depuis `CharacterCard`,
  avec action « Insérer dans le manuscrit » sur chaque réponse.

**Point de vigilance technique principal** : le passage mono-tour → multi-tour.
Décider du budget de contexte par message (en-tête de persona stable + historique
tronqué, plutôt que renvoyer fiche + ancrage en entier à chaque tour), sur le modèle
des budgets déjà définis dans `AIContextBuilder`.

## Risques & points de vigilance

- **Hallucination hors-canon** : atténuée par l'ancrage manuscrit (C) et un system
  prompt strict (« si ce n'est pas dans le texte, dis-le »).
- **Coût / latence** : conversations longues = tokens cumulés → troncature
  d'historique + traçage via `TrackedLLMProvider` + réutilisation du cache.
- **Dérive de voix** : le personnage peut s'éloigner de ses dialogues réels →
  l'auteur reste juge ; l'idée « calibration de voix » aide à la maîtriser.
- **Multi-tenant** : nouveau repository → filtrage `ownerId` obligatoire +
  suppression en cascade (RGPD) cohérente avec `deleteByProjectId` /
  `deleteAllByOwner`.

## Principes retenus (récapitulatif actionnable)

1. **Confiance à l'auteur** : l'insertion directe dans le manuscrit est offerte et
   assumée ; aucun blocage.
2. **Transparence et contrôle** : l'auteur sait quand il parle à l'IA et garde la
   main sur ce qu'il intègre.
3. **Ancrage** : le personnage s'appuie sur la fiche et le manuscrit, et **admet son
   incertitude** plutôt que d'inventer du canon.
4. **Choix** : modes d'entretien multiples plutôt qu'une voix unique.
5. Toute écriture **vers la fiche** reste suggérée puis validée par l'auteur.

## Prochaines étapes suggérées

1. Décider de l'évolution de `.claude/philosophie.md` (commit séparé).
2. Rédiger une spec MVP courte (persona prompt, format des messages, budgets de
   contexte, schéma du panneau UI + action d'insertion).
3. Implémenter en TDD (skill `tdd-cycle`) : `chatStream` → persona builder →
   repository → use-case → route SSE → UI, dans cet ordre.
