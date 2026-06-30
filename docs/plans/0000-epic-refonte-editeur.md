# Épopée — Refonte de l'éditeur : éditeur-aperçu fidèle au livre

Index du backlog. Chaque ligne ↔ un fichier de plan ↔ une future GitHub issue.
Décision d'architecture : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md) · Vocabulaire : [CONTEXT.md](../../CONTEXT.md) « Mise en page et publication ».

**Étoile polaire** : publier sans friction ; un export « KDP ready » accepté du premier coup, zéro aller-retour.

## Règle d'or de séquencement

Le **spike (Phase 0) conditionne tout le reste**. Tant que le spike n'est pas vert (parité pixel + budget de re-pagination vivante tenu par Paged.js), les issues des phases 1-5 restent **contingentes** : `needs-triage`, scope figé mais implémentation non détaillée. Si le spike échoue, plusieurs d'entre elles changent (fallback paginateur custom).

## Backlog

| # | Fichier | Titre | Phase | Dépend de | Label suggéré |
|---|---|---|---|---|---|
| A | `0002-issue-spike-jalon1-parite-statique.md` | Spike J1 — parité statique KDP 6×9 (pixel-diff) | 0 | — | `ready-for-agent` |
| B | `0003-issue-spike-jalon2-repagination-vivante.md` | Spike J2 — re-pagination vivante (budget perf) | 0 | A | `ready-for-agent` |
| C | `0004-issue-chromium-vercel.md` | Déploiement Chromium sur Vercel | 1 | A | `ready-for-human` |
| D | `0005-issue-publicationprofile-pagedrenderer.md` | `PublicationProfile` + `PagedRenderer` (coutures) | 1 | A | `needs-triage`→`ready-for-agent` |
| E | `0006-issue-remplacer-pdf-lib.md` | Remplacer l'export PDF `pdf-lib` A4 | 1 | A, D | `needs-triage`→`ready-for-agent` |
| F | `0007-issue-contenu-semantique-migration.md` | Modèle de contenu sémantique + migration | 2 | D | `needs-triage` |
| G | `0008-issue-toolbar-profil-adaptative.md` | Barre d'outils profil-adaptative | 2 | F | `needs-triage`→`ready-for-agent` |
| H | `0009-issue-surcharges-presentation.md` | Couche de surcharges de présentation (passerelle) | 2 | F | `needs-triage`→`ready-for-agent` |
| I | `0010-issue-selecteur-bascule-profil.md` | Sélecteur de profil + bascule à chaud sans perte | 3 | D, F | `needs-triage`→`ready-for-agent` |
| J | `0011-issue-profils-additionnels.md` | Profils additionnels (A5, trims KDP, passerelle Word) | 3 | D, I | `done` |
| K | `0012-issue-profils-marketplaces-preflight.md` | Profils marketplaces + preflight zéro-rejet | 3 | D, I | `ready-for-human` |
| L | `0013-issue-liminaires-toc.md` | Liminaires + TOC générés | 4 | D, E | `done` |
| M | `0014-issue-numerotation-livre-entier.md` | Numérotation livre-entier (offsets cachés) | 4 | E, L | `done` |
| N | `0015-issue-apercu-livre-entier.md` | Aperçu « livre entier » continu | 4 | E, M | `ready-for-agent` |
| O | `0016-issue-ia-adaptee-pagination.md` | Adapter l'intégration IA au modèle paginé/sémantique | 5 | F, B | `ready-for-agent` |

Détail du spike : `0001-spike-editeur-apercu-kdp-parite-pixel.md`.
Process pour un agent frais : `handoff-editeur-refonte-issues.md`.
