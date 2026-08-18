# 13 — Tableaux dans le manuscrit et les exports

**Dépend de** : 05. **Placement** : lot séparé, après le 10.

## État vérifié

Rien n'existe. **Aucune extension table TipTap n'est installée**, `TipTapToBookHtml` n'a
aucun `case 'table'`, et `DocxExporter` n'a aucun support de tableau.

Ce qui existe déjà et qu'on croyait manquant : listes à puces, listes numérotées,
citations et blocs de code sont **déjà rendus** dans le HTML du livre
(`TipTapToBookHtml.ts:113-125`) et **déjà gérés** par le DOCX
(`DocxExporter.ts:283-286`).

## Pourquoi un lot séparé des images

Livrer images et tableaux ensemble double la surface d'un chantier qui touche déjà cinq
étages : extension d'éditeur, HTML du livre, CSS paginé, DOCX, EPUB. Deux lots
successifs se relisent ; un seul lot double ne se relit pas.

## Ce qu'on fait

Un nœud tableau avec en-tête, légende et largeurs de colonnes. Comme pour les images,
c'est la légende qui en fait un objet référençable dans un manuel.

| Sortie | Point d'attention |
|---|---|
| Éditeur | insertion, ajout et suppression de lignes et colonnes, en-tête |
| PDF paginé | **un tableau long doit se couper proprement et répéter son en-tête** |
| DOCX | l'API `Table` de la bibliothèque `docx`, déjà présente en dépendance |
| EPUB | tableau XHTML, avec les attributs d'accessibilité |

## Génération par IA

Un tableau se génère depuis du texte structuré — c'est de la génération textuelle, donc
elle passe par l'abstraction `LLMProvider` existante et se facture au token. Rien à voir
avec la génération d'images (chantier 14), qui demande une capacité nouvelle.

Comme partout ailleurs : plusieurs propositions, l'auteur choisit, rien n'est écrit sans
sa validation.

## Fichiers touchés

- `package.json` — l'extension table TipTap
- `src/components/editor/TextEditor.tsx` — chargement et barre d'outils
- `src/infrastructure/document/paged/TipTapToBookHtml.ts` — `case 'table'`
- `src/infrastructure/document/paged/BookCssBuilder.ts` — coupure et répétition d'en-tête
- `src/infrastructure/document/exporters/DocxExporter.ts` — API `Table`
- `src/infrastructure/document/exporters/EpubExporter.ts` — XHTML accessible
- `docs/prompt/` — le prompt de génération de tableau

## Tests à écrire d'abord

1. Un tableau est persisté et relu avec son en-tête, sa légende et ses largeurs.
2. Le HTML du livre émet un tableau avec en-tête distinct du corps.
3. Un tableau plus long qu'une page se coupe et **répète son en-tête** sur la page
   suivante.
4. Le DOCX contient un tableau natif, pas une image ni du texte tabulé.
5. Le tableau EPUB porte ses attributs d'accessibilité.
6. La génération produit plusieurs propositions et n'écrit rien sans validation.
7. Un manuscrit sans tableau produit exactement le même PDF qu'avant ce chantier.

## Critère de fin

Un manuel contenant un tableau de plusieurs pages s'exporte correctement en PDF, en DOCX
et en EPUB, en-tête répété.

## Risque

La répétition d'en-tête sur coupure de page est le point technique dur de Paged.js.
Vérifier sa faisabilité sur un prototype **avant** d'engager le reste du chantier — le
dépôt a déjà un précédent d'exploration isolée avec `paged-spike`.
