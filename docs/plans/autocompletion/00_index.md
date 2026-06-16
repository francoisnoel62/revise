# Plans d'implémentation — Autocomplétion littéraire (série complète)

> Découle de [strategie-autocompletion.md](../../strategie-autocompletion.md) et
> [roadmap-autocompletion.md](../../roadmap-autocompletion.md). Recherche fondatrice :
> [research/autocompletion/](../../research/autocompletion/).
> Méthode : TDD (`tdd-cycle`). Tout est versionné dans la PR #102.

Cette série couvre **l'entièreté** de la nouvelle feature : recentrer l'IA de Revise sur une
autocomplétion littéraire manuscrit-premier, rapide, contrôlable, et **mesurable**. L'ordre suit la
priorité réaliste de la roadmap : instrumenter → améliorer le cœur → déclasser l'ancien → arbitrer.

| # | Plan | Chantier(s) roadmap | But |
|---|------|---------------------|-----|
| 1 | [instrumentation](2026-06-14_instrumentation-autocompletion.md) | 1 | Mesurer le cycle de vie des suggestions (base factuelle) |
| 2 | [qualité prompt + policy](02_qualite-prompt-et-policy.md) | 2, 3 | Contrat de prompt strict + paramètres providers basse latence |
| 3 | [acceptation partielle](03_acceptation-partielle.md) | 4 | Accepter mot / fragment / tout |
| 4 | [contexte manuscrit-premier](04_contexte-manuscrit-premier.md) | 5, 8 | Builder dédié ; métadonnées hors du chemin chaud |
| 5 | [variantes discrètes](05_variantes-discretes.md) | 6 | Intentions implicites (plus bref / tendu / concret / dialogue) |
| 6 | [déclassement génération chapitre](06_declassement-generation-chapitre.md) | 7 | Sortir la génération longue du flux principal (sans supprimer) |
| 7 | [expérimentation A/B](07_experimentation-ab.md) | 12 | Comparer stratégies de contexte sur données réelles |
| 8 | [registre de canon](08_registre-de-canon.md) | — | Faits atomiques par personnage, validité temporelle, injection au prompt |

**Dépendances :** le plan 1 (instrumentation) débloque le plan 7 (A/B) — sans signaux, pas de
comparaison. Le plan 4 (contexte dédié) est prérequis du plan 7 (variante B/C). Le plan 6 commence
par découpler le rate-limit chapitre↔métadonnées. Les plans 2, 3, 5 sont indépendants entre eux.

**Invariants produit (binding sur toute la série)** — cf. `philosophie.md` :
l'IA suggère, l'auteur décide ; insertion toujours déclenchée par l'auteur ; ne jamais standardiser
la voix ; manuscrit = source de vérité ; chaque chantier en TDD verrouillant les invariants, pas
seulement le câblage.
