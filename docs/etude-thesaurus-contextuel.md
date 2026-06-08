<!-- ABOUTME: Étude stratégique pour la fonctionnalité « thésaurus contextuel conscient de la voix ». -->
<!-- ABOUTME: Concept, points d'entrée, valeur, faisabilité technique et alignement philosophique. -->

# Étude — Thésaurus contextuel conscient de la voix

> **Nature : étude stratégique.** Issue d'un brainstorming. Évalue la valeur, les
> options et la faisabilité d'un thésaurus qui **ne standardise pas la voix** mais
> l'enrichit, dans le cadre des principes de
> [.claude/philosophie.md](../.claude/philosophie.md). Pas une spec d'implémentation.

## Le concept en une phrase

> **Thésaurus contextuel de Revise** — conscient de la voix du projet (ancré sur
> l'**ADN Stylistique**), il propose des **nuances et non des équivalents**,
> structurées par intention (connotation, registre, champ sensoriel). Il sert deux
> gestes : **substituer** un mot qu'on a et **explorer** un champ lexical qu'on
> cherche. Il est aussi le geste qui **résout les répétitions** déjà détectées.
> Toujours N propositions, jamais une. L'auteur insère, adapte ou ignore.

## Le piège à éviter (cadrage philosophique)

Un thésaurus « bête » (clic droit → liste de synonymes → remplace) est exactement
ce que la philosophie de Revise combat : il **standardise la voix**. Le danger du
synonyme, c'est l'auteur qui remplace « marcher » par « déambuler » parce que ça
« fait plus riche » — et appauvrit son texte en croyant l'enrichir. Word et Antidote
font déjà cela. Si Revise propose la même chose, on ajoute une feature générique à un
scalpel.

La bonne question n'est donc pas *« fait-on un thésaurus »* mais *« qu'est-ce qu'un
thésaurus qui respecte la singularité de la voix »*. Réponse retenue : un thésaurus
**contextuel** (le mot **+ sa phrase + le registre du projet**), qui propose des
**nuances** (le sens que chaque mot colore) plutôt que des équivalents interchangeables.

## Décisions de cadrage (issues du brainstorming)

1. **Hybride lexical + IA** — retenu. Le lexical donne un retour *instantané* à
   0 token ; l'IA s'enclenche sur demande (« nuancer selon ma voix »).
2. **Exploration autant que substitution** — retenu. Le thésaurus ne sert pas qu'à
   remplacer un mot : il **ouvre un champ lexical** pour débloquer.
3. **Ancrage sur la voix du projet dès le départ** — retenu. C'est le vrai
   différenciateur : le thésaurus *connaît la voix* via l'**ADN Stylistique**.

## Ce qui rend CE thésaurus singulier

Au lieu d'une liste plate, les propositions sont structurées **par intention**,
pas par équivalence :

- **Par nuance / connotation** — « regarder » → *observer* (neutre), *scruter*
  (intensité), *épier* (menace), *contempler* (admiration). On donne **le sens que
  le mot colore**, pas juste le mot.
- **Par registre** — aligné sur l'**ADN Stylistique** déjà analysé
  ([`StylisticDNA`](../src/domain/value-objects/StylisticDNA.ts) :
  `registerAndLexicon`, `ticsAndSignatures`, `writingRules`). Si le projet est
  « épuré », on ne propose pas de mots ampoulés. Synergie majeure.
- **Sensoriel / champ lexical** — pour débloquer une description : « peur » →
  vocabulaire du corps, du froid, du souffle. On aide la créativité, pas seulement
  la substitution.

> **Le différenciateur tient dans le value-object** : une proposition n'est pas
> `mot`, c'est `mot + ce qu'il colore` (*épier → la menace*). Sans cette glose, on
> retombe sur un dictionnaire générique.

## Points d'entrée — deux gestes, deux moments

Les deux intentions n'arrivent pas au même instant de l'écriture ; elles ne
partagent donc pas la même UI.

### Geste 1 — Substituer (j'ai un mot, j'en veux un meilleur)
L'auteur a écrit le mot, il bute dessus. → **Double-clic / sélection du mot →
palette inline** ancrée au mot. C'est le flow réécriture, mais au niveau du mot.
Friction quasi nulle, on reste dans le flow. Geste **par défaut**, le plus fréquent.

### Geste 2 — Explorer (je n'ai pas encore le mot)
L'auteur est bloqué, le curseur clignote, rien à sélectionner. → **Command Palette**
([`CommandPalette`](../src/components/editor/CommandPalette.tsx), `Ctrl+Shift+I`) où
il tape une intention : un concept, une émotion, une sensation (« la peur qui
monte », « le froid »). Revise ouvre un **champ lexical** structuré dans un panneau
plus riche (proche de `ProposalsSheet`).

### Geste 3 (bonus à fort levier) — Résoudre une répétition
Revise détecte déjà les répétitions (Phase 7 :
[`RepetitionAnalysisStrategy`](../src/application/strategies/RepetitionAnalysisStrategy.ts),
[`RepetitionCluster`](../src/domain/value-objects/RepetitionCluster.ts)). Quand
l'auteur clique sur une répétition, **l'action de résolution _est_ le thésaurus
contextuel** : « ce mot revient 4×, voici 3 nuances qui tiennent ta voix ». Le
thésaurus n'est pas une feature à part : c'est **le geste qui répare** ce que Revise
signale déjà. Très peu de coût, forte cohérence produit.

> **Décision UX :** pas de menu clic-droit dédié (encombrerait). Primaires =
> double-clic (substituer) + Command Palette (explorer). Bonus = action sur
> répétition.

## Faisabilité technique (niveau étude)

L'ossature existe déjà ; le geste « substituer » est une **réécriture au niveau du
mot**.

- **Domain** — value-object `WordAlternative` (cousin de
  [`RewriteProposal`](../src/domain/value-objects/RewriteProposal.ts)) portant
  `word`, **`nuance`** (la glose : ce que le mot colore), `register`. Nouvelle
  méthode sur [`LLMProvider`](../src/domain/interfaces/LLMProvider.ts) :
  `suggestAlternatives(word, sentence, intent, authorProfile)` →
  `WordAlternative[]`. `intent` distingue *substituer* d'*explorer*.
- **Application** — `SuggestAlternativesUseCase`, qui passe par
  [`AIContextBuilder`](../src/application/services/AIContextBuilder.ts) pour injecter
  l'ADN stylistique (réutilise la projection « author profile » de la Phase 8.0) →
  cohérence de voix quasi gratuite. Le prompt impose : **nuancer, pas équivaloir**,
  rester dans le registre du projet, donner la glose de chaque proposition.
- **Infrastructure** — implémenter `suggestAlternatives` dans les 3 providers
  (mécanique, calqué sur les générations existantes) ; tracer via
  `TrackedLLMProvider`. **Couche lexicale** (volet hybride) : une base FR libre de
  droits derrière une interface `Thesaurus` swappable (parsers/exporters sont déjà
  swappables par principe). C'est le **seul vrai inconnu technique** — voir Risques.
- **Interface** — server action `thesaurus-actions` ; palette inline pour le geste 1 ;
  panneau type `ProposalsSheet` pour le geste 2 ; action contextuelle branchée sur
  l'UI des répétitions (Phase 7) pour le geste 3. Insertion en un clic ; l'auteur
  décide.

## Alignement philosophique

- **L'IA suggère, l'auteur décide** — N propositions, insertion/adaptation/refus
  libres. Respecté par construction.
- **Toujours offrir des choix** — jamais une réponse unique : par nuance, par
  registre, par champ.
- **Préserver la singularité** — l'ancrage ADN stylistique empêche l'uniformisation ;
  la glose de nuance pousse au *mot juste*, pas au *mot riche*.
- **Transparence** — l'auteur sait quand le lexical (instantané, 0 token) ou l'IA
  (nuancée selon sa voix) intervient.

## Risques & points de vigilance

- **Source lexicale FR libre de droits** — *seul inconnu majeur*. Pistes : WordNet
  FR (WOLF), Dicollecte/Grammalecte, ressources CNRTL. À sourcer et licencier
  proprement avant tout engagement sur le volet hybride. Repli possible : IA seule
  au MVP, lexical en phase 2.
- **Dérive vers le dictionnaire générique** — atténuée si et seulement si le
  value-object porte la **glose de nuance** ; à tester dès le MVP.
- **Coût / latence IA** — comparable aux réécritures (~1-3 s) ; le volet lexical
  instantané sert d'amortisseur. Traçage via `TrackedLLMProvider`.
- **Multi-tenant / contexte** — réutilise `AIContextBuilder` et les budgets de
  contexte existants ; pas de nouveau repository si les propositions ne sont pas
  persistées (à décider).

## Prochaines étapes suggérées

1. Trancher : **source lexicale FR libre** (sourcing + licence) vs **MVP IA seule**.
2. Figer le **format d'une proposition de nuance** (`WordAlternative` : champs,
   glose) — c'est le différenciateur, à prototyper en premier.
3. Rédiger une spec MVP courte (prompt « nuancer pas équivaloir », schéma palette
   inline + panneau exploration, branchement sur les répétitions).
4. Implémenter en TDD (skill `tdd-cycle`) : value-object → méthode `LLMProvider` →
   use-case → providers → actions → UI, dans cet ordre.
