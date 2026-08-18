# Trois types de projet, immuables après création

L'ouverture au non-fiction et au low content fait cohabiter des objets qui n'ont ni le
même contenu, ni les mêmes outils, ni le même rapport à l'IA. Les traiter comme un seul
type de projet obligerait chaque fonctionnalité à se demander à quoi elle a affaire.

Nous introduisons un `ProjectKind` à trois valeurs, fixé à la création et **immuable**.

| Kind | Contenu | Analyses IA |
|---|---|---|
| `fiction` | manuscrit, chapitres, IA narrative | **Story Intelligence** |
| `non-fiction` | manuscrit, chapitres, images, tableaux | **Knowledge Intelligence** |
| `low-content` | gabarit de page répété, pas de manuscrit | aucune |

`non-fiction` couvre les essais, manuels, guides — et ce que le marché appelle *medium
content*. Ce sont le même besoin technique : du texte, des images, une mise en page
riche. Thèses, mémoires et rapports sont explicitement hors v1 : l'appareil critique
(citations normalisées, bibliographie, index, renvois) n'existe nulle part dans le code
et constitue un chantier entier.

## Immuabilité

Convertir un roman en carnet n'a pas de sens, ni un essai en roman. L'immuabilité
supprime une classe entière d'états incohérents — que devient un registre canon quand
un manuscrit devient un planner ? Une conversion explicite pourra s'ajouter si une
demande réelle apparaît.

## Story Intelligence et Knowledge Intelligence

Ce sont des noms **visibles** : ils apparaissent au moment où l'auteur choisit son type
de projet et dans le menu d'analyses du cockpit.

Story Intelligence nomme l'existant — analyse narrative, personnages, intrigue,
worldbuilding, ADN stylistique, registre canon, chat personnage, thésaurus. Rien de
neuf n'y est promis.

Knowledge Intelligence est à construire, dans cet ordre : **Consistency Checker**,
puis Knowledge Graph, puis Argument Analysis et Source Intelligence. Le Consistency
Checker vient en premier parce que le registre canon existant en fournit déjà
l'essentiel : `CanonFact` avec plages de validité par chapitre, extraction incrémentale
par hash de contenu, préservation des faits saisis manuellement. C'est un portage, pas
une construction.

Sur un projet `non-fiction`, les analyses Story Intelligence sont **désactivées**, pas
supprimées.

## Conséquence sur les prompts

Les prompts spécifiques à la fiction sont aujourd'hui codés en dur et dupliqués dans
les trois implémentations de `LLMProvider` — `AnthropicProvider.ts` (1816 lignes),
`OpenAIProvider.ts` (1831), `GoogleProvider.ts` (1697). Seule une partie est
externalisée dans `docs/prompt/`.

Tant que cette duplication existe, **chaque prompt qui doit varier selon le type de
projet coûte trois fois son écriture**. L'externalisation est donc un prérequis, pas un
nettoyage optionnel : voir
[chantier 02](../plans/plateforme-auto-edition/02-externalisation-prompts.md).

## Considered Options

**Deux types seulement (fiction / non-fiction), le low content étant un cas de
non-fiction.** Rejeté : un carnet de 120 pages n'a pas de manuscrit. Le modéliser en
120 chapitres TipTap traînerait autosave, snapshots, canon, grammaire et autocomplétion
sur un objet qui n'en a aucun usage.

**Un type mutable.** Rejeté : voir Immuabilité.

## Liens

- PRD : [plateforme-auto-edition/PRD.md](../plans/plateforme-auto-edition/PRD.md)
- ADR liés : [0007](0007-perimetre-produit-et-revision-philosophie.md),
  [0009](0009-editions-multiples-par-manuscrit.md)
- Chantiers : [03](../plans/plateforme-auto-edition/03-project-kind.md),
  [11](../plans/plateforme-auto-edition/11-consistency-checker.md),
  [12](../plans/plateforme-auto-edition/12-low-content.md)
