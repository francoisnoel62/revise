# 12 — Générateur low content

**Dépend de** : 04. **Bloque** : rien.
**ADR** : [0008](../../adr/0008-trois-types-de-projet.md)

> **Offre secondaire, assumée comme telle.** La valeur du produit est dans le medium
> content. Ce chantier existe pour couvrir le besoin, pas pour y concentrer l'effort.

## Ce que dit la distribution

Avant de construire, savoir ce que le marché accepte :

- **Kobo** refuse explicitement journaux, carnets, planners et workbooks
- **Draft2Digital** les refuse, en numérique **et** en imprimé
- **Lulu** signale qu'Amazon et Ingram n'acceptent ni livres de coloriage, ni journaux,
  ni agendas, ni workbooks, ni livres à nombreuses pages blanches ou lignées
- **KDP** les exclut de l'Expanded Distribution, limite à **10 titres par format et par
  semaine**, et annonce jusqu'à **10 jours ouvrés** de délai de publication
- Le même contenu ne peut pas être **excessivement réutilisé** d'un livre à l'autre

Le low content ne se vend donc qu'en direct, sur peu de canaux. **Ces limites doivent
être dites à l'auteur dans le produit**, pas découvertes après un refus.

## Ce qu'on fait

Une entité **séparée** de `Project` et `Chapter` — un carnet de 120 pages n'est pas 120
chapitres. Elle porte : un gabarit, un nombre de pages, une édition (donc un format), et
les options du gabarit.

Cinq gabarits en v1, délibérément peu :

1. Ligné
2. Pointillé
3. Quadrillé
4. Vierge
5. Planner hebdomadaire

Les gabarits sont du HTML et du CSS. Le moteur les rend déjà.

## Ce que l'analyse de couplage autorise

La couche de rendu ne connaît **aucune entité** : `PagedRenderer.render()` prend
`bodyHtml: string` et un `PublicationProfile`. Un intérieur généré alimente donc le
moteur directement, sans projet factice. Un chemin sans domaine existe même déjà, câblé
en développement : `src/app/api/paged-spike/export/route.ts`.

Trois contraintes en découlent, à traiter dans le générateur :

- Le script de folios cherche `section.chapter[id]` pour situer le début du corps
  (`PagedJsRenderer.ts:90`, `:98-101`). **Sans ce marqueur, toutes les pages reçoivent un
  folio arabe.** Le générateur fournit ses propres conventions de numérotation.
- L'extraction des métriques de cache lit `data-chapter-id`
  (`BookPreviewCacheComputer.ts:152-164`) : un intérieur sans chapitres produit
  `chapterOffsets: []` et `frontMatterPageCount: 0`. **Vérifier que
  `BookPreviewCacheEntry` accepte ces valeurs** — ce point n'a pas été confirmé.
- Le CSS suppose `.chapter { break-before: right }` (`BookCssBuilder.ts:260-263`). Le
  gabarit fournit ses propres règles de saut.

## Aucune IA

Ce mode ne consomme **aucun token**. C'est aussi ce qui le rend rentable : sa marge ne
dépend d'aucun fournisseur.

## Fichiers touchés

- `src/domain/entities/LowContentBook.ts` — nouveau
- `src/domain/value-objects/PageTemplate.ts` — nouveau
- `src/application/services/LowContentInteriorGenerator.ts` — nouveau
- `src/infrastructure/document/paged/` — CSS des gabarits, conventions de folio
- `src/components/` — le choix de gabarit et l'aperçu

## Tests à écrire d'abord

1. Un carnet de N pages produit exactement N pages.
2. Chaque gabarit produit le motif attendu, mesurable dans le HTML généré.
3. Un planner hebdomadaire daté produit la bonne séquence de dates, y compris à cheval
   sur un changement d'année.
4. Le PDF respecte le format de l'édition, fonds perdus compris.
5. Aucun appel IA n'est émis sur ce chemin — assertion explicite.
6. Les folios suivent les conventions du gabarit, pas celles du corps de manuscrit.
7. **Budget de performance** : la génération et le rendu d'un carnet de 200 pages
   restent sous un seuil chiffré, dans `tests/performance/`.

## Critère de fin

Un carnet de 120 pages en 6×9 produit un PDF conforme, dans un temps mesuré et
documenté.

## Risque

**La performance n'est pas mesurée à ce jour.** Rendre 200 pages via Chromium et Paged.js
est un profil de charge différent de l'aperçu actuel, mis en cache par `contentHash`.
Mesurer **avant** de promettre : le dépôt dispose de `tests/performance/` et de
`vitest.performance.config.ts`, prévu précisément pour que les durées mesurent le code et
non la contention CPU.
