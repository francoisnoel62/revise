# Normalisation typographique à l'export — spécification

Issue : **#186**. Ce document est le livrable du lot 6 de
[suites-plan.md](../correcteur-grammatical/suites-plan.md). C'est une spécification, pas un plan
d'implémentation : les décisions marquées « à confirmer » relèvent du produit, et rien ne doit
être écrit avant qu'elles soient prises.

## Le problème

Le profil fiction coupe délibérément toute la famille micro-typographie — `typo`, `apos`,
`liga`, `mapos`. C'est là que vivaient **29 faux positifs sur 29** mesurés sur de la prose
correcte.

Mais ce ne sont pas de faux signalements. Apostrophes typographiques, insécables avant
`! ? : ;`, espaces fines, ligatures : c'est exactement la qualité typographique qu'attend un
livre publié. **Le problème est l'étage, pas la règle.** Souligner chaque point d'exclamation
d'un roman pendant que l'auteur écrit est catastrophique ; appliquer la transformation au moment
de l'export ne coûte rien et sert directement l'objectif d'auto-édition.

## Le moteur : `TextFormatter`, déjà dans le paquet

`@francoisnoel62/grammalecte` embarque
`_build/nodejs/fr/core/grammalecte/fr/textformatter.js`, qui expose une classe `TextFormatter`
avec une seule méthode utile :

```js
formatText(sText: string, dOpt?: Map<string, boolean>): string
```

Vérifié en l'état sur le paquet installé :

| Avant | Après |
|---|---|
| `L'auteur s'exclama : « Enfin ! » Puis il partit...` | `L’auteur s’exclama : « Enfin ! » Puis il partit…` |
| `Elle dit "non" et sortit` | `Elle dit “non” et sortit` |

Elle porte **une cinquantaine d'options nommées** couvrant précisément le périmètre voulu :
`ts_apostrophe`, `nbsp_before_punctuation`, `nnbsp_before_punctuation` (espace fine),
`ts_quotation_marks`, `ts_ellipsis`, `ts_m_dash_start`, les sept `ts_ligature_*_do`,
`ordinals_exponant`, `missing_hyphens`.

**Deux réserves à porter dans la décision :**

1. Elle **n'est pas dans l'API publique** du paquet — `index.d.ts` ne déclare que
   `GrammarChecker`. L'atteindre demande de requérir le fichier interne, comme
   `GrammalecteDictionaryCompiler` le fait déjà pour `dawg.js`. Il faudra donc la déclarer
   dans `outputFileTracingIncludes` de `next.config.ts`, sans quoi la fonction déployée ne
   l'aura pas — le test de `GrammalecteDictionaryCompiler` vérifie déjà ce genre d'oubli et
   doit être étendu.
2. Elle **change la longueur du texte** : dans l'exemple ci-dessus, 50 caractères deviennent
   48 (`...` → `…`). C'est la contrainte structurante de toute cette spécification.

Écrire une transformation dédiée reste possible, mais reviendrait à réimplémenter ces
cinquante options — et à les maintenir.

## Décisions produit — positions proposées, à confirmer

| Question | Position proposée | Pourquoi |
|---|---|---|
| **Réversible ou destructive** | **Non destructive** : transformation au rendu, le manuscrit n'est jamais réécrit | Le manuscrit appartient à l'auteur. Une réécriture silencieuse de son texte est exactement ce que la philosophie du produit interdit |
| **Où ça s'applique** | Export **et** aperçu livre | Un aperçu qui ne montre pas la typographie finale ment sur ce qu'on s'apprête à publier |
| **Optionnelle** | Oui, par profil d'export (KDP / A4 / A5), activée par défaut | Un profil est déjà l'endroit où se règle ce qui dépend du support |
| **Périmètre des conventions** | Voir le tableau ci-dessous — explicite, pas « la typographie française » | « typographie française » n'est pas une spécification : deux personnes n'en tireront pas le même résultat |

## Les conventions retenues — liste explicite

À confirmer ligne par ligne ; c'est cette liste qui devient la configuration, pas une intention
générale.

| Convention | Option `TextFormatter` | Proposition |
|---|---|---|
| Apostrophe typographique (`'` → `’`) | `ts_apostrophe` | ✅ activée |
| Guillemets français (`"` → `« »`) | `ts_quotation_marks` | ✅ activée |
| Points de suspension (`...` → `…`) | `ts_ellipsis` | ✅ activée |
| Insécable avant `! ? : ;` | `nbsp_before_punctuation` | ✅ activée |
| Espace **fine** insécable plutôt qu'insécable | `nnbsp_before_punctuation` | ⚠️ à trancher — plus juste typographiquement, mais mal rendue par certaines liseuses |
| Insécable dans les nombres | `nbsp_within_numbers` | ✅ activée |
| Cadratin en début de réplique | `ts_m_dash_start` | ✅ activée — c'est le dialogue de roman |
| Ligatures (`fi`, `fl`, `ff`…) | `ts_ligature_*_do` | ❌ désactivées — c'est le travail de la police, pas du texte ; une ligature codée en dur casse la recherche et la sélection |
| Ordinaux en exposant (`1er`) | `ordinals_exponant` | ⚠️ à trancher — dépend du rendu visé |
| Traits d'union manquants | `missing_hyphens` | ⚠️ à trancher — c'est une correction de langue, pas de typographie ; elle change le mot, pas sa mise en forme |

## La contrainte technique qui commande tout

`formatText` prend une chaîne et rend une chaîne **de longueur différente**. Or le document
porte des nœuds non textuels dont la position est calculée : appels de note, marques de
formatage, décorations. Appliquer la transformation sur du texte agrégé décale tout ce qui
suit et déplace les appels de note.

**Règle** : la transformation s'applique **nœud de texte par nœud de texte**, au moment du
rendu, après que les positions ont été résolues — jamais sur un document sérialisé ni sur un
texte reconstitué à partir de plusieurs nœuds.

Conséquence à vérifier au moment de l'implémentation : une transformation qui dépend du
contexte (l'insécable avant `!` a besoin de savoir ce qui précède) perd de l'information à la
frontière entre deux nœuds — par exemple lorsqu'un mot en italique est suivi d'un `!` en
romain. À mesurer sur un vrai manuscrit avant de choisir entre « par nœud » et « par bloc avec
remapping d'offsets ».

## Ce qui reste ouvert

- Le comportement des trois lignes ⚠️ ci-dessus.
- Si la transformation doit être visible dans l'aperçu **avant** export, ou seulement dans le
  fichier produit.
- S'il faut un moyen pour l'auteur de voir ce qui a été transformé (un diff typographique)
  plutôt que de le découvrir dans le fichier final.
