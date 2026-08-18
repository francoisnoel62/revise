# Un manuscrit, plusieurs éditions

Un auteur auto-publié professionnel publie le même texte en broché, en relié et en
ebook — parfois en plusieurs formats de page, parfois sur plusieurs marchés. Chacune de
ces sorties a son propre ISBN, son prix, son format, sa largeur de dos, sa couverture
et sa fiche produit.

`ProjectSettings` ne porte aujourd'hui **qu'un seul** `isbn` et **qu'un seul**
`publicationProfileId`. Toutes les fonctionnalités de publication à venir — calcul du
dos, prévalidation, fiche produit, simulation de redevances — se retrouveraient
coincées sur un objet qui n'en accepte qu'un exemplaire.

Nous introduisons une entité **`Edition`**, distincte du projet. Un projet possède N
éditions.

## Répartition des champs

Migrent de `ProjectSettings` vers `Edition` :

| Champ | Motif |
|---|---|
| `publicationProfileId` | le format est propre à l'édition |
| `levelStylesByProfile` | typographie par profil, donc par édition |
| `tocDepth`, `tocStyle` | réglage de rendu |
| `endnotesTitle` | réglage de rendu |
| `honorBlankLines` | son seul effet est une règle CSS du rendu paginé |
| `isbn` | un ISBN par édition, par définition |
| `coverImageUrl` | chaque format a sa couverture |

Restent au projet : résumé, genre, synopsis, point de vue, temps, public visé, œuvres
liées, réglages d'autocomplétion, mode d'extraction canon, dictionnaires, réglages de
grammaire, intervalle de snapshots.

**Titre, sous-titre et contributeurs restent au projet** comme valeurs par défaut, et
l'édition peut les **surcharger** — une édition destinée à un autre marché porte un
autre titre.

## Coût mesuré

Environ 25 fichiers de production, répartis sur les quatre couches : entité,
sérialiseur et use case ; trois modules de server actions ; sept fichiers de la chaîne
de rendu ; huit composants d'interface plus `editor/page.tsx` ; trois fichiers de cache
et de route.

`isbn` ajoute à lui seul cinq fichiers, parce qu'il est aujourd'hui capturé et restauré
par le chemin snapshot (`Snapshot.ts`, `snapshot-editorial-metadata.ts`,
`RestoreSnapshotUseCase.ts`, `ProcessAutomaticSnapshotUseCase.ts`,
`SnapshotComparisonDialog.tsx`) — alors qu'aucun autre champ de publication ne l'est.
Cette incohérence préexiste ; l'extraction est l'occasion de la résoudre.

## Cache d'aperçu

La clé actuelle est `{projectId, profileId, ownerId}` — index unique dans
`MongoDBBookPreviewCacheRepository`, et nom de fichier GridFS
`${projectId}::${profileId}::${ownerId}`. Elle devient `{editionId, ownerId}`.

Le cache existant est **invalidé, pas migré** : il se reconstruit au premier aperçu, et
écrire une migration coûterait plus cher que le recalcul.

Point de vigilance relevé dans le code : `bookPreviewContentHash` **exclut délibérément
le profil** du hash (commentaire explicite à l'appui). Avec des formats paramétrables,
réutiliser un identifiant pour une géométrie différente servirait un PDF périmé depuis
GridFS. La bascule vers `editionId` résout ce risque, à condition que l'identifiant
d'édition change quand sa géométrie change.

## Un identifiant qui porte deux rôles

`PublicationProfileId` encode aujourd'hui **deux choses** : un format papier et un mode
de pipeline. Sur les seize comparaisons littérales en production, **quatorze testent
`passerelle`** — c'est-à-dire « ce projet s'exporte en DOCX et autorise les surcharges
de présentation ». Deux seulement testent une géométrie.

La géométrie, elle, est déjà paramétrique : `BookCssBuilder` ne lit que `profile.values`
et accepte des dimensions arbitraires. Le vrai point de rigidité n'est donc pas
« rendre les formats libres » mais **séparer le format de la capacité de pipeline**.
L'édition porte le format ; la capacité (paginé ou passerelle) devient un attribut
déclaré, non déduit d'un identifiant.

## Considered Options

**Garder un seul jeu de réglages et dupliquer le projet par format.** Rejeté : le
manuscrit serait dupliqué avec lui, et deux copies divergent.

**Attendre d'avoir besoin des éditions.** Rejeté : c'est la seule décision de ce
programme dont le rétrofit se compte en jours plutôt qu'en heures.

## Liens

- PRD : [plateforme-auto-edition/PRD.md](../plans/plateforme-auto-edition/PRD.md)
- ADR liés : [0008](0008-trois-types-de-projet.md),
  [0010](0010-frontiere-avec-les-plateformes-de-publication.md)
- Chantier : [04](../plans/plateforme-auto-edition/04-edition.md)
- Issue liée : #203 (`publicationProfileId` non validé à la relecture)
