# Workflow B — Édition auteur et fraîcheur

**But :** vérifier la règle « l'édition de l'auteur l'emporte » dans les opérations qui utilisent `AIContextBuilder`, ainsi que l'indicateur de fraîcheur des métadonnées.

## Étapes

1. Créer un projet, coller `manuscrit-chapitre-1.md`, puis générer la métadonnée Personnages.
2. Modifier explicitement la fiche générée, par exemple « yeux bleus » en « yeux violets, injectés de mauve », et sauvegarder.
3. Lancer une génération de chapitre ou une réécriture qui utilise le contexte du projet.
4. Vérifier que le résultat peut s'appuyer sur la valeur éditée, sans considérer la formulation exacte comme déterministe.
5. Modifier le manuscrit, sauvegarder et ouvrir les métadonnées pour constater le signal de fraîcheur.
6. Régénérer uniquement si l'auteur choisit de remplacer la donnée ; relire ensuite le contenu obtenu avant de s'en servir.

## Verdict

La métadonnée modifiée n'est pas silencieusement remplacée par son `structuredData` généré pendant la construction du contexte. La fraîcheur indique l'écart entre manuscrit et métadonnée ; elle ne déclenche pas elle-même une régénération.
