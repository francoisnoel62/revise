# Issue — Profils additionnels (A5, autres trims KDP, passerelle Word/Docs)

**Phase** 3 · **Dépend de** : `0005`, `0010` · **Label** : `ready-for-agent`
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md) (questions ouvertes).

## Contexte
Étendre le catalogue de profils au-delà de KDP 6×9, une fois l'abstraction `PublicationProfile` stable. Chaque profil = une donnée (trim + marges + typo + règles), pas du code.

## Périmètre
**In** : presets A5, autres trims KDP courants (5×8, 5,25×8, 5,5×8,5…), profil **passerelle Word/Docs** (A4 confort, refluable) ; où vit la définition de chaque cible (catalogue de profils).
**Out** : profils marketplaces spécifiques + preflight (`0012`).

## Critères d'acceptation
- [x] Chaque profil ajouté est une donnée déclarative, sans logique dédiée.
- [x] L'aperçu et l'export honorent chaque profil (parité conservée).
- [x] Le profil passerelle produit un rendu A4 confort refluable.

## Ancre TDD
Pour chaque preset : test que `BookCssBuilder` émet la CSS attendue (trim/marges) et que l'aperçu paginate au bon format. Test de non-régression de parité par profil.
