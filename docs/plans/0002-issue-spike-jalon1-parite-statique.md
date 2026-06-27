# Issue — Spike J1 : parité statique KDP 6×9 (pixel-diff)

**Phase** 0 (spike) · **Dépend de** : — · **Label** : `ready-for-agent`
**Détail complet** : [`0001-spike-editeur-apercu-kdp-parite-pixel.md`](0001-spike-editeur-apercu-kdp-parite-pixel.md) (Jalon 1). Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md).

## Contexte
Prouver l'architecture « moteur de rendu paginé unique » : l'éditeur paginé et le PDF exporté sont produits par le **même** moteur HTML/CSS (Paged.js + Chromium), donc identiques au pixel. Périmètre minimal : profil KDP 6×9, un chapitre figé, styles Corps + Titre de chapitre.

## Périmètre
**In** : profil KDP 6×9 (donnée unique) ; CSS « livre » (`@page` 6×9, marges miroir, `@font-face` EB Garamond, retrait 0,8 cm, interligne 1,15) ; JSON TipTap → HTML (`@tiptap/html`) → Paged.js ; route `/editor/paged-spike` (aperçu) ; export PDF serveur via Playwright/Chromium + Paged.js ; test pixel-diff.
**Out** : édition vivante (→ J2), multi-profils, bascule, surcharges, liminaires/TOC, numérotation livre-entier, déploiement Vercel.

## Critères d'acceptation
- [ ] Un chapitre-fixture figé est rendu en pages KDP 6×9 dans l'aperçu éditeur.
- [ ] Le PDF est généré par le même HTML+CSS+Paged.js côté serveur.
- [ ] Le test pixel-diff (page N éditeur vs page N PDF) passe sous le seuil de tolérance.
- [ ] L'export `pdf-lib` existant n'est pas cassé.
- [ ] Coutures posées : `PublicationProfile` (domaine), `BookCssBuilder`, `TipTapToBookHtml`, interface `PagedRenderer` (une impl, aperçu + export).

## Ancre TDD (test rouge d'abord)
Test E2E Playwright **pixel-diff** : rend l'aperçu éditeur + le PDF par le même pipeline, rasterise la page PDF (`pdfjs-dist`), compare (`pixelmatch`/`pngjs`), échoue si écart > seuil. Écrire ce test AVANT toute implémentation.

## Notes
- Dépendances à ajouter : `pagedjs`, EB Garamond (woff2/ttf) ; tests : `pdfjs-dist`, `pixelmatch`, `pngjs`.
- Même DPR des deux côtés pour éviter la flakiness anti-aliasing.
