# Issue — Numérotation livre-entier (offsets cachés)

**Phase** 4 · **Dépend de** : `0006`, `0013` · **Label** : `needs-triage` → `ready-for-agent`
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md).

## Contexte
L'auteur édite un chapitre à la fois, mais ses pages portent leur **numéro réel dans le livre** (ex. ch.5 commence p.84). Cela suppose de connaître le nombre de pages des chapitres précédents (et des liminaires) sans tout charger.

## Périmètre
**In** : calcul du nombre de pages par chapitre via le `PagedRenderer` ; **cache** des comptes par chapitre (invalidation au changement de contenu/profil) ; offset appliqué à la numérotation de l'aperçu du chapitre courant ; prise en compte des liminaires (chiffres romains) et des sauts page impaire.
**Out** : l'aperçu continu complet (`0015`).

## Critères d'acceptation
- [x] La 1ʳᵉ page d'un chapitre affiche son numéro réel dans le livre.
- [x] Le cache se met à jour quand un chapitre amont change ou que le profil change.
- [x] La numérotation reste exacte vs l'export (même moteur).
- [x] Perf acceptable (pas de re-pagination de tout le livre à chaque frappe).

## Ancre TDD
Tests : un manuscrit-fixture multi-chapitres → offsets attendus par chapitre ; modifier un chapitre amont invalide et recalcule l'offset ; changer de profil recalcule. Vérifier l'égalité numéro éditeur == numéro export.
