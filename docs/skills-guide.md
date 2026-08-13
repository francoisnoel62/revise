# Guide des commandes et skills — Revise

> État vérifié le 13 août 2026. Ce guide est un inventaire du dépôt ; il ne remplace pas l'aide affichée par l'outil d'agent utilisé.

## Commandes propres au dépôt

Les fichiers de `.claude/commands/` sont les commandes versionnées avec Revise. À cette date, les commandes disponibles sont :

| Commande | Usage |
| --- | --- |
| `/arch-check` | Vérifier les contraintes d'architecture du dépôt. |
| `/commit` | Préparer un commit selon les conventions du projet. |
| `/debug` | Démarrer une investigation de bug. |
| `/describe_pr` | Décrire une pull request. |
| `/docs-update` | Mettre à jour la documentation liée à un changement. |
| `/simple_create_plan_generic` | Produire un plan simple. |
| `/simple_implement_plan` | Exécuter un plan validé. |
| `/simple_research_codebase_generic` | Explorer le code avant une décision. |
| `/simple_review_CTO` | Revue orientée architecture et risques. |
| `/validate_plan` | Vérifier un plan avant son exécution. |
| `/verify` | Lancer les vérifications prévues par le projet. |
| `/worktree-done` | Terminer proprement un travail en worktree. |

Ne pas documenter `/review` ou `/tdd-cycle` comme commandes projet : elles ne figurent pas dans `.claude/commands/`.

## Skills génériques installés

Les skills résident dans `.agents/skills/`. Leur nombre évolue ; ne pas figer un total dans ce guide. Au 13 août 2026, les familles utiles au dépôt comprennent notamment :

- qualité et conception : `review`, `code-review`, `codebase-design`, `design-an-interface`, `tdd`, `tdd-cycle`, `systematic-debugging`, `diagnosing-bugs` ;
- planification : `grilling`, `decision-mapping`, `to-prd`, `to-issues`, `request-refactor-plan`, `qa` ;
- domaine et transmission : `domain-modeling`, `ubiquitous-language`, `handoff`, `journal`, `research` ;
- maintenance : `resolving-merge-conflicts`, `setup-pre-commit`, `git-guardrails-claude-code`, `migrate-to-shoehorn`.

Pour connaître la liste réellement disponible, l'agent doit inspecter `.agents/skills/` plutôt que de se fier à un exemple ancien. Un nom de skill et un nom de commande peuvent coïncider selon l'outil : vérifier la résolution effective dans l'environnement, sans présumer qu'une commande projet prend toujours priorité.

## Parcours recommandés

| Situation | Point de départ |
| --- | --- |
| Bug reproductible | `/debug` ou `systematic-debugging`, puis un test de régression. |
| Évolution non triviale | `grilling` ou `decision-mapping`, puis plan validé et `tdd` lorsque pertinent. |
| Changement documentaire | `/docs-update`, puis vérifier les sources actives et les liens. |
| Revue d'une branche | `review` ou `code-review` avec un point de comparaison explicite. |
| Fin d'une session longue | `handoff` et `journal` si une décision durable a été prise. |

## Règles de maintenance

- Mettre à jour ce fichier lorsque `.claude/commands/` change de façon visible.
- Ne citer un skill que s'il existe dans `.agents/skills/` ou dans l'environnement ciblé.
- Les exemples métier doivent rester des exemples ; ils ne prouvent pas une capacité produit.
- Les règles de contribution et l'architecture vivent dans `CLAUDE.md`, `CONTEXT.md` et `docs/architecture.md`.
