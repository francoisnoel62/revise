# Atterrissage du correcteur grammatical dans `main`

> **Archive de livraison.** Le merge décrit ici est achevé ; les incertitudes et
> actions formulées au présent sont le contexte du 12 août 2026, pas une liste
> de travail actuelle. Pour le correcteur actif, voir [plan.md](plan.md) et
> `docs/architecture.md`.

Ce document ne décrit pas la conception du correcteur — elle est dans [plan.md](plan.md).
Il décrit comment faire atterrir la branche `codex/grammalecte` dans `main` sans rien casser.

## Point de départ (12 août 2026)

- `codex/grammalecte` : 21 commits d'avance, **9 de retard** sur `main`, dernier commit le 6 août.
- 123 fichiers, +6 246 / −1 468.
- `lint` vert. Tests unitaires : 3 485 verts, **2 rouges**.
- Suite E2E : **non mesurée** sur cette branche.
- **13 fichiers modifiés des deux côtés** — le merge sera conflictuel.
- Aucun `TODO`/`FIXME`/test ignoré. Issues d'implémentation #178, #179, #182 fermées.
  #185, #186, #187 restent ouvertes mais sont marquées « Backlog » : hors périmètre.

Les 2 tests rouges ne sont pas une régression du moteur. Les corpus sont découpés sur
`\n\n---\n\n`, or `core.autocrlf=true` les écrit en CRLF au checkout : le découpage renvoie
1 paragraphe au lieu de 15. Vérifié directement — `LF-split -> 1`, `CRLF-split -> 15`.
Ces tests passent en CI sous Linux et échouent sur toute machine Windows.

## Principe directeur

**Établir une base de référence sincère avant de merger.** Si on rapatrie `main` d'abord,
tout rouge qui apparaît ensuite sera indiscernable : dommage du merge, ou déjà cassé avant ?
On paye 20 minutes maintenant pour ne pas passer des heures à démêler ça après.

## Phase 0 — Rendre la branche sincère

**0.1 — Corriger le découpage des corpus**
Rendre le séparateur tolérant aux deux fins de ligne (`/\r?\n\r?\n---\r?\n\r?\n/`).
Le test rouge existe déjà : il fait office de test qui échoue.

Préféré à un `.gitattributes` dans l'immédiat : le correctif est local au test, prouvable,
et ne change pas la façon dont *tous* les fichiers du dépôt sont écrits sur le disque.
La question du `.gitattributes` est traitée en phase 3, séparément.

**0.2 — Mesurer la vérité, branche telle quelle**
Lancer les cinq portes : `lint`, unitaires, intégration, `build`, E2E complet.
Consigner le résultat. L'E2E n'a jamais tourné ici : il contient `grammar-check.spec.ts`
et `personal-dictionary.spec.ts`, jamais exécutés. C'est l'étape qui peut révéler du travail
non prévu — et c'est exactement pour ça qu'elle vient avant le merge.

> Si l'E2E révèle des échecs de fond, on s'arrête et on réévalue le périmètre.
> Le reste du plan suppose une base verte.

### Référence mesurée le 12 août 2026 (avant merge)

| Porte | Résultat |
|---|---|
| `lint` | ✅ 0 |
| unitaires | ✅ 3 487 / 13 ignorés |
| intégration | ✅ 72 / 23 ignorés |
| `build` | ✅ 0 |
| E2E | ✅ **96** (dont `grammar-check` et `personal-dictionary`, jamais exécutés jusqu'ici) |

**La branche est entièrement verte.** Toute porte rouge après le merge est donc, sans ambiguïté,
un dommage du merge — c'était l'objet de cette phase.

Deux précisions sur la mesure :

- Le correctif du découpage ne rend pas seulement les tests verts : il fait porter les deux
  seuils sur les 15 extraits réels. Le moteur atteint donc bien 0 faux positif sur le corpus
  propre et ≥ 12 détections sur le corpus fautif — c'est une validation, pas un feu vert.
- Le serveur de dev a été redémarré avant l'E2E. `next.config.ts` diffère entre les deux
  branches et Next ne le recharge pas à chaud : mesurer sans redémarrer aurait testé la
  configuration de `main`. À refaire à chaque bascule de branche.

Les 96 E2E se comparent aux 81 de `main` : la branche en ajoute 15.

## Phase 1 — Rapatrier `main`

**1.1 — `git merge main`, pas de rebase**
La branche est publiée sur `origin` et compte 21 commits. Un rebase réécrirait un historique
déjà poussé. Le merge est la seule option sûre ici.

**1.2 — Résoudre les 13 conflits, dans cet ordre**

| Ordre | Fichiers | Pourquoi en premier |
|---|---|---|
| 1 | `e2e/helpers/seed.ts`, `e2e/editor/snapshot-restore.spec.ts`, `src/app/actions/project-actions.test.ts` | Modifiés côté `main` le 12 août ; leur intention est fraîche et documentée |
| 2 | `ProjectSettings.ts`, `project-settings-serializer.ts`, `ProjectSettings.test.ts` | Cœur du domaine : une erreur ici se propage partout |
| 3 | `TextEditor.tsx`, `src/app/editor/page.tsx`, `project-settings-actions.ts`, `UpdateProjectSettingsUseCase.ts` | Interface et cas d'usage |
| 4 | `next.config.ts`, `providers.ts`, `e2e/editor/automatic-snapshots.spec.ts` | Configuration, moins couplée |

**Règle de résolution** : les deux côtés sont additifs, pas concurrents. `main` ajoute des
vérifications sur la suppression des sauvegardes ; la branche étend les réglages de projet.
Une résolution qui *supprime* l'intention d'un des deux côtés est une erreur, pas un arbitrage.

**1.3 — Reprendre les cinq portes et comparer à 0.2**
Tout nouveau rouge est un dommage de merge et se corrige avant d'aller plus loin.

### Résultat (12 août 2026)

**4 conflits** sur les 13 fichiers qui se chevauchaient ; Git a fusionné le reste seul.
Résolus en gardant l'intention des deux côtés — détail dans le message du commit de merge.

Deux pièges rencontrés, l'un et l'autre invisibles sans la référence de phase 0 :

1. **Git a conservé les deux copies d'un même ajout.** Les deux côtés avaient mocké
   `getSnapshotRepo` ; la fusion automatique a produit mock, déclaration et initialisation
   en double. Une `let` dupliquée ne compile pas. Un merge « sans conflit » n'est pas un
   merge correct.
2. **`snapshot-restore` cassé alors qu'il passait sur les deux parents.** La fixture semait
   des paragraphes sans les attributs que l'éditeur écrit (`textAlign`, `semanticRole`).
   L'éditeur les normalisait au montage — une vraie modification, dont l'autosave déplaçait
   `project.updatedAt` et faisait rejeter la restauration par son propre garde de
   concurrence. Corrigé à la racine : la fixture sème la forme que l'éditeur produit.
   Mesuré par sondes successives (l'autosave part ~4 s après le chargement ; le contenu
   écrit diffère ; laisser l'autosave se déposer suffisait à faire passer le test).

| Porte | Après merge |
|---|---|
| `lint` | ✅ 0 |
| unitaires | ✅ 3 523 |
| intégration | ✅ 72 |
| `build` | ✅ 0 |
| E2E | ⚠️ 98–99 verts, 1 aléa **préexistant** |

L'aléa restant est `autocomplete.spec.ts:318` (~20 %, isolé comme en suite). Ni `main` ni
la branche n'ont touché ce test ni le code d'autocomplétion : ce n'est pas un dommage du
merge. Le fichier documente déjà une instabilité voisine par un `test.fixme`.

**Limite assumée de la méthode** : la référence de phase 0 tenait en une seule exécution,
donc elle ne pouvait pas révéler une instabilité à 20 %. Elle prouve ce qu'elle prouve —
elle a bien permis d'attribuer la casse de `snapshot-restore` au merge, pas davantage.

## Phase 2 — Atterrir

**2.1 — Ouvrir une Pull Request vers `main`**
C'est la convention du dépôt (#195, #196). La description couvre : le correcteur local,
le dictionnaire morphologique, le recentrage de l'analyse IA, l'ADR 0006 sur la licence,
et les trois issues backlog laissées ouvertes.

**2.2 — Merger depuis GitHub, puis supprimer la branche** (locale et distante).

## Phase 3 — Hygiène, séparément

Ajouter un `.gitattributes` pour que la classe entière du problème CRLF ne se represente pas
sur un futur fichier de données. À faire dans son propre commit, après l'atterrissage :
ça modifie la façon dont les fichiers sont écrits sur le disque de chaque machine, et on ne
mélange pas ça avec la livraison d'une fonctionnalité.

## Ce qui reste incertain

- **L'ampleur des conflits** est inconnue tant que le merge n'est pas tenté. 13 fichiers est
  un compte, pas une difficulté.
- **Le résultat E2E** est la vraie inconnue du plan. Tout le reste en dépend.
- Plus on attend, plus l'écart avec `main` grandit et plus ces deux inconnues empirent.
