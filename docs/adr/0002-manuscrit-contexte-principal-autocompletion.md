# Manuscrit comme contexte principal de l'autocomplétion

Le meilleur contexte pour continuer une phrase est le texte déjà écrit — pas le plan, pas les métadonnées dérivées. Le manuscrit contient la voix de l'auteur, les personnages tels qu'ils ont été présentés, la tension telle qu'elle a été construite, et ce que les personnages savent à l'instant T. Il est toujours à jour.

Nous adoptons une architecture hybride selon la taille du manuscrit :

- **≤ 40 000 mots** : manuscrit complet jusqu'au chapitre courant injecté dans le contexte.
- **> 40 000 mots** : 5 derniers chapitres en texte intégral + faits canon pour les chapitres plus anciens.

Le seuil de 40 000 mots correspond au point où la latence devient significative sans prompt caching. En dessous, le manuscrit complet tient dans la fenêtre de contexte et donne la meilleure qualité. Au-dessus, les faits canon servent de résumé structuré des chapitres anciens — ils capturent ce qui compte (états, croyances, relations) sans le coût des tokens de tout le texte.

La fenêtre `[AVANT]` est élargie à 8 000 caractères pour inclure le chapitre courant depuis son début, pas seulement les derniers paragraphes. Cela permet à l'IA de respecter le ton et la dynamique établis en ouverture de chapitre.

## Consequences

Les métadonnées dérivées (style, narration, personnages, intrigue) sont retirées du contexte d'autocomplétion. Elles étaient périmées dès que le manuscrit avançait ; le manuscrit lui-même les remplace avec une meilleure fraîcheur.
