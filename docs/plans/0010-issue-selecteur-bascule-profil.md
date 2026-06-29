# Issue — Sélecteur de profil de publication + bascule à chaud sans perte ✅ DONE (2026-06-28)

**Phase** 3 · **Dépend de** : `0005`, `0007` · **Label** : `done`
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md), [CONTEXT.md](../../CONTEXT.md) (Profil de publication).

## Contexte
Le profil est une **lentille changeable à tout moment, dans les deux sens, sans perte** (viser KDP → passerelle pour un bêta-lecteur → revenir KDP → puis TheBookEdition). Cette issue apporte l'UI et la mécanique de bascule à chaud.

## Périmètre
**In** : sélecteur de profil dans l'éditeur ; bascule qui ré-affiche le contenu sémantique avec le nouveau profil (CSS + contraintes + barre adaptée) sans recharger ; persistance du profil actif (réglage de session/projet) ; aperçu re-paginé au nouveau trim.
**Out** : ajout de nouveaux profils (`0011`) ; preflight (`0012`).

## Critères d'acceptation
- [x] Changer de profil re-rend l'aperçu au bon trim/typo sans perte ni rechargement. *(PublicationPreview re-rend KDP 6×9 → Passerelle A4 ; TipTapToBookHtml applique le bon CSS)*
- [x] La barre d'outils s'adapte (print-ready ↔ passerelle). *(page.tsx passe `profile` à FormattingToolbar selon le profil actif)*
- [x] Les surcharges (`0009`) sont respectées (dormantes/restaurées) à la bascule. *(PublicationProfileSwitch : dormant en KDP, restaurées au retour passerelle — prouvé par TDD)*
- [x] Le profil actif est persistant et restauré à la réouverture. *(ProjectSettings.updatePublicationProfile + serializer + chargement initial dans page.tsx)*

## Ancre TDD
Tests : bascule KDP↔passerelle préserve le contenu ; l'aperçu reflète le nouveau profil ; le profil persiste. Réutiliser les propriétés d'invariance de `0009`.
