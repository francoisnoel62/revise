# 09 — Fiche produit et `PlatformListing`

**Dépend de** : 04. **Bloque** : rien.
**ADR** : [0010](../../adr/0010-frontiere-avec-les-plateformes-de-publication.md)

## État vérifié

`ProjectSettings` porte déjà une bonne part d'une fiche produit : `title`, `subtitle`,
`summary`, `genre`, `isbn`, `contributors`, `relatedWorks`, `targetAudience`,
`coverImageUrl`.

Il manque ce qui fait vendre : les **mots-clés**, les **catégories BISAC**, la
**description longue**, la **langue**, la **série et son numéro de tome**, l'**édition**,
le **prix par marché**.

Attention : `ProjectMetadata` **n'est pas** une fiche produit — c'est le résultat des
analyses de manuscrit. Ne pas confondre les deux entités.

## Le modèle : canonique plus overlay

Une fiche unique ne suffit pas. Environ 80 % des champs sont communs à toutes les
plateformes, mais chacune impose ses règles :

- Les **catégories** : BISAC sert de pivot, mais Apple a sa propre taxonomie — donc un
  mapping.
- Le **titre** : Lulu impose une casse de type *title case*, avec liste d'exceptions, et
  **rejette** ce qui ne s'y conforme pas.
- Les **mots-clés** : Draft2Digital les veut **classés par ordre d'importance**, beaucoup
  de revendeurs ne lisant que le premier.
- La **description** : la mise en forme autorisée diffère, et **aucune limite de
  caractères n'a pu être confirmée** sur la plupart des plateformes.
- L'**ISBN** : ce n'est pas un champ mais **un champ par (œuvre × format × plateforme)**,
  avec quatre régimes différents selon les plateformes.

D'où : une entité canonique portée par l'édition, et un `PlatformListing` par
destination qui porte le mapping, les transformations et l'identifiant.

Seul le listing KDP est livré en v1.

## Ce qu'on fait

- Étendre la fiche canonique aux champs manquants
- Créer `PlatformListing`, avec KDP comme première implémentation
- Générer une proposition de description, de mots-clés et de catégories **depuis le
  manuscrit**, en plusieurs variantes que l'auteur choisit et édite

La génération est une proposition, jamais un remplissage automatique : l'auteur valide
avant que quoi que ce soit soit retenu.

## Fichiers touchés

- `src/domain/entities/ListingMetadata.ts` et `PlatformListing.ts` — nouveaux
- `src/data/bisac-categories.ts` — référentiel
- `src/application/use-cases/` — génération et persistance, sur le modèle de
  `GenerateMetadataUseCase` qui est déjà paramétré par un `MetadataTypeConfig`
- `docs/prompt/listing/` — les prompts, externalisés dès le départ (chantier 02)
- `src/components/publish/` — l'écran de fiche produit

## Tests à écrire d'abord

1. La fiche canonique persiste et relit tous ses champs.
2. Un `PlatformListing` KDP dérive ses valeurs de la fiche canonique et applique ses
   transformations.
3. Les mots-clés conservent leur ordre.
4. Une catégorie BISAC inconnue est rejetée, pas silencieusement ignorée.
5. La génération produit **plusieurs variantes** et n'écrit rien sans validation
   explicite de l'auteur.
6. Éditer un champ après génération ne le fait pas écraser au rafraîchissement suivant —
   c'est la règle « l'édition de l'auteur l'emporte », déjà appliquée ailleurs dans le
   produit.

## Critère de fin

Un auteur remplit sa fiche produit KDP depuis Revise, avec des propositions issues de son
manuscrit, et copie chaque champ dans le formulaire KDP sans avoir à le réécrire.

## Risque

Les limites de caractères des descriptions **n'ont pas pu être confirmées**. Ne pas les
coder en dur sur la base d'estimations : mesurer et afficher le compteur, sans imposer un
plafond inventé.
