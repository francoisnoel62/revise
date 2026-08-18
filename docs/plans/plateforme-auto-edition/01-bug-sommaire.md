# 01 — Corriger l'asymétrie de sommaire entre aperçu et export

**Dépend de** : rien. **Bloque** : le chantier 06 (EPUB).

## Le problème

Le sommaire du PDF exporté ne correspond pas à celui de l'aperçu du livre entier. Un
auteur qui règle son sommaire, le vérifie à l'écran puis exporte obtient autre chose.

Cause vérifiée : `src/app/actions.ts:226-231` ne transmet ni `tocDepth` ni `tocStyle` à
l'export. `PagedPdfExporter` recalcule alors sa propre règle de sommaire
(`PagedPdfExporter.ts:143-148`) et n'envoie jamais `tocStyle` au renderer (`:150-160`),
qui retombe sur `classique` (`PagedRenderer.ts:48`). Le chemin d'aperçu, lui, les
transmet correctement (`book-preview-actions.ts:148-149`).

## Pourquoi maintenant

L'EPUB réutilisera `TocHtmlBuilder`. Livrer l'EPUB avant cette correction figerait
l'incohérence dans un troisième format, et la corriger ensuite demanderait de la
corriger trois fois.

## Ce qu'on fait

Transmettre `tocDepth` et `tocStyle` depuis les réglages jusqu'à `PagedPdfExporter`, et
supprimer la règle de sommaire recalculée localement dans l'exporter au profit de celle
qui vient des réglages. Un seul chemin de décision pour le sommaire, quel que soit le
format de sortie.

## Fichiers touchés

- `src/app/actions.ts` — transmettre les deux réglages
- `src/infrastructure/document/exporters/PagedPdfExporter.ts` — consommer les réglages,
  retirer la règle locale
- `src/domain/interfaces/DocumentExporter.ts` — `ExportOptions` accueille `tocDepth` et
  `tocStyle`

## Tests à écrire d'abord

1. Un export PDF avec `tocStyle` non par défaut produit un sommaire de ce style.
2. Un export PDF avec `tocDepth` restreint n'émet pas les niveaux exclus.
3. **Test d'égalité** : pour un même projet et les mêmes réglages, la structure de
   sommaire produite par le chemin d'aperçu et par le chemin d'export est identique.
   C'est le test qui empêche la régression de revenir.

## Critère de fin

Le test d'égalité passe. Aucun réglage de sommaire n'est lu à deux endroits différents.

## Risque

Des projets existants ont pu être exportés avec le sommaire `classique` par défaut et
leurs auteurs s'y sont habitués. Le changement est visible. Il est correct, mais il
mérite une ligne au changelog.
