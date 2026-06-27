# Issue — Profils marketplaces (BoD, TheBookEdition…) + preflight zéro-rejet

**Phase** 3 · **Dépend de** : `0005`, `0010` · **Label** : `ready-for-human`
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md) (étoile polaire, question ouverte « preflight »).

## Contexte
Cœur de l'étoile polaire : un export accepté **du premier coup**. Au-delà de la validité par construction des profils print-ready, ajouter un **preflight** explicite par marketplace (KDP, BoD, TheBookEdition, Bookelis…) qui vérifie les exigences réelles de la plateforme.

## Périmètre
**In** : recherche/spec des exigences réelles par plateforme (trims acceptés, marges/gouttière mini, fond perdu, polices embarquées, DPI images, nb de pages min/max, ISBN) ; profils dédiés ; **preflight** qui bloque/alerte avant export ; rapport d'anomalies actionnable.
**Out** : la génération PDF elle-même (déjà couverte).

## Critères d'acceptation
- [ ] Pour chaque plateforme ciblée, les exigences sont documentées et encodées.
- [ ] Le preflight détecte les non-conformités avant export et les explique.
- [ ] Un export validé est effectivement accepté par la plateforme (test réel).

## Ancre TDD
Tests du preflight sur fixtures conformes/non conformes (marges trop faibles, DPI insuffisant, nb de pages invalide…) → verdict attendu. Validation finale = soumission réelle (manuelle).

## Pourquoi `ready-for-human`
Exige des comptes marketplaces réels et des soumissions de validation — décision/exécution humaine. Un agent prépare specs + preflight, l'humain valide en conditions réelles.
