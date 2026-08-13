# Workflow A — Recherche vers génération

**But :** vérifier qu'un document de recherche peut être projeté dans une génération de chapitre. Ce workflow ne teste pas l'autocomplétion SSE.

## Étapes

1. Créer un projet et coller `manuscrit-chapitre-1.md` dans son premier chapitre.
2. Dans le cockpit, créer un document de recherche dont le corps contient `research-plan-global.md`.
3. Lancer une génération de chapitre depuis l'éditeur.
4. Relever si la génération réutilise une ou plusieurs sentinelles du plan : Éliane Vaucresson, Silas Greffe, Brumes-sur-Loire ou la montre à treize heures.

## Verdict

- **Réussi** : une génération exploite le contexte de recherche sans le présenter comme un fait déjà écrit dans le manuscrit.
- **À investiguer** : plusieurs générations ne montrent aucune trace du contexte, après vérification que le document est bien enregistré et que le fournisseur du projet est valide.

Ne pas déclencher une complétion pour ce verdict : le chemin SSE actif ne reçoit pas ce document de recherche.
