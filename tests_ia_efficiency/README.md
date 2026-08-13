# Scénarios manuels — contexte des fonctions IA

Ces scénarios complètent les tests automatisés du dossier. Ils servent à vérifier une intégration avec un fournisseur réel, pas à prouver une sortie exacte d'un modèle probabiliste.

> État vérifié le 13 août 2026 : le flux d'autocomplétion SSE emploie le texte autour du curseur, les chapitres antérieurs et le canon pertinent. Il **n'injecte pas** les documents de recherche. Les documents de recherche peuvent en revanche alimenter les opérations qui passent par `AIContextBuilder`, notamment certaines générations et réécritures.

## Prérequis

1. Démarrer l'application et ouvrir un compte approuvé.
2. Configurer un fournisseur IA valide puis l'associer au projet.
3. Créer un projet de test isolé : les générations et historiques sont persistés.
4. Garder une trace du fournisseur et du modèle testés : les résultats linguistiques varient avec eux.

## Scénarios

| Workflow | Vérifie | Ne vérifie pas |
| --- | --- | --- |
| A — Recherche vers génération | Projection d'un document de recherche dans une génération de chapitre. | L'autocomplétion SSE. |
| B — Édition auteur et fraîcheur | Une métadonnée éditée sert de contexte de génération et le statut de fraîcheur. | Une promesse de formulation exacte. |
| C — Fournisseurs | Les opérations principales répondent avec chaque fournisseur disponible. | Une parité de qualité ou de coût entre fournisseurs. |
| D — Deux contextes | La différence entre génération avec recherche et autocomplétion manuscrit/canon. | L'absence d'un mot dans une réponse probabiliste. |

Les fichiers `workflow-*.test.ts` sont des caractérisations automatisées de services et de leurs mocks. Ils ne remplacent pas un test E2E du flux SSE réel. Lorsqu'un changement touche le contexte d'autocomplétion, tester aussi `src/app/api/completion/stream/route.ts` et les tests E2E concernés.

## Méthode

Les sentinelles (noms ou objets inventés) aident à observer la présence d'un contexte, sans constituer une preuve statistique. Relancer une demande peut être utile, mais un échec répété doit être investigué avec le payload, les logs contrôlés ou un test déterministe — pas résolu en élargissant silencieusement le contexte.
