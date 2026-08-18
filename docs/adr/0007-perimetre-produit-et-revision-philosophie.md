# Périmètre produit : de l'assistant de fiction à l'outil d'auto-édition

Revise a été conçu comme un assistant d'écriture destiné aux auteurs de fiction. Le
public observé contredit cette hypothèse : les romanciers francophones sont fermés,
méfiants et souvent hostiles à l'usage de l'IA pour écrire leur texte. Les auteurs
auto-publiés qui vivent de leurs livres, eux, sont demandeurs — de deux choses
précises : écrire vite et bien, puis publier vite et sans friction en plusieurs
formats.

Nous déplaçons le public cible vers l'auteur auto-publié professionnel. Ce n'est pas
un abandon : la fiction reste un mode complet du produit, mais en maintenance. L'effort
neuf va au non-fiction commercial — essais, manuels, guides.

## La promesse

« De la page blanche au livre publié », avec « Écrivez et publiez » comme signature
courte. Le nom Revise ne change pas.

Deux affirmations du README deviennent fausses et doivent disparaître : « passez votre
chemin si vous cherchez du technique, marketing, factuel » et « si vous espérez qu'il
écrive le livre à votre place ». Elles repoussent exactement le public visé.

## La philosophie

`.claude/philosophie.md` portait cinq principes. Trois relevaient de la protection de
la voix de l'auteur : « l'IA suggère, l'auteur décide », « toujours offrir des choix »,
« préserver la singularité du texte ». Ils sont retirés.

Deux sont conservés parce qu'ils ne portent pas sur la voix :

- **Propriété** — les écrits appartiennent à l'auteur et ne servent jamais à
  l'entraînement. Quand le manuscrit du client *est* son gagne-pain, c'est une promesse
  commerciale, pas une contrainte de conception.
- **Transparence** — l'auteur sait ce que fait l'IA.

Le motif du retrait est explicite : nous partons du principe que l'auteur est
responsable de son œuvre, que l'IA est un outil, et qu'il réécrira et corrigera ce
qu'elle produit. Les modes génératifs (génération de texte long, génération d'images,
intérieurs low content) cessent d'être hors périmètre.

## Ce que ce retrait coûte, et qui doit être documenté

La distinction entre les deux n'est plus garantie par le produit, et deux acteurs de la
chaîne de distribution s'en soucient :

- **Amazon KDP** exige une déclaration pour tout contenu *AI-generated* — texte, images,
  traductions — à chaque publication et republication. Le contenu *AI-assisted* (l'IA
  qui édite, affine, corrige, ou sert au brainstorming d'un texte écrit par l'auteur)
  n'est pas déclarable.
- **Draft2Digital** refuse le contenu entièrement généré par IA sans édition humaine
  substantielle.

Nous n'implémentons pas de système de traçabilité en v1 — décision reportée. En
revanche, la génération d'images affiche un avertissement factuel signalant que les
images produites sont déclarables à Amazon. Voir
[chantier 14](../plans/plateforme-auto-edition/14-generation-images-ia.md).

## Considered Options

**Supprimer `philosophie.md` et sa référence dans `CLAUDE.md`.** Rejeté : `CLAUDE.md`
en fait la contrainte qui lie chaque fonctionnalité, et la propriété des écrits reste
un argument de vente que rien d'autre ne porte.

**Borner les principes de voix au « texte que l'auteur revendique comme sien », et
ajouter un principe de traçabilité.** Rejeté au profit du retrait franc : la frontière
entre texte revendiqué et texte généré n'est pas observable par le produit, donc le
principe aurait été invérifiable.

## Liens

- PRD : [plateforme-auto-edition/PRD.md](../plans/plateforme-auto-edition/PRD.md)
- ADR liés : [0008](0008-trois-types-de-projet.md),
  [0010](0010-frontiere-avec-les-plateformes-de-publication.md)
