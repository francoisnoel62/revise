# Issue — Modèle de contenu sémantique + migration

**Phase** 2 · **Dépend de** : `0005` · **Label** : `ready-for-agent` (stratégie approuvée 2026-06-28)
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md), [CONTEXT.md](../../CONTEXT.md) (Style sémantique).

## Contexte
Pour que les profils soient des lentilles changeables sans perte, le manuscrit doit être stocké en **contenu sémantique pur** : on marque le rôle (Corps, Titre de chapitre, Sous-titre, Citation, Épigraphe, Séparateur de scène), pas l'apparence. Aujourd'hui le contenu TipTap porte des marques de présentation (fontFamily, fontSize, textAlign, indent manuel).

## Périmètre
**In** : définir le schéma de nœuds/marques sémantiques (extensions TipTap) ; **migration** du contenu existant (mapping des marques de présentation → styles sémantiques + couche de surcharges quand pertinent) ; script de migration idempotent par projet (filtré `ownerId`).
**Out** : la couche surcharges elle-même (`0009`), la barre d'outils (`0008`).

## Critères d'acceptation
- [ ] Le schéma sémantique est défini et documenté (ajouter les termes manquants à `CONTEXT.md` si besoin).
- [ ] Un contenu existant migré rend à l'identique (ou mieux) sans perte de texte.
- [ ] Migration idempotente, réversible/auditable, testée sur des cas réels.
- [ ] Aucune logique métier dans l'UI.

## Ancre TDD
Tests unitaires de migration : un doc TipTap « legacy » (avec fontFamily/fontSize/align) → doc sémantique attendu. Couvrir les cas limites (titres dupliquant le titre de chapitre, paragraphes centrés = épigraphe, etc.).

## Décisions de migration (approuvées 2026-06-28)

- **Stratégie** : in-place — script idempotent qui réécrit le JSON, reversible par script inverse.
- **Backup** : obligatoire avant toute exécution (manuscrit réel en prod).
- **Cas ambigu — paragraphe centré** : ne pas inférer `épigraphe` automatiquement. Conserver comme `corps` + surcharge de présentation. Afficher une UI de confirmation au premier open si des ambigu"ïtés sont détectées, pour que l'auteur reclassifie.
- **Autres mappings non ambigus** : `heading` level 1 → `titre-de-chapitre`, paragraphe normal → `corps`, `<hr>` → `séparateur-de-scène`.
