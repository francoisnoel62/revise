# Issue — Couche de surcharges de présentation (profil passerelle) ✅ DONE (2026-06-28)

**Phase** 2 · **Dépend de** : `0007` · **Label** : `done`
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md), [CONTEXT.md](../../CONTEXT.md) (Surcharge de présentation).

## Contexte
En profil passerelle, l'auteur peut forcer police/taille/alignement. Ces **surcharges sont une couche séparée non destructive** : stockées à part, ignorées par les profils print-ready (qui rendent le sémantique pur), et restituées au retour en passerelle. Aucun aller-retour destructif.

## Périmètre
**In** : modèle de stockage des surcharges (scopées passerelle), API d'application/retrait ; le `PagedRenderer` les applique en passerelle et les ignore en print-ready ; persistance.
**Out** : l'UI de bascule (`0010`) ; la barre (`0008`).

## Critères d'acceptation
- [x] Poser une surcharge en passerelle puis basculer en KDP : rendu sémantique pur, **aucune perte** de la surcharge. *(prouvé par PublicationProfileSwitch.test : `printReady.content === semanticContent` + overrides dormantes — #129 ✅)*
- [x] Rebasculer en passerelle : la surcharge réapparaît à l'identique. *(prouvé par PublicationProfileSwitch.test : `restored.overrides === dormantOverrides` — #129 ✅)*
- [x] Les surcharges n'altèrent jamais le contenu sémantique de base. *(prouvé par TDD — 28 tests)*
- [x] Le contenu reste exportable proprement dans les deux profils. *(BookCssBuilder + TipTapToBookHtml câblés au profil actif — #129 ✅)*

## Ancre TDD
Tests unitaires de l'aller-retour : `appliquer surcharge → basculer strict → rendu sans surcharge → rebasculer → surcharge restaurée`. Propriété : le contenu sémantique de base est invariant par ces opérations.
