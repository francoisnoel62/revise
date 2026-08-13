# Workflow D — Distinguer les contextes

**But :** éviter la confusion entre le contexte des générations et le contexte de l'autocomplétion en flux.

## Étapes

1. Créer un projet avec `manuscrit-chapitre-1.md` et le document `research-univers-global.md` dans le cockpit.
2. Lancer une génération de chapitre : les sentinelles de la bible (Xérion, éclats, soleil double) peuvent y servir de contexte.
3. Ajouter dans le manuscrit un fait établi, ou le créer manuellement dans le registre canon avec une validité correspondant au chapitre courant.
4. Dans l'éditeur, déclencher une autocomplétion à un endroit où ce fait manuscrit/canon est pertinent.
5. Vérifier avec les outils de développement ou les tests de route que le flux construit son contexte depuis le voisinage du curseur, les chapitres précédents et le canon.

## Verdict

Une présence de sentinelle de recherche dans une génération est un signal utile. Son absence dans une complétion n'est pas une preuve suffisante, car une sortie de modèle est probabiliste. Le contrat à vérifier pour l'autocomplétion est structurel : elle n'injecte pas les documents de recherche dans `api/completion/stream`.
