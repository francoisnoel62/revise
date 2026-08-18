# 05 — Images dans le manuscrit et dans les exports

**Dépend de** : 03. **Bloque** : 06, 08, 13, 14.

## État vérifié

Il n'existe **aucun support d'image dans le manuscrit**. Les extensions TipTap chargées
dans `TextEditor.tsx` sont : StarterKit, Highlight, Placeholder, TextStyle, FontFamily,
FontSize, TextAlign, CharacterCount, IndentHeading, EndnoteRef, Autocomplete. Pas
d'`Image`. Et `TipTapToBookHtml` n'a aucun `case` pour un nœud image.

Ce qui existe et sert : `VercelBlobStorage` est déjà en place et utilisé pour la
couverture de projet ; `DocxExporter` importe et emploie déjà `ImageRun` (pour la page
de couverture) — le chemin Word est donc connu, il reste à l'étendre aux images en flux.

## Ce qu'on fait

Le nœud image porte, en plus de sa source : une **légende**, un **texte alternatif**,
une **largeur relative** et un **alignement**. La légende fait de l'ensemble une
**figure** — c'est le rôle sémantique qui compte dans un guide, pas l'image nue.

Quatre sorties à couvrir :

| Sortie | Point d'attention |
|---|---|
| Éditeur | insertion, redimensionnement, saisie de légende et d'alternatif |
| PDF paginé | **une figure ne doit pas être coupée par un saut de page** |
| DOCX | `ImageRun` plus un paragraphe de légende |
| EPUB | ressource du paquet, référencée depuis le XHTML (chantier 06) |

Le stockage passe par `BlobStorage`, avec suppression des fichiers orphelins quand
l'image est retirée du manuscrit ou le projet supprimé.

## Contraintes à intégrer dès la conception

- **300 DPI minimum** à la taille imprimée, 600 recommandé au maximum. Une image nette à
  l'écran peut être floue à l'impression : c'est le piège le plus courant, et il se
  détecte au moment de l'insertion, pas au moment du dépôt.
- **2 millions de pixels maximum** par image pour rester distribuable partout.
- Poids total du livre sous **90 MB**.
- Un **texte alternatif** est requis pour l'accessibilité EPUB.

## Fichiers touchés

- `src/components/editor/extensions/` — l'extension image
- `src/components/editor/TextEditor.tsx` — chargement et barre d'outils
- `src/infrastructure/document/paged/TipTapToBookHtml.ts` — `case` image et figure
- `src/infrastructure/document/paged/BookCssBuilder.ts` — règles de saut de page
- `src/infrastructure/document/exporters/DocxExporter.ts` — images en flux
- `src/infrastructure/storage/VercelBlobStorage.ts` — réutilisé
- Un use case d'upload et un de suppression, sur le modèle de `DeleteCoverImageUseCase`

## Tests à écrire d'abord

1. Une image insérée est persistée et relue avec sa légende, son alternatif, sa largeur
   et son alignement.
2. Le HTML du livre émet une figure avec sa légende.
3. Le CSS empêche la coupure d'une figure entre deux pages.
4. Le DOCX contient l'image et sa légende dans le bon ordre.
5. Une image sous 300 DPI à sa taille imprimée déclenche un avertissement, **pas un
   blocage** — c'est l'auteur qui décide.
6. Retirer une image du manuscrit supprime le blob associé.
7. Un manuscrit sans image produit exactement le même PDF qu'avant ce chantier.

## Critère de fin

Un guide illustré s'affiche correctement dans l'éditeur, dans l'aperçu paginé et dans le
DOCX, sans figure coupée.

## Risques

La pagination est le point dur. Paged.js gère mal les éléments flottants de grande
taille ; prévoir une mesure de performance sur un document contenant plusieurs dizaines
d'images, dans `tests/performance/`.

Le calcul du DPI effectif suppose de connaître la taille imprimée, donc le format de
l'édition. D'où la dépendance au chantier 04.
