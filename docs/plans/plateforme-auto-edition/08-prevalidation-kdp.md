# 08 — Prévalidation avant dépôt

**Dépend de** : 04, 05. **Bloque** : rien.

## Ce qu'on peut vérifier aujourd'hui, et ce qu'on ne peut pas

`CONTEXT.md` affirme actuellement que le profil imprimable « n'effectue pas de
prévalidation de marketplace ». Ce chantier rend cette phrase fausse : **elle doit être
corrigée dans le même changement.**

**Règles confirmées, donc implémentables :**

| Règle | Valeur |
|---|---|
| Fonds perdus | 0,125" au-delà de la coupe, en haut, en bas et à l'extérieur |
| Page avec fonds perdus | +0,25" en hauteur, +0,125" en largeur |
| Marges extérieures minimales | 0,25" sans fonds perdus, 0,375" avec |
| Fonds perdus partiels | si une seule page en a besoin, **tout le fichier** doit être configuré ainsi |
| Résolution image | 300 DPI minimum, 600 recommandé au maximum |
| Polices | embarquement obligatoire |
| Pagination | 24 pages minimum |
| Taille de fichier | 650 MB maximum |
| Format | PDF obligatoire dès qu'il y a des fonds perdus ; PDF/X-1a préféré |

**Règle non implémentable en v1 : la gouttière.** La marge intérieure requise dépend du
nombre de pages, et la table officielle n'a pas pu être récupérée — l'egress était bloqué
et les tableaux HTML ne sont jamais restitués par la recherche.

**Décision prise** : ne pas inventer cette table. Le rapport de prévalidation signale
explicitement que la marge intérieure n'est pas vérifiée et **renvoie vers le
calculateur officiel KDP**. Dire « je ne vérifie pas ceci » vaut mieux que vérifier avec
une table devinée.

## Ce qu'on fait

Un rapport de prévalidation, produit depuis une édition, qui liste par règle : conforme,
non conforme, ou non vérifié. Chaque non-conformité indique **quoi corriger et où**, pas
seulement qu'il y a un problème.

Le rapport ne bloque jamais l'export. Il informe.

## Fichiers touchés

- `src/domain/services/` — les règles, une par règle, testables isolément
- `src/data/kdp-print-rules.ts` — valeurs datées et sourcées
- Un use case de prévalidation
- `src/components/publish/` — l'affichage du rapport
- `CONTEXT.md` — **correction obligatoire** de la phrase sur l'absence de prévalidation
- `docs/user/` — le guide correspondant

## Tests à écrire d'abord

1. Chaque règle confirmée est vérifiée par un test dédié, sur un cas conforme et un cas
   non conforme.
2. Un intérieur dont une seule page a besoin de fonds perdus est signalé comme devant
   être **entièrement** configuré avec fonds perdus.
3. Une image sous 300 DPI à sa taille imprimée est signalée, avec le numéro de page.
4. Un livre de moins de 24 pages est signalé.
5. La gouttière apparaît comme **« non vérifiée »**, avec le lien vers le calculateur
   officiel — jamais comme « conforme ».
6. Le rapport n'empêche jamais l'export.

## Critère de fin

Un auteur voit, avant de déposer, la liste de ce qui est conforme, de ce qui ne l'est pas
et de ce que Revise ne sait pas vérifier.

## Risques

**Les valeurs de ce chantier n'ont jamais été lues verbatim sur une page officielle.**
Elles proviennent d'extraits de moteur restreints aux domaines KDP. Le fichier de données
porte sa date et ses URL sources, et le rapport affiche cette date à l'auteur.

Ces règles évoluent. Prévoir la revérification comme une tâche récurrente, pas comme un
acquis.
