# 07 — Calcul du dos et gabarit de couverture

**Dépend de** : 04. **Bloque** : rien.

## Pourquoi c'est le chantier le plus dé-risqué du programme

L'entrée difficile est **déjà calculée et persistée** : `BookPreviewCacheEntry` stocke
`totalPageCount`, par profil, avec invalidation par `contentHash`.

Et les formules sont **entièrement spécifiées** par KDP :

| Papier | Épaisseur par page |
|---|---|
| Blanc | `pages × 0,002252"` |
| Crème | `pages × 0,0025"` |
| Groundwood | `pages × 0,00235"` |
| Couleur | `pages × 0,002347"` |

```
Largeur de couverture = fond perdu + dos arrière + dos + dos avant + fond perdu
Hauteur de couverture = fond perdu + hauteur de coupe + fond perdu
fond perdu = 0,125"
```

Deux règles supplémentaires confirmées : KDP n'imprime du texte sur le dos qu'au-delà de
**79 pages**, et il arrondit le nombre de pages **au pair supérieur**.

Aucune IA, aucune infrastructure nouvelle, aucun appel réseau. Du calcul.

## Ce qu'on fait

Un service de domaine qui, depuis une édition, produit :

- la **largeur du dos** en pouces et en millimètres
- les **dimensions complètes** du gabarit de couverture, fonds perdus compris
- un **gabarit téléchargeable** (PNG et PDF) matérialisant les zones : dos arrière, dos,
  dos avant, marges de sécurité, zone du code-barres
- un avertissement quand le livre a moins de 80 pages, puisque le dos restera vierge

Le gabarit est destiné à être ouvert dans un outil graphique. Revise ne fabrique pas la
couverture ; il donne les bonnes dimensions, ce qui est précisément l'angoisse que les
auteurs décrivent.

## Un point de vigilance sur les données

La recherche n'a **pas pu distinguer** le multiplicateur du *standard color* de celui du
*premium color* : la ligne « couleur » obtenue ne fait pas la différence. Ne pas
supposer que `0,002347"` s'applique aux deux. Tant que ce point n'est pas vérifié
directement, n'exposer que les papiers dont le multiplicateur est confirmé — blanc,
crème, groundwood — et signaler la couleur comme non prise en charge plutôt que de
produire un dos peut-être faux.

Les multiplicateurs vivent dans **un seul fichier de données**, daté et sourcé, jamais
dispersés dans le code.

## Fichiers touchés

- `src/domain/services/SpineCalculator.ts` — nouveau
- `src/data/kdp-paper-specs.ts` — table datée et sourcée
- Un use case de génération de gabarit
- `src/components/publish/` — l'écran et le téléchargement
- `src/domain/entities/BookPreviewCacheEntry.ts` — lecture de `totalPageCount`

## Tests à écrire d'abord

1. Pour chaque papier confirmé, la largeur du dos correspond à la formule publiée.
2. Un nombre de pages impair est arrondi au pair supérieur avant calcul.
3. Un livre de moins de 80 pages produit le gabarit **et** l'avertissement « pas de texte
   sur le dos ».
4. Les dimensions totales incluent les deux fonds perdus, sur les deux axes.
5. Un papier non confirmé (couleur) est refusé explicitement, pas approximé.
6. Le gabarit produit est aux dimensions annoncées, au pixel près pour le PNG et au point
   près pour le PDF.
7. Changer le nombre de pages du manuscrit change la largeur du dos au recalcul suivant.

## Critère de fin

Un auteur télécharge un gabarit aux dimensions exactes de son livre, sans avoir rien
calculé.

## Risque

`totalPageCount` provient du cache d'aperçu. Si le cache est absent ou périmé, le dos
sera faux. Le service doit **exiger un aperçu à jour** et le déclencher sinon — jamais
calculer sur une valeur obsolète.
