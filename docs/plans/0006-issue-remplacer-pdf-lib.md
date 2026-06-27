# Issue — Remplacer l'export PDF `pdf-lib` (A4) par le moteur paginé unique

**Phase** 1 · **Dépend de** : `0002`, `0005` · **Label** : `needs-triage` → `ready-for-agent` au spike vert
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md).

## Contexte
L'export PDF actuel (`src/infrastructure/document/exporters/PdfExporter.ts`) est figé en A4 / Times via `pdf-lib` — source de la divergence éditeur↔livre. Le brancher sur le `PagedRenderer` garantit la **parité d'aperçu** et un seul rendu.

## Périmètre
**In** : nouvelle voie d'export PDF via `PagedRenderer` (profil → HTML+CSS → Chromium → PDF) ; câblage dans `ExportDialog`/actions ; bascule de l'option « PDF » vers le moteur unique ; suppression progressive de `PdfExporter` (ou conservation derrière un flag le temps de la migration).
**Out** : DOCX (reste `DocxExporter`, voie passerelle refluable inchangée) ; déploiement Vercel (`0004`).

## Critères d'acceptation
- [ ] L'export PDF d'un chapitre/projet passe par le moteur paginé et respecte le profil actif.
- [ ] Parité pixel éditeur↔PDF vérifiée (réutiliser le test du spike).
- [ ] L'export DOCX (passerelle) est intact.
- [ ] Les tests existants de `PdfExporter` sont migrés ou retirés proprement (jamais supprimés juste « parce qu'ils échouent »).

## Ancre TDD
Étendre le pixel-diff à la vraie voie d'export (`exportProjectPdf`). Test : l'export d'une fixture produit un PDF dont les pages matchent l'aperçu.
