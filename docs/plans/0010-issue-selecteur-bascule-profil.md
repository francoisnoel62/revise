# Issue — Sélecteur de profil de publication + bascule à chaud sans perte

**Phase** 3 · **Dépend de** : `0005`, `0007` · **Label** : `needs-triage` → `ready-for-agent`
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md), [CONTEXT.md](../../CONTEXT.md) (Profil de publication).

## Contexte
Le profil est une **lentille changeable à tout moment, dans les deux sens, sans perte** (viser KDP → passerelle pour un bêta-lecteur → revenir KDP → puis TheBookEdition). Cette issue apporte l'UI et la mécanique de bascule à chaud.

## Périmètre
**In** : sélecteur de profil dans l'éditeur ; bascule qui ré-affiche le contenu sémantique avec le nouveau profil (CSS + contraintes + barre adaptée) sans recharger ; persistance du profil actif (réglage de session/projet) ; aperçu re-paginé au nouveau trim.
**Out** : ajout de nouveaux profils (`0011`) ; preflight (`0012`).

## Critères d'acceptation
- [ ] Changer de profil re-rend l'aperçu au bon trim/typo sans perte ni rechargement.
- [ ] La barre d'outils s'adapte (print-ready ↔ passerelle).
- [ ] Les surcharges (`0009`) sont respectées (dormantes/restaurées) à la bascule.
- [ ] Le profil actif est persistant et restauré à la réouverture.

## Ancre TDD
Tests : bascule KDP↔passerelle préserve le contenu ; l'aperçu reflète le nouveau profil ; le profil persiste. Réutiliser les propriétés d'invariance de `0009`.
