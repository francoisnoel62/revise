# Retirer les documents de recherche du contexte d'autocomplétion

Les documents de recherche (plan du roman, chronologie, résolution de l'intrigue) étaient injectés dans le contexte d'autocomplétion sous le label `[INTENTION DE L'AUTEUR — RECHERCHE]`. Cela provoquait une **omniscience narrative** : l'IA connaissait la résolution de l'intrigue et proposait des suggestions qui anticipaient des événements que les personnages ne connaissent pas encore au chapitre en cours.

Nous avons décidé de les retirer complètement du contexte d'autocomplétion. Les documents de recherche sont des outils de planification pour l'auteur — pas un contexte pour l'IA qui continue une phrase. Le manuscrit lui-même, couplé aux faits canon, fournit un contexte plus pertinent et sans spoilers.

## Statut au 13 août 2026

**Actif pour le flux d'éditeur.** `TextEditor` utilise `/api/completion/stream`, qui
construit le contexte à partir du voisinage du curseur, des chapitres antérieurs et
du canon. Cette route n'injecte pas de document de recherche.

Un ancien chemin non-streaming (`completion-actions.ts` →
`GenerateCompletionUseCase` → `AIContextBuilder`) peut encore projeter les documents
de recherche. Il n'est pas le chemin de l'autocomplétion de l'éditeur, mais doit être
aligné avec cette décision ou explicitement retiré avant d'être remis en avant.

## Considered Options

**Filtrer les documents de recherche** par "chapitre de révélation" (tagger chaque doc avec le chapitre à partir duquel il peut être injecté). Rejeté : ajoute une charge de configuration à l'auteur et ne résout pas le problème de fond — l'auteur ne pense pas à ses docs de recherche en termes de chapitres de révélation.

**Garder les docs de recherche en opt-in.** Rejeté : le défaut omniscient nuit à l'expérience de la majorité des auteurs ; ceux qui veulent ce comportement peuvent toujours le construire manuellement.
