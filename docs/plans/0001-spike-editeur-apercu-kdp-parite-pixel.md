# Plan — Spike « Éditeur-aperçu KDP 6×9, parité pixel »

> Décision d'architecture : voir [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md).
> Vocabulaire : voir [CONTEXT.md](../../CONTEXT.md), section « Mise en page et publication ».

## Objectif

Prouver, sur un périmètre minimal, l'architecture « **moteur de rendu paginé unique** » qui pilote à la fois l'éditeur et l'export, avec **parité d'aperçu au pixel** entre l'éditeur paginé et le PDF exporté. Cible unique : **KDP 6×9**, un chapitre, styles sémantiques minimaux (Corps + Titre de chapitre).

Ce spike lève les deux risques majeurs **un à la fois** :
1. **Parité statique** — un chapitre figé rendu identique éditeur ↔ PDF.
2. **Re-pagination vivante** — taper, faire une pause, re-paginer sans lag.

Tout est en **TDD strict** (test en échec d'abord), Clean Architecture respectée, sans casser l'export `pdf-lib` existant.

## Spec KDP 6×9 (source : `DocxExporter.ts`)

| Paramètre | Valeur | Constante d'origine |
|---|---|---|
| Trim | 6″ × 9″ | `KDP_PAGE_WIDTH 8640` twips |
| Marge intérieure (gouttière) | 2 cm | `KDP_MARGIN_INSIDE 1134` |
| Marge extérieure | 1,5 cm | `KDP_MARGIN_OUTSIDE 851` |
| Marges haut / bas | 1,8 cm | `KDP_MARGIN_TOP/BOTTOM 1021` |
| Retrait 1ʳᵉ ligne | 0,8 cm | `KDP_FIRST_LINE_INDENT 454` |
| Interligne | 1,15× | `KDP_LINE_SPACING 276` |
| Corps | Garamond 11 pt | `KDP_BODY_FONT` |
| Titre de chapitre | 14 pt centré noir | preset `kdp` |

Marges **miroir** (recto/verso) → CSS `@page :left` / `@page :right`.

## Fondations (avant le premier test)

- **Dépendances runtime** : `pagedjs` (pagination CSS « paged media », exécuté côté navigateur **et** côté serveur via Chromium).
- **Dépendances de test** : réutiliser `@playwright/test` (déjà présent) pour le rendu Chromium serveur + capture ; ajouter `pdfjs-dist` (rasteriser les pages PDF), `pixelmatch` + `pngjs` (diff pixel).
- **Police** : embarquer **EB Garamond** (woff2 + ttf) + `@font-face`. Choix assumé : le DOCX déclare un « Garamond » générique résolu par Word ; en contrôlant EB Garamond nous-mêmes, le rendu devient **déterministe des deux côtés** — condition nécessaire à la parité pixel.
- **Profil = donnée unique** : value object `PublicationProfile` (domaine) portant la spec ci-dessus, **consommé à la fois par la CSS de l'éditeur et par l'export**. C'est la matérialisation concrète du « moteur unique ».

## Jalon 1 — Parité statique (preuve d'architecture)

1. **🔴 Test d'abord — le pixel-diff (ancre TDD du spike).**
   Test Playwright qui :
   - rend un **chapitre-fixture figé** (JSON TipTap connu) via Paged.js + CSS KDP ;
   - capture la page *N* de l'aperçu éditeur ;
   - génère le PDF par le **même** HTML/CSS (Chromium Playwright + Paged.js → `page.pdf()`) ;
   - rasterise la page *N* du PDF (`pdfjs-dist`) ;
   - **échoue si l'écart pixel > seuil** (`pixelmatch`).
   Rouge : rien n'existe encore.

2. **🟢 Vert.**
   - CSS « livre » : `@page` 6×9, marges miroir (`:left`/`:right`), `@font-face` EB Garamond, styles Corps + Titre de chapitre, retrait 0,8 cm, interligne 1,15.
   - Module de rendu : JSON TipTap → HTML (via `@tiptap/html`, **déjà dans les deps**) → enrobage CSS → Paged.js.
   - Route spike `/editor/paged-spike` rendant la fixture (côté aperçu éditeur).
   - Export serveur : même HTML+CSS → Playwright/Chromium + Paged.js → buffer PDF. Parité **par construction** (même moteur, même CSS).
   - Ajuster le seuil (proche de zéro attendu). **Test vert = archi prouvée.**

3. **♻️ Refactor — poser les coutures (Clean Architecture).**
   - `PublicationProfile` (domaine) — preset KDP 6×9.
   - `BookCssBuilder` (infrastructure) — profil → CSS.
   - `TipTapToBookHtml` (infrastructure) — JSON → HTML sémantique.
   - interface `PagedRenderer` à **une seule** implémentation servant l'aperçu **et** l'export.
   - `pdf-lib` reste intact (l'export existant ne casse pas).

## Jalon 2 — Re-pagination vivante (preuve de perf)

4. **🔴 Test d'abord — budget de perf.**
   - Rendre la route éditable (TipTap) ; à la **pause de frappe (~300 ms débounce)**, le contenu repasse dans Paged.js.
   - Test : frappe dans un chapitre réaliste (~4 000 mots) ; assert que la re-pagination à la pause tient **sous un budget chiffré** (< 900 ms, décision humaine du 2026-06-27) et que le curseur reste correct.
   - Test : ajouter du texte qui déborde une page ⇒ le curseur passe à la page suivante.
   Rouge.

5. **🟢 Vert.**
   - Re-pagination débouncée : édition en flux + aperçu Paged.js re-rendu à la pause. (Le « taper directement sur les pages » viendra après ; le spike mesure d'abord que Paged.js tient le budget.)
   - Mesurer, régler le débounce.

6. **♻️ Refactor + décision.**
   - Consigner les résultats dans l'ADR 0005 (section « Premier incrément — résultats ») : Paged.js tient-il le budget vivant ?
   - Sinon, fallback documenté (paginateur ProseMirror custom) — en notant que ça **rouvrirait la question de parité** (le moteur d'export devrait répliquer ses règles).

## Différé (hors spike — noté dans l'ADR)

- **Déploiement Chromium sur Vercel** (`@sparticuz/chromium` ou service de rendu dédié) — **risque #1 de mise en production**, à traiter juste après le spike vert.
- Multi-profils (A5, autres trims KDP, BoD, TheBookEdition…) · bascule de profil · surcharges de présentation · liminaires/TOC générés · numérotation livre-entier (offsets cachés) · preflight de validation.

## Risques & parades

- **Vercel / Chromium serverless** : différé ; le spike tourne en local/CI via Playwright. À flaguer dès le Jalon 1 vert.
- **Maturité Paged.js + édition vivante** : risque central du Jalon 2 → d'où le séquencement (prouver la parité avant d'y investir).
- **Flakiness pixel-diff** (anti-aliasing / subpixel) : même DPR des deux côtés + petit seuil de tolérance.
- **Marges miroir recto/verso** : `@page :left` / `:right` de Paged.js.

## Règles de chantier

- TDD strict : test rouge d'abord à chaque étape, y compris le spike.
- ABOUTME en tête de chaque fichier (hook `check-edit`).
- Commits fréquents ; jamais `git add .` / `git add -A` (hook `guard-bash`) — stager par nom.
- UI sans logique métier ; `ownerId` filtré dans tout repository (non concerné ici, mais rappel).
- `npm run verify` (lint → tests → build) avant tout commit de fin d'étape.
