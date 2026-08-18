# 11 — Consistency Checker (Knowledge Intelligence v1)

**Dépend de** : 03. **Bloque** : le reste de Knowledge Intelligence.
**ADR** : [0008](../../adr/0008-trois-types-de-projet.md)

## Pourquoi celui-ci en premier des quatre

Knowledge Intelligence compte quatre briques : Consistency Checker, Knowledge Graph,
Argument Analysis, Source Intelligence. Le Consistency Checker vient en premier parce
que **la machinerie existe déjà** sous un autre nom.

Le registre canon de la fiction fournit :

- `CanonFact` avec plages de validité par chapitre (`validFromChapter`, et une borne de
  fin facultative)
- l'**extraction incrémentale** — seuls les chapitres non vides dont le hash a changé
  sont retraités
- la **préservation des faits manuels** : un fait `author` n'est jamais écrasé par
  l'extraction
- un plafond d'injection avec priorisation

C'est un portage, pas une construction.

## Ce que ça devient en non-fiction

Un manuscrit de guide ou de manuel a ses propres formes d'incohérence :

| Catégorie | Exemple d'incohérence détectée |
|---|---|
| **Définition** | un terme défini au chapitre 2, redéfini différemment au chapitre 7 |
| **Affirmation factuelle** | un chiffre annoncé puis contredit |
| **Terminologie** | le même concept désigné par trois mots différents |
| **Procédure** | une étape présentée comme obligatoire ici, facultative là |
| **Renvoi** | une référence à une section qui n'existe pas ou a été renommée |

La structure de données ne change pas : une affirmation atomique, une portée de validité,
une origine `derived` ou `author`. Seules les catégories et les prompts changent — et les
prompts sont déjà externalisés par le chantier 02.

## Fichiers touchés

- `src/domain/entities/` — la catégorisation non-fiction, à côté de `CanonFact`
- `src/application/use-cases/GenerateCanonFactsUseCase.ts` — généralisé ou décliné
- `src/application/services/` — l'extraction incrémentale, réutilisée telle quelle
- `docs/prompt/knowledge/` — les prompts d'extraction et de détection
- `src/components/cockpit/` — l'affichage sous le nom Knowledge Intelligence

## Tests à écrire d'abord

1. Sur un projet `non-fiction`, l'extraction produit des affirmations catégorisées selon
   la grille non-fiction, jamais selon la grille narrative.
2. Une définition contredite entre deux chapitres est signalée, avec les deux
   emplacements.
3. Une affirmation saisie manuellement n'est pas écrasée par une extraction ultérieure.
4. Seuls les chapitres dont le hash a changé sont retraités.
5. Un chapitre vide n'est pas traité.
6. Sur un projet `fiction`, le comportement du registre canon est **strictement
   inchangé** — c'est le test de non-régression.

## Critère de fin

Sur un manuel de plusieurs chapitres, le Consistency Checker signale une contradiction
réelle et n'invente pas de contradiction sur un texte cohérent. Le second point compte
autant que le premier : un détecteur bruyant ne sera pas utilisé.

## Risque

Le taux de faux positifs décide de l'adoption. Prévoir un corpus de test — un manuel
cohérent, un manuel contenant des contradictions connues — et **mesurer** avant de
livrer, plutôt que de juger à l'œil. Le dépôt a un précédent utile : les tests de corpus
du correcteur grammatical, et `tests_ia_efficiency/`.
