# Issue — Aperçu « livre entier » continu

**Phase** 4 · **Dépend de** : `0006`, `0014` · **Label** : `done` · **Issue** : #134 · **Mergé** : 2026-06-30
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md).

## Contexte
Au-delà de l'édition par chapitre, offrir un **aperçu continu du livre entier** (liminaires + tous les chapitres + TOC) tel qu'il sera publié — lecture seule, fidèle à l'export.

## Périmètre
**In** : vue lecture seule paginée du manuscrit complet via le `PagedRenderer` (mêmes pages que l'export PDF) ; navigation (aller à une page/chapitre) ; gestion de la perf sur longs manuscrits (rendu paresseux/virtualisation si nécessaire).
**Out** : édition dans cette vue (elle reste un aperçu) ; export (déjà couvert).

## Critères d'acceptation
- [x] L'aperçu livre entier est identique à l'export PDF (parité).
- [x] Navigation fluide ; perf tenue sur un roman réaliste (~300-400 pages).
- [x] Liminaires, TOC et numérotation continue corrects.

## Ancre TDD
Tests : l'aperçu d'un manuscrit-fixture == pages de l'export ; navigation atteint la bonne page ; budget de rendu sous seuil pour un long manuscrit.
