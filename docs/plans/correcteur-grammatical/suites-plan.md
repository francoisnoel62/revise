# Plan d'exécution — suites du correcteur grammatical

Ce document rend exécutable le constat posé dans [suites.md](suites.md). La conception initiale
est dans [plan.md](plan.md) ; le récit du merge dans [atterrissage.md](atterrissage.md).

## État d'exécution au 13 août 2026

Les sept lots sont exécutés sur la branche `docs/suites-correcteur`.

| Lot | État | Ce qui en est sorti |
|---|---|---|
| 0 — décision + triage | ✅ | #185 close (`wontfix`), #186 `ready-for-human`, #187 `ready-for-agent` |
| 1 — `.gitattributes` | ✅ | `eol=lf`, plus un test qui asserte le découpage des corpus |
| 2 — autocomplétion | ✅ | 7 quarantaines levées, cause réelle trouvée ailleurs, 201 passages verts |
| 3 — `c'est`/`s'est` | ✅ | Cause établie et caractérisée → **#199**. Planchers inchangés : rien n'a été gagné |
| 4 — démarrage à froid | ✅ | ~390 ms, surcoût dictionnaire ~1 ms → ne rien optimiser. Trouvaille annexe → **#200** |
| 5 — dette #187 | ✅ | Filet d'intégration puis refactor complet ; un défaut sorti explicitement |
| 6 — spec #186 | ✅ | `docs/plans/typographie-export/spec.md` |

Deux découvertes ont modifié le plan en cours de route, et les deux sont écrites dans le
document plutôt que dans les seuls commits : le vrai aléa de l'autocomplétion n'était pas
celui que les `test.fixme` déclaraient (lot 2), et le cluster `c'est`/`s'est` n'est ni une
règle absente ni un problème de profil (lot 3).

## Contexte

`suites.md` liste 8 chantiers restants après le merge de `codex/grammalecte` dans `main`. C'est
un constat, pas un plan : il décrit *quoi* et *pourquoi*, jamais dans quel ordre commiter ni
comment vérifier.

**Une décision d'entrée change la donne** : nous ne changeons pas de correcteur orthographique
pour l'instant. nspell reste. Conséquences directes :

- **§2 / #185 est tranché par la négative** — il n'y a plus de campagne de mesure à mener.
- **§4 / #187 est débloqué** : `suites.md` disait « à ne pas lancer avant §2, si nspell disparaît
  la dette part avec lui ». nspell ne disparaît pas ; la dette est donc à payer, pas à attendre.
- **§3, cluster « orthographe »** reste chez nspell : ces fautes ne seront pas rattrapées par
  Grammalecte. Le plancher de rappel du test en tient compte.
- L'ordre recommandé en fin de `suites.md` est caduc et est réécrit ci-dessous.

Les §7 et §8 sont **mesure + décision écrite uniquement** — aucune optimisation dans ce plan,
conformément au « à ne pas optimiser avant d'avoir mesuré » du document.

### Trois faits établis, à ne pas re-supposer

1. **§3 — la piste « règle absente ou profil » est morte.** Les règles existent
   (`conf_ce_se_verbe`, `conf_ce_se_nom`, `__conf_ces_ses_c_est__b` dans
   `node_modules/@francoisnoel62/grammalecte/_build/nodejs/fr/core/grammalecte/fr/gc_rules_graph.js`),
   la famille `conf` est bien à `true` (`GrammarRuleProfile.ts:29`), et l'apostrophe droite
   n'est pas en cause : le moteur normalise `'` → `’` dans `_getCleanText`
   (`gc_engine.js:461-483`). Le diagnostic reste entier et devient purement empirique.
2. **§6 — il y a un candidat sérieux de cause racine.** `Autocomplete.ts` déclenche un
   **prefetch sur inactivité** (`idleTimerHandle`, `Autocomplete.ts:442`) qui émet sa propre
   télémétrie `prefetch_discarded` (`autocompleteTelemetry.ts:62-84`). Les tests tapent un
   chapitre entier au clavier dans `resetEditorText` avant de presser Tab : le timer d'inactivité
   peut s'armer pendant la frappe. Cela explique d'un coup l'« événement parasite » du premier
   test (`telemetryBodies` non vide) *et* `tracker.accept()` qui renvoie `null` (le cycle de vie
   suivi a été remplacé). À confirmer, pas à croire.
3. **§4 — le filet existe déjà comme motif.** Le repo a une infra de tests d'intégration adossés
   à Mongo : `vitest.integration.config.ts`, `npm run test:integration`, fichiers
   `*.integration.test.ts` (ex. `MongoDBSnapshotRepository.integration.test.ts`). Il n'y a rien
   à inventer, seulement à appliquer à l'orthographe.

---

## Lot 0 — Consigner la décision et trier les trois issues

Aucun code. C'est le lot qui rend les autres lisibles.

- **#185** — commenter la décision (« nspell reste ; ce qui rouvrirait la question : … ») en
  conservant la liste de mesures de l'issue, puis fermer en `not planned` avec le label `wontfix`.
- **#186** — retirer `needs-triage`, poser `ready-for-human` : le lot 6 montre qu'il reste des
  décisions produit à prendre avant toute implémentation.
- **#187** — retirer `needs-triage`, poser `ready-for-agent`, et inscrire dans l'issue le
  prérequis non négociable (tests d'intégration d'abord).
- **`suites.md`** — éditer §2 pour acter la décision, §4 pour lever le blocage, et réécrire
  « Ordre recommandé ». Le fichier reste la trace ; il ne doit pas continuer à décrire un
  arbitrage qui n'existe plus.
- **Ce plan** — déposé ici, à côté de `plan.md`, `atterrissage.md` et `suites.md`.

---

## Lot 1 — `.gitattributes` (§1)

Court, indépendant, ferme une classe de bugs déjà avérée. `core.autocrlf=true` est bien actif
sur la machine de développement — la prémisse du document est vérifiée.

**Test d'abord.** Le correctif actuel (séparateur tolérant `/\r?\n\r?\n---\r?\n\r?\n/`,
`GrammalecteGrammarChecker.test.ts:23`) soigne deux fichiers, pas la classe. Ajouter une
assertion sur le **nombre exact** de paragraphes découpés dans `fiction-clean.txt` et
`fiction-errors.txt`. Un corpus silencieusement réduit à un bloc devient rouge, quelle que soit
la cause future.

**Puis le `.gitattributes`** à la racine, dans son propre commit :

```
* text=auto eol=lf
*.txt text eol=lf
```

Seuls deux `.txt` sont versionnés (`git ls-files '*.txt'`), donc l'impact est borné. Le commit
doit inclure la renormalisation (`git add --renormalize .`) et **rien d'autre** — c'est ce qui
réécrit les fichiers sur disque, et le mélanger à du code rendrait la revue impossible.

**Vérification** : `git ls-files --eol src/infrastructure/grammar/fixtures/` doit afficher
`i/lf w/lf`, et `npm test` reste vert.

---

## Lot 2 — Les sept `test.fixme` de l'autocomplétion (§6)

Indépendant de tout le reste, et c'est le trou qui grandit. Runbook `systematic-debugging` :
**une hypothèse à la fois**.

**Hypothèse 1 (à tester en premier)** : le prefetch sur inactivité (fait établi n°2) s'arme
pendant la frappe de `resetEditorText` et pollue le cycle de vie suivi.

- Instrumenter : lancer `autocomplete.spec.ts` avec les `test.fixme` levés, en journalisant
  chaque corps de télémétrie reçu (`type`, `outcome`, `triggerSource`) ; répéter ~20 fois
  (`--repeat-each=20`) pour attraper l'intermittence.
- Si les événements parasites portent `triggerSource: 'prefetch'`, l'hypothèse tient.

**Le point qui décide de la suite** : `tracker.accept()` renvoyant `null` alors que le fantôme
*est* accepté dans l'éditeur signifie qu'un `accepted_full` est **perdu en production** sous le
même entrelacement — c'est un bug produit sur la télémétrie, pas un défaut de test. Trancher
explicitement entre les deux avant d'écrire la moindre ligne :

- **Bug produit** → test unitaire sur `AutocompleteTelemetryTracker`
  (`autocompleteTelemetry.test.ts`) reproduisant l'entrelacement (prefetch démarré → promu →
  accepté), rouge, puis correction dans `autocompleteTelemetry.ts` / `Autocomplete.ts`.
- **Artefact de test** → rendre le harnais déterministe vis-à-vis du prefetch (attendre la
  quiescence, ou filtrer la télémétrie de prefetch dans `waitForTelemetry` en l'assertant
  séparément). Ne pas neutraliser le prefetch depuis le test : ce serait tester un produit qui
  n'existe pas.

**Fin de lot** : les 7 `test.fixme` retirés (lignes 150, 173, 199, 218, 237, 260, 332) et la
suite verte sur `--repeat-each=20`. Un `fixme` qui subsiste doit porter une cause écrite
*différente* de celle-ci, sinon le lot n'est pas fini.

---

## Lot 3 — Le cluster `c'est` / `s'est` (§3)

La seule part du trou de rappel sans propriétaire.

**Test d'abord**, dans `GrammalecteGrammarChecker.test.ts` : les trois occurrences réelles du
corpus doivent être signalées.

- `"Ce matin là, quelque chose c'est brisé qui ne sera jamais réparer."` → `s'est`
- `"Le champignon atomique qui c'est élevé au-dessus d'Hiroshima…"` → `s'est`
- `"Une fissure c'était ouverte dans l'édifice de nos certitudes"` → `s'était`

**Diagnostic** (le test est rouge, on cherche pourquoi) : rejouer ces phrases sur le moteur avec
`idrule: true` dans le profil pour lire les identifiants des règles qui se déclenchent, et
localiser dans `gc_rules_graph.js` la règle qui *devrait* couvrir le motif ainsi que l'option qui
la gouverne. Trois issues possibles, chacune avec une suite différente :

1. La règle dépend d'une famille coupée par le profil fiction → mesurer les faux positifs de
   cette famille sur `fiction-clean.txt` (le garde-fou existe déjà dans le même fichier de test)
   avant de l'activer. L'activer sans cette mesure serait rejouer les 29 faux positifs de §5.
2. La règle existe mais son contexte ne couvre pas « nom + `c'est` + participe » → le trou est en
   amont, chez Grammalecte : ouvrir un ticket dédié décrivant le motif, et laisser le test en
   `fixme` **avec la cause écrite**.
3. La règle se déclenche mais l'erreur est filtrée en aval (`isIgnoredGrammarIssue`, mapping
   d'offsets dans `CheckChapterGrammarUseCase.checkBlock`) → c'est un bug chez nous, à corriger.

**Fin de lot** : remonter `MIN_KNOWN_MISTAKES_CAUGHT` et `MIN_FLAGGED_RANGES`
(`e2e/ai-strategy/grammar-real-text.spec.ts:18-19`) à la nouvelle mesure moins la marge
existante. Un plancher jamais remonté cesse de mesurer quoi que ce soit.

---

## Lot 4 — Démarrage à froid (§7) puis dictionnaire réinstallé (§8)

**Livrable : des chiffres et une décision consignée. Aucune optimisation dans ce lot.**

**§7** — mesurer la *première* « Corriger le chapitre » d'un processus serveur en conditions de
production : `npm run build && npm start`, puis un seul appel sur le chapitre Hiroshima. Séparer
les deux coûts, sinon la mesure ne dit rien d'actionnable :

- chargement du moteur (`new GrammalecteEngine(['Grammalecte'])`,
  `GrammalecteGrammarChecker.ts:31`, payé une fois par processus via le singleton de module) ;
- vérification elle-même, une fois le moteur chaud.

Comparer au budget de test de 150 s (`FIRST_CHECK_TIMEOUT`) qui, lui, ne dit rien de l'expérience
réelle. Consigner via la skill `journal`, et ouvrir une issue de préchauffage **uniquement** si le
chiffre le justifie — avec le chiffre dans l'issue.

**§8** — avec la mesure de §7 en main, décider par écrit si la réinstallation du dictionnaire à
chaque vérification (`dictionary !== installedDictionary`, `GrammalecteGrammarChecker.ts:45`,
toujours vraie puisque les réglages sont relus depuis Mongo) se voit. Consigner la décision **et
la forme du correctif** pour que la reprise soit immédiate :

> Remplacer la comparaison par référence par une identité stable passée dans
> `GrammarCheckOptions` — `personalDictionaryId = ${projectId}:${settings.getUpdatedAt().getTime()}`
> (`ProjectSettings.getUpdatedAt()` existe et est bumpé à chaque mutation). Cheap, exact, et la
> garantie d'isolation est **renforcée** : deux projets ne peuvent plus produire la même clé.
> Ne pas comparer le dictionnaire par valeur : c'est un automate Graphspell
> (`Record<string, unknown>` volumineux) et son `sDate` n'a pas une granularité sûre.

---

## Lot 5 — Dette architecturale du correcteur orthographique (§4 / #187)

Débloqué par la décision d'entrée. **Prérequis non négociable d'abord.**

### 5a — Le filet (aucun refactor dans ce sous-lot)

Il n'existe aujourd'hui aucun test d'intégration pour l'orthographe ; les actions adossées à la
base ne sont couvertes que par les E2E. Écrire
`src/app/actions/__tests__/spell-check-actions.integration.test.ts` sur le motif existant
(`vitest.integration.config.ts`, Mongo via `npm run db:start`), couvrant les actions qui
écrivent : `addWordToCustomDictionaryAction`, `removeWordFromCustomDictionaryAction`,
`addIgnoredWordAction`, `removeIgnoredWordAction`, `clearIgnoredWordsAction` — y compris **le cas
où les réglages du projet n'existent pas encore**, qui est aujourd'hui un `return` silencieux
(`spell-check-actions.ts:99, 145, 161`). Le test fige le comportement actuel avant de le juger.

### 5b — Le refactor, un commit par défaut

Modelé sur le correcteur grammatical, construit à l'opposé et qui sert de référence
(port `GrammarChecker` → `CheckChapterGrammarUseCase` → `GrammalecteGrammarChecker`) :

1. Extraire l'adaptateur : `src/infrastructure/spell/NspellSpellChecker.ts` implémentant le port
   `SpellChecker` (`src/domain/interfaces/SpellChecker.ts`), qui emporte la lecture `.aff`/`.dic`
   et l'instanciation aujourd'hui inlinées dans la Server Action (`spell-check-actions.ts:15-29`).
2. L'enregistrer dans `src/infrastructure/config/providers.ts` (à côté de
   `getGrammarDictionaryCompiler`) et **dédupliquer les initialisations concurrentes** en
   mémorisant la *promesse*, pas l'instance — le défaut adjacent relevé dans #187 disparaît avec
   l'extraction.
3. Introduire un use case entre l'action et le moteur, sur le modèle de
   `CheckChapterGrammarUseCase` ; le port devient réellement injecté au lieu d'être un simple
   cast (`as unknown as SpellChecker`, `spell-check-actions.ts:27`).
4. Donner une représentation de domaine au type positionnel d'une faute, aujourd'hui déclaré
   inline dans `src/hooks/useSpellCheck.ts:19-21` — à aligner sur `TextIssue`
   (`src/domain/value-objects/TextIssue.ts`), déjà le vocabulaire de sortie du hook.
5. Défauts adjacents, un commit chacun, chacun avec son test :
   - persistance « fire and forget » sans gestion d'erreur ;
   - écritures silencieusement ignorées quand les réglages n'existent pas (comportement figé
     en 5a) ;
   - **comparaison de casse incohérente** : le serveur accepte inconditionnellement les
     majuscules et teste `word.toLowerCase()` (`spell-check-actions.ts:55-59`) pendant que le
     client réindexe sur `m.word.toLowerCase()` (`useSpellCheck.ts:111-129`) — deux mots ne
     différant que par la casse s'écrasent.

**Hors périmètre, à laisser tel quel** : l'acceptation inconditionnelle des majuscules est une
décision produit documentée et testée comme intentionnelle. Elle ne bouge pas dans un lot de
refactor. Elle appartenait à l'arbitrage #185, qui est clos.

**Fin de lot** : `npm run verify` vert, `npm run test:integration` vert, et les deux correcteurs
partagent enfin la même architecture.

---

## Lot 6 — Normalisation typographique à l'export (§5 / #186) — spécification seulement

#186 est `ready-for-human` : il reste des décisions produit à prendre, et une implémentation
avant décision serait à refaire. Le livrable de ce lot est une **spec**, pas du code. Positions
proposées, à confirmer :

| Question ouverte | Position proposée |
|---|---|
| Où ça s'applique | À l'export **et** à l'aperçu livre — sinon l'aperçu ment sur le rendu final |
| Réversible ou destructive | **Non destructive** : transformation au rendu, le manuscrit n'est pas touché. La philosophie du produit ne laisse pas vraiment le choix |
| Optionnelle par profil | Oui, par profil d'export (KDP / A4 / A5) |
| Nœuds non textuels | Appliquer **après** le mapping des offsets, jamais dessus — c'est ce qui casse les appels de note |
| Moteur | Évaluer `textformatter.js`, déjà présent dans le paquet Grammalecte, avant d'écrire une transformation dédiée |
| Liste des conventions | **À écrire explicitement** — apostrophes typographiques, insécables avant `! ? : ;`, espaces fines, ligatures. « typographie française » n'est pas une spécification |

Les 29 faux positifs sur 29 mesurés sur de la prose correcte sont l'argument : ce ne sont pas de
faux signalements, c'est le bon travail au mauvais étage.

---

## Ordre d'exécution

0. **Lot 0** — décision + triage (aucun code, débloque la lecture du reste)
1. **Lot 1** — `.gitattributes` (indépendant, court)
2. **Lot 2** — autocomplétion (indépendant, le trou grandit)
3. **Lot 3** — cluster `c'est`/`s'est`
4. **Lot 4** — mesures §7 puis décision §8
5. **Lot 5** — dette #187 (5a avant 5b, sans exception)
6. **Lot 6** — spec #186

Les lots 1 à 3 sont parallélisables en worktrees (`git worktree add ../revise-<nom> -b <type>/<nom>`)
puisqu'ils ne touchent aucun fichier commun. Le lot 5 ne l'est pas : il traverse les quatre couches.

---

## Vérification

- **Par lot** : `npm test` (unitaires) sur chaque commit ; `npm run lint` avant de pousser.
- **Lot 1** : `git ls-files --eol src/infrastructure/grammar/fixtures/` → `i/lf w/lf` ; le
  nouveau test de comptage de paragraphes est vert.
- **Lot 2** : `npx playwright test e2e/ai-strategy/autocomplete.spec.ts --repeat-each=20`,
  0 `test.fixme` restant sur cette cause.
- **Lot 3** : `npx playwright test e2e/ai-strategy/grammar-real-text.spec.ts` vert avec les
  planchers **remontés**.
- **Lot 5a** : `npm run db:start` puis `npm run test:integration`.
- **Lot 5b** : `npm run verify` complet + `e2e/ai-strategy/spell-check.spec.ts`.
- **Aléa connu à ne pas confondre avec une régression** : `autocomplete.spec.ts` porte ~20 %
  d'aléa préexistant, précisément ce que traite le lot 2.

## Ce que ce plan ne fait pas

- Aucun changement de correcteur orthographique (décision d'entrée).
- Aucune optimisation du démarrage à froid ni de la réinstallation du dictionnaire — mesure et
  décision écrite seulement (lot 4).
- Aucune implémentation de la normalisation typographique — spécification seulement (lot 6).
- Aucune modification de l'acceptation des majuscules par nspell.
