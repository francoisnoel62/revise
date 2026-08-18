# 03 — `ProjectKind`, création guidée, Story et Knowledge Intelligence

**Dépend de** : 02. **Bloque** : 04, 05, 11, 12.
**ADR** : [0008](../../adr/0008-trois-types-de-projet.md)

## Ce qu'on fait

Introduire un value object `ProjectKind` à trois valeurs — `fiction`, `non-fiction`,
`low-content` — porté par `Project`, **fixé à la création et immuable**.

L'écran de création demande le type avant toute autre chose, avec un libellé qui parle
à l'auteur plutôt qu'au développeur :

- **Roman ou nouvelle** → `fiction`, analyses **Story Intelligence**
- **Essai, manuel ou guide** → `non-fiction`, analyses **Knowledge Intelligence**
- **Carnet ou planner** → `low-content`, aucune analyse

Sur un projet `non-fiction`, les fonctionnalités de fiction sont **désactivées, jamais
supprimées** : chat personnage, registre canon, analyse narrative, analyse d'intrigue,
worldbuilding, thésaurus littéraire.

`low-content` n'expose aucun éditeur de manuscrit — voir [chantier 12](12-low-content.md).
En attendant celui-ci, le type est accepté mais mène à un écran qui annonce la
fonctionnalité à venir plutôt qu'à un éditeur inadapté.

## Fichiers touchés

- `src/domain/value-objects/ProjectKind.ts` — nouveau
- `src/domain/entities/Project.ts` — champ en lecture seule, validé au constructeur
- `src/infrastructure/persistence/` — sérialisation, avec un **repli explicite sur
  `fiction`** pour les projets existants
- `src/application/use-cases/CreateProjectUseCase.ts` — le type devient une entrée requise
- `src/app/actions.ts` et les server actions de création
- `src/components/dashboard/` — l'écran de création
- `src/components/cockpit/` — masquage des entrées de menu selon le type
- `src/app/project/[projectId]/` — gardes d'accès aux routes d'analyse

## Tests à écrire d'abord

1. Un projet créé sans type est rejeté.
2. Un projet existant sans `kind` en base est relu comme `fiction`.
3. `ProjectKind` n'expose aucun mutateur ; toute tentative de modification échoue à la
   compilation ou au test.
4. Sur un projet `non-fiction`, les use cases de fiction (canon, chat personnage,
   analyse d'intrigue) refusent l'exécution avec une erreur nommée, pas un plantage.
5. Le cockpit d'un projet `non-fiction` n'affiche aucune entrée Story Intelligence.
6. Le cockpit d'un projet `fiction` est **strictement inchangé** — c'est le test de
   non-régression du public actuel.

## Critère de fin

Un projet `fiction` créé avant ce chantier se comporte exactement comme avant. Un projet
`non-fiction` s'ouvre dans l'éditeur sans aucune entrée de fiction visible.

## Risque

Le repli des projets existants sur `fiction` doit être testé sur un document Mongo réel,
pas seulement sur un objet construit en mémoire. Le précédent existe :
`RemovedPublicationProfileMigration` et son script associé.
