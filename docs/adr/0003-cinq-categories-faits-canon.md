# Cinq catégories de faits canon incluant états de connaissance et croyances

Les faits canon étaient initialement conçus pour capturer uniquement des **faits objectifs** établis dans le manuscrit ("Léa est morte", "Marc a perdu son bras"). Cette définition était trop restrictive pour un roman policier ou psychologique : l'IA ignorait ce que les personnages savent, croient, ou se trompent à croire.

Nous élargissons les faits canon à cinq catégories :

1. **Fait objectif** — vrai dans le monde du roman, indépendamment de ce que les personnages savent
2. **État de connaissance** — ce qu'un personnage sait ou ignore à l'instant T
3. **Croyance** — ce qu'un personnage tient pour vrai, même si c'est faux
4. **Croyance sur les autres** — ce qu'un personnage croit que les autres savent ou ignorent
5. **Dynamique relationnelle** — la nature d'une relation entre personnages à l'instant T

Ces catégories permettent de modéliser l'**horizon narratif** de chaque personnage : l'inspecteur qui croit Marc innocent au chapitre 5 ne doit pas, au chapitre 12, parler comme s'il connaissait la vérité — même si l'IA dispose d'un fait canon "Marc est coupable" établi plus tard.

Le modèle de données (`entity`, `statement`, `validFromChapter`) reste inchangé — la richesse est dans le texte libre du `statement`, pas dans un schéma structuré. Cela évite de sur-modéliser des croyances de second ordre difficiles à représenter proprement en base.

Le plafond d'injection passe de 20 à 40 faits, avec priorisation : chapitres récents en premier, puis catégories 2-4 (états de connaissance, croyances) avant les faits objectifs.

## Considered Options

**Schéma structuré pour les croyances** (champ `beliefType`, valeur de vérité séparée). Rejeté : sur-modélisation. Le LLM à l'autocomplétion interprète "croit à tort que Marc est innocent" aussi bien qu'un champ `isTrue: false`. La complexité du schéma ne se justifie pas.
