# Issue — Barre d'outils profil-adaptative

**Phase** 2 · **Dépend de** : `0007` · **Label** : `needs-triage` → `ready-for-agent`
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md), [CONTEXT.md](../../CONTEXT.md) (Style sémantique, Profil print-ready/passerelle).

## Contexte
La partie *formatage* de `FormattingToolbar.tsx` passe de contrôles manuels (police/taille/alignement/retrait/surlignage) à des **styles sémantiques adaptés au profil actif**. Les points d'entrée IA restent inchangés.

## Périmètre
**In** : barre d'outils qui, en profil **print-ready**, n'expose que des styles sémantiques (Corps, Titre, Sous-titre, Citation, Épigraphe, Séparateur de scène) + marques fiction (italique, gras, petites caps) ; en profil **passerelle**, réexpose les contrôles manuels (→ surcharges, `0009`).
**Out** : la mécanique des surcharges (`0009`) ; le sélecteur de profil (`0010`).

## Critères d'acceptation
- [ ] En print-ready, impossible de poser police/taille/alignement manuels depuis la barre.
- [ ] Les styles sémantiques sont appliqués et rendus via le profil.
- [ ] Les entrées IA (réécrire, palette, etc.) sont préservées et fonctionnelles.
- [ ] La barre reflète l'état (style actif) correctement.

## Ancre TDD
Tests composant : rendu de la barre selon le profil (print-ready vs passerelle) ; appliquer un style sémantique modifie le doc attendu ; les contrôles manuels sont absents en print-ready.
