# Programme — Revise, plateforme d'auto-édition

> **Rien n'est implémenté.** Ce dossier est un plan. La source de vérité du
> comportement actuel reste le code câblé. Rédigé le 18 août 2026.

Ce dossier décrit le passage de Revise d'un assistant d'écriture de fiction à un outil
d'écriture **et** de publication pour auteurs auto-publiés.

## Par où commencer

1. **[PRD.md](PRD.md)** — le problème, le public, le périmètre, les critères de réussite
   et les incertitudes assumées.
2. Les **cinq ADR** qui portent les décisions structurantes :
   [0007](../../adr/0007-perimetre-produit-et-revision-philosophie.md) ·
   [0008](../../adr/0008-trois-types-de-projet.md) ·
   [0009](../../adr/0009-editions-multiples-par-manuscrit.md) ·
   [0010](../../adr/0010-frontiere-avec-les-plateformes-de-publication.md) ·
   [0011](../../adr/0011-abonnement-et-credits.md)
3. **[use-cases-et-e2e.md](use-cases-et-e2e.md)** — les nouveaux use cases et les
   parcours E2E à couvrir.

## Les chantiers, dans l'ordre

Le chantier 0 — rédaction des ADR, du PRD et du plan — est **livré par ce dossier**.

| # | Chantier | Dépend de |
|---|---|---|
| [01](01-bug-sommaire.md) | Corriger l'asymétrie de sommaire entre aperçu et export | — |
| [02](02-externalisation-prompts.md) | Externaliser les prompts des trois providers | — |
| [03](03-project-kind.md) | `ProjectKind`, création guidée, Story / Knowledge Intelligence | 02 |
| [04](04-edition.md) | Extraire l'entité `Edition` | 03 |
| [05](05-images.md) | Images dans le manuscrit et dans les exports | 03 |
| [06](06-epub.md) | Export EPUB — master et profils de sortie | 01, 04, 05 |
| [07](07-dos-et-couverture.md) | Calcul du dos et gabarit de couverture | 04 |
| [08](08-prevalidation-kdp.md) | Prévalidation avant dépôt | 04, 05 |
| [09](09-fiche-produit.md) | Fiche produit et `PlatformListing` | 04 |
| [10](10-abonnement-et-credits.md) | Abonnement Stripe et crédits d'usage | — |
| [11](11-consistency-checker.md) | Consistency Checker (Knowledge Intelligence v1) | 03 |
| [12](12-low-content.md) | Générateur low content | 04 |
| [13](13-tableaux.md) | Tableaux dans le manuscrit et les exports | 05 |
| [14](14-generation-images-ia.md) | Génération d'images par IA | 05, 10 |

Les chantiers **13** et **14** sont des lots séparés à placer **après le 10**. Le 14 en
dépend directement : les images se facturent à l'image, pas au token, donc le compteur
de crédits doit exister avant.

## Trois principes de conduite

**L'ordre n'est pas négociable sur trois arêtes.** Le 02 précède tout ce qui touche aux
prompts, sinon chaque variation coûte trois fois son écriture. Le 04 précède tout ce qui
touche à la publication, sinon le rétrofit se compte en jours. Le 01 précède le 06,
sinon l'incohérence de sommaire est figée dans un troisième format.

**Aucune estimation en jours** dans ce plan. Chaque chantier porte ses fichiers touchés,
ses tests à écrire et son critère de fin — c'est vérifiable, une estimation ne l'est pas.

**TDD, comme partout ailleurs dans ce dépôt.** Chaque chantier liste les tests
*avant* l'implémentation. Voir la compétence `tdd-cycle`.

## Documents impactés hors de ce dossier

| Fichier | Nature du changement |
|---|---|
| `.claude/philosophie.md` | **Réécrit** en même temps que ce plan |
| `CLAUDE.md` | Contexte projet : le public n'est plus « auteurs de fiction » |
| `README.md` | Promesse, tableau de positionnement, roadmap |
| `CONTEXT.md` | Vocabulaire (`Édition`, `ProjectKind`), et la phrase sur l'absence de prévalidation devient fausse au chantier 08 |
| `docs/architecture.md` | Nouvelles entités et nouvelle couche de sortie |
| `src/app/page.tsx` | Landing : accroche et positionnement |
| `src/app/conditions-generales-vente/page.tsx` | Devient faux dès qu'une offre payante existe (chantier 10) |

## Dette connue, hors programme

Deux bugs préexistants relevés pendant l'analyse, sans lien avec ce programme :

- **[#202](https://github.com/francoisnoel62/revise/issues/202)** — un projet A5 est
  étiqueté « KDP 6×9 » dans l'aperçu.
- **[#203](https://github.com/francoisnoel62/revise/issues/203)** —
  `publicationProfileId` n'est pas validé à la relecture MongoDB.

Le troisième, l'asymétrie de sommaire, est traité par le [chantier 01](01-bug-sommaire.md)
parce qu'il bloque l'EPUB.
