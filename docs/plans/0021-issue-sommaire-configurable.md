# Issue — Sommaire configurable (profondeur + 3 designs)

**Phase** 6 · **Dépend de** : `0013` (liminaires + TOC), `0017` (titres depuis le corps) · **Interagit avec** : `0019` (invalidation du cache aperçu) · **Label** : `ready-for-agent`
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md), [0013-issue-liminaires-toc.md](0013-issue-liminaires-toc.md).

> **Statut (grillé le 2026-07-04).** Scindé de [`0020`](0020-issue-styles-globaux-par-niveau.md) (typographie). Ici : **uniquement le sommaire configurable**.

## Contexte

Le sommaire actuel est **plat, à un seul niveau** : une entrée par chapitre, tirée du nom du chapitre.
- `WholeBookHtmlAssembler.assemble` construit `tocEntries: {chapterId, title}[]` (une par chapitre).
- `TocHtmlBuilder.build` rend un `<ol>` simple : `<li><a href="#id">titre</a></li>`, avec **un seul design fixe** (points de conduite + numéro de page via `leader('.') target-counter(...)`).
- Les **sous-titres** (`sous-titre` / h2) n'y apparaissent pas ; seuls les chapitres ont une **ancre** (`id`).

`0017` fait déjà évoluer `WholeBookHtmlAssembler` (le titre vient du heading `titre-de-chapitre` du corps, plus du nom injecté) : cette issue se construit **par-dessus** ce changement.

## Décisions produit (arbitrées le 2026-07-04, ne pas rouvrir)

1. **Réglages rangés dans `ProjectSettings`, GLOBAUX au projet** (pas par profil). Un sommaire décrit la **structure** du livre — identique quel que soit le format d'impression ; il serait incohérent que le sommaire du 6×9 diffère de celui de l'A5 pour le même livre.
2. **Profondeur : 2 niveaux maximum**, alignés sur le modèle de contenu existant : `titre-de-chapitre` (niveau 1), `sous-titre` (niveau 2). L'auteur **choisit d'inclure ou non les sous-titres** ; s'ils sont inclus, ils apparaissent **imbriqués/indentés** sous leur chapitre. **Pas de niveau 3+** (nécessiterait un nouveau rôle sémantique — hors scope, réflexion « modèle de document » à part).
3. **3 designs de sommaire** (global), dans l'esprit Google Docs. Défaut = **Classique** (rendu actuel → aucune régression) :
   - **Classique** — points de conduite + numéros de page (l'actuel).
   - **Épuré** — numéros alignés à droite, **sans** points de conduite.
   - **Littéraire** — titres **centrés**, **sans** numéros de page.
4. **Modèle `TocEntry` hiérarchique** : chaque entrée peut porter des sous-entrées (ou un champ `level`). `TocHtmlBuilder` rend l'imbrication et applique le design via une **classe** (`toc--classique` / `toc--epure` / `toc--litteraire`) ; `BookCssBuilder` porte les **3 variantes CSS**.
5. **Ancres sur les sous-titres** : assigner un `id` aux headings `sous-titre` du corps, pour rendre les sous-entrées **cliquables** dans le sommaire et **atteignables** en navigation (extension du saut `#page=N` de `0019`). Aujourd'hui, seuls les chapitres ont un `id`.
6. **Invalidation `0019`** : changer la profondeur ou le design modifie le PDF → invalide le cache. Comme le réglage est **global**, il invalide **toutes** les entrées de profil du projet.

## Périmètre

**In** : réglages `tocDepth` (chapitres seuls | chapitres + sous-titres) et `tocStyle` (`classique`|`epure`|`litteraire`) dans `ProjectSettings` (globaux, immuables, sérialisés, défauts = comportement actuel) ; modèle `TocEntry` hiérarchique ; collecte des `sous-titre` du corps avec **ancres** (`id`) ; `TocHtmlBuilder` rend l'imbrication + la variante de design ; `BookCssBuilder` porte les 3 variantes CSS ; extension de la navigation `#page=N` aux sous-entrées ; branchement de l'invalidation du cache `0019`.

**Out** : typographie par niveau → `0020` ; niveaux de titre au-delà de 2 (nouveau rôle sémantique) ; sommaire par profil (explicitement global) ; personnalisation libre du design au-delà des 3 presets.

## Critères d'acceptation

- [ ] L'auteur choisit la **profondeur** : chapitres seuls, ou chapitres + sous-titres **imbriqués**.
- [ ] L'auteur choisit un **design** parmi Classique / Épuré / Littéraire ; défaut Classique (rendu actuel inchangé).
- [ ] Les réglages sont **globaux** au projet (identiques pour 6×9 et A5).
- [ ] Quand les sous-titres sont inclus, ils ont une **ancre** et sont **cliquables** (sommaire) et **navigables** (`#page=N`).
- [ ] Le design Littéraire n'affiche **pas** de numéros ; Épuré n'affiche **pas** de points de conduite ; Classique conserve points + numéros.
- [ ] Changer profondeur ou design **invalide** le cache `0019` (toutes les entrées de profil du projet).

## Ancre TDD

- `ProjectSettings` : lecture/écriture de `tocDepth`/`tocStyle` (globaux), défauts = comportement actuel, isolés par `ownerId`, sérialiseur round-trip.
- Collecte hiérarchique : un chapitre avec sous-titres produit un `TocEntry` niveau 1 + sous-entrées niveau 2 ; profondeur « chapitres seuls » ignore les sous-titres.
- Ancres : chaque `sous-titre` inclus reçoit un `id` unique et stable ; lien du sommaire pointe dessus.
- `TocHtmlBuilder` : rend l'imbrication ; applique la bonne classe de design.
- `BookCssBuilder` : Littéraire sans `target-counter` (pas de numéro) ; Épuré sans `leader('.')` ; Classique conserve les deux.
- Invalidation `0019` : changer profondeur/design change l'empreinte de cache.
