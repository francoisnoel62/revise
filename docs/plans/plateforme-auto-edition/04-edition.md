# 04 — Extraire l'entité `Edition`

**Dépend de** : 03. **Bloque** : 06, 07, 08, 09, 12.
**ADR** : [0009](../../adr/0009-editions-multiples-par-manuscrit.md)

## Ce qu'on fait

Créer une entité `Edition` — un projet en possède N — et y déplacer les réglages qui
sont propres à une sortie publiée.

| Migre vers `Edition` | Reste sur le projet |
|---|---|
| `publicationProfileId` | résumé, genre, synopsis |
| `levelStylesByProfile` | point de vue, temps, public visé |
| `tocDepth`, `tocStyle` | œuvres liées |
| `endnotesTitle` | réglages d'autocomplétion |
| `honorBlankLines` | mode d'extraction canon |
| `isbn` | dictionnaires et réglages de grammaire |
| `coverImageUrl` | intervalle de snapshots |

**Titre, sous-titre et contributeurs restent au projet** comme valeurs par défaut, et
`Edition` peut les surcharger.

Séparer par la même occasion les **deux rôles** que porte `PublicationProfileId` : le
format papier d'un côté, la capacité de pipeline de l'autre. Quatorze des seize
comparaisons littérales en production testent `passerelle`, c'est-à-dire « exporte en
DOCX et autorise les surcharges de présentation ». Cette capacité devient un attribut
déclaré de l'édition, au lieu d'être déduite d'un identifiant.

## Cache d'aperçu

La clé passe de `{projectId, profileId, ownerId}` à `{editionId, ownerId}`.
**Le cache existant est invalidé, pas migré** — il se reconstruit au premier aperçu.

Attention : `bookPreviewContentHash` **exclut délibérément le profil** du hash. Après
bascule, l'identifiant d'édition doit changer quand sa géométrie change, faute de quoi
GridFS servirait un PDF périmé.

## Fichiers touchés

Environ 25 fichiers de production. Les points sensibles :

- **Domaine** : `Edition.ts` (nouveau), `ProjectSettings.ts` (amputé), `PublicationProfile.ts`
- **Persistance** : `project-settings-serializer.ts`, un sérialiseur d'édition,
  `MongoDBBookPreviewCacheRepository.ts` (index unique et nom GridFS)
- **Application** : `UpdateProjectSettingsUseCase.ts`, des use cases d'édition,
  `bookPreviewContentHash.ts`
- **Interface** : `actions.ts`, `project-settings-actions.ts`, `book-preview-actions.ts`,
  `api/book-preview/pdf/route.ts`
- **Rendu** : `PagedRenderer.ts`, `PagedJsRenderer.ts`, `BookCssBuilder.ts`,
  `PagedPdfExporter.ts`, `BookPreviewCacheComputer.ts`, `WholeBookHtmlAssembler.ts`
- **UI** : `editor/page.tsx`, `PublicationProfileSelector.tsx`, `ExportDialog.tsx`,
  `TextEditor.tsx`, `PublicationPreview.tsx`, `LevelStylesPanel.tsx`,
  `BackgroundPageCounter.tsx`, `useBookPageOffset.ts`, `book-preview/page.tsx`

`isbn` ajoute à lui seul le chemin snapshot : `Snapshot.ts`,
`snapshot-editorial-metadata.ts`, `RestoreSnapshotUseCase.ts`,
`ProcessAutomaticSnapshotUseCase.ts`, `SnapshotComparisonDialog.tsx`.

## Migration des données

Chaque projet existant reçoit **une édition par défaut**, construite à partir de ses
réglages actuels. Aucun projet ne se retrouve sans édition. Un script de migration, sur
le modèle de `scripts/migrate-removed-publication-profiles.ts`.

## Tests à écrire d'abord

1. Un projet migré possède exactement une édition, portant ses anciens réglages.
2. Créer une deuxième édition ne modifie pas la première.
3. Une édition qui ne surcharge pas le titre hérite de celui du projet ; une édition qui
   le surcharge conserve sa propre valeur, et le projet reste inchangé.
4. Deux éditions de formats différents produisent deux entrées de cache distinctes.
5. Changer la géométrie d'une édition invalide son aperçu en cache.
6. `isbn` n'est plus capturé par les snapshots ; restaurer un snapshot ne le modifie pas.
7. Un projet `low-content` peut posséder une édition sans posséder de chapitres.

## Critère de fin

Un projet existant s'ouvre, s'exporte et s'aperçoit exactement comme avant la migration.
Un deuxième format s'ajoute sans dupliquer le manuscrit.

## Risques

C'est le chantier le plus large du programme et il touche les quatre couches. Le
découper en deux passes — d'abord l'entité et la migration, ensuite la bascule du cache —
réduit la taille de chaque revue.

L'issue **#203** (absence de validation de `publicationProfileId` à la relecture) touche
le même chemin de sérialisation. La traiter pendant ce chantier plutôt qu'en parallèle.
