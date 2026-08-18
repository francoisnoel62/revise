# 06 — Export EPUB : un master, des profils de sortie

**Dépend de** : 01, 04, 05. **Bloque** : rien.
**ADR** : [0010](../../adr/0010-frontiere-avec-les-plateformes-de-publication.md)

## Pourquoi c'est le meilleur rapport du programme

Le plus gros du travail est déjà fait. La chaîne sépare déjà la **construction du HTML
du livre** du **rendu paginé** :

- `TipTapToBookHtml` convertit le contenu en HTML de livre
- `FrontMatterHtmlBuilder`, `TocHtmlBuilder`, `BackMatterHtmlBuilder`,
  `EndnotesHtmlBuilder` produisent les pages liminaires, le sommaire, les annexes et les
  notes
- `WholeBookHtmlAssembler.assemble()` prend des données **plates** et n'importe rien de
  `domain/entities`

Un EPUB, c'est ce HTML plus un empaquetage OPF et une navigation. Et
`DocumentExporter` est déjà une interface du domaine avec `exportProject`,
`exportChapters` et `exportChapter` — un `EpubExporter` s'y branche.

Sans EPUB, « prêt pour KDP » est **factuellement faux** : l'essentiel des ventes se fait
en numérique.

## Le master

Un fichier unique, construit à l'intersection des contraintes de toutes les plateformes :

- EPUB 3 **reflowable**
- Validation **EPUBCheck v5 sans erreur**
- Encodage **UTF-8**
- **Archive strictement manifestée** — tout fichier présent est déclaré dans l'OPF
- Table de navigation complète et exacte
- Aucune image au-delà de **2 millions de pixels**
- Aucun texte incrusté dans les images
- Aucun élément interactif, aucune zone à remplir
- Poids total **inférieur à 90 MB**
- Texte alternatif sur chaque image

Ce niveau d'exigence est celui de la plateforme la plus stricte. Le viser rend le
fichier acceptable partout.

## Les profils de sortie

Le master ne part **pas tel quel**. Chaque destination applique sa transformation :

| Destination | Transformation |
|---|---|
| KDP | dépôt du master |
| Google Play | **renommage du fichier avec l'ISBN électronique** |
| Kobo | dépôt du master, en sachant que Kobo **reconvertira** |
| Toutes | couverture rééchantillonnée à la spécification cible |

Seul le profil KDP est livré en v1. L'architecture accueille les autres sans refonte —
c'est la contrainte posée par l'ADR 0010.

## Fichiers touchés

- `src/infrastructure/document/exporters/EpubExporter.ts` — nouveau
- `src/application/rendering/` — l'assemblage réutilisé
- `src/infrastructure/config/providers.ts` — câblage
- `src/components/document/ExportDialog.tsx` — le format s'ajoute
- `src/application/use-cases/ExportDocumentUseCase.ts` et `ExportProjectUseCase.ts`

## Tests à écrire d'abord

1. Un EPUB produit passe EPUBCheck v5 **sans erreur**. Ce test conditionne tous les
   autres.
2. Chaque fichier de l'archive est déclaré au manifeste.
3. La navigation reflète la structure des chapitres et le `tocDepth` de l'édition.
4. Les notes de fin deviennent des liens de navigation valides.
5. Les images sont incluses comme ressources, avec leur texte alternatif.
6. Une image au-delà de 2 M pixels déclenche un avertissement avant export.
7. Un livre dépassant 90 MB déclenche un avertissement avant export.
8. **Le sommaire de l'EPUB, du PDF et de l'aperçu ont la même structure** — c'est ce que
   le chantier 01 rend possible.

## Critère de fin

Un manuscrit non-fiction illustré produit un EPUB qui passe EPUBCheck v5 sans erreur, et
dont le sommaire coïncide avec celui du PDF.

## Risques

EPUBCheck doit tourner en test. S'il n'est pas disponible hors ligne dans
l'environnement de CI, la validation devient déclarative et perd tout son intérêt —
vérifier ce point **avant** de commencer.

Les versions EPUB acceptées par Google et Apple sont **contradictoires entre leurs
propres pages officielles**. Ne rien coder en dur sur la foi de la recherche menée : voir
les incertitudes listées dans le [PRD](PRD.md).
