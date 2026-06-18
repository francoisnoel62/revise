# Retirer les documents de recherche du contexte d'autocomplétion

Les documents de recherche (plan du roman, chronologie, résolution de l'intrigue) étaient injectés dans le contexte d'autocomplétion sous le label `[INTENTION DE L'AUTEUR — RECHERCHE]`. Cela provoquait une **omniscience narrative** : l'IA connaissait la résolution de l'intrigue et proposait des suggestions qui anticipaient des événements que les personnages ne connaissent pas encore au chapitre en cours.

Nous avons décidé de les retirer complètement du contexte d'autocomplétion. Les documents de recherche sont des outils de planification pour l'auteur — pas un contexte pour l'IA qui continue une phrase. Le manuscrit lui-même, couplé aux faits canon, fournit un contexte plus pertinent et sans spoilers.

## Considered Options

**Filtrer les documents de recherche** par "chapitre de révélation" (tagger chaque doc avec le chapitre à partir duquel il peut être injecté). Rejeté : ajoute une charge de configuration à l'auteur et ne résout pas le problème de fond — l'auteur ne pense pas à ses docs de recherche en termes de chapitres de révélation.

**Garder les docs de recherche en opt-in.** Rejeté : le défaut omniscient nuit à l'expérience de la majorité des auteurs ; ceux qui veulent ce comportement peuvent toujours le construire manuellement.
