# Issue — Liminaires + table des matières générés

**Phase** 4 · **Dépend de** : `0005`, `0006` · **Label** : `needs-triage` → `ready-for-agent`
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md), [CONTEXT.md](../../CONTEXT.md) (Liminaires).

## Contexte
Les **liminaires** (faux-titre, page de titre, copyright, dédicace, épigraphe) et la **TOC** sont **générés automatiquement** depuis les Annexes éditoriales + les métadonnées, comptés dans la numérotation, mais **hors de la surface d'écriture** (la prose reste reine). Sources existantes : page « Annexes éditoriales » et `FrontMatterData` (déjà dans `DocumentExporter`).

## Périmètre
**In** : génération des pages liminaires par le profil depuis annexes + métadonnées ; génération de la TOC ; insertion dans le rendu paginé (aperçu livre entier + export) ; règles de pages (ex. chapitres sur pages impaires, chiffres romains pour les liminaires).
**Out** : numérotation arabique du corps (`0014`) ; édition inline des liminaires (explicitement écartée — elles restent générées).

## Critères d'acceptation
- [ ] Liminaires + TOC apparaissent dans l'aperçu « livre entier » et l'export, pas dans la surface d'écriture du chapitre.
- [ ] Le contenu provient des Annexes éditoriales/métadonnées (pas de double saisie).
- [ ] Les liminaires occupent leurs pages et participent aux offsets de numérotation.

## Ancre TDD
Tests : à partir d'annexes/métadonnées de fixture, le rendu produit les bonnes pages liminaires + une TOC correcte (entrées, ordre). Test que la surface d'écriture n'inclut pas ces pages.
