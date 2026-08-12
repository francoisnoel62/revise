# Lignes vides visibles dans le rendu paginé

## Problème

Un paragraphe vide (l'auteur appuie sur Entrée pour aérer son texte) est visible dans
l'éditeur TipTap mais invisible dans l'aperçu chapitre, l'aperçu livre entier et le PDF.

Cause : `TipTapToBookHtml` émet `<p></p>`, et `BookCssBuilder` pose `p { margin: 0 }`.
Un `<p>` sans contenu ne génère aucune boîte de ligne → hauteur 0, marge 0 → invisible.
Dans l'éditeur au contraire, ProseMirror injecte un `<br>` technique dans les paragraphes
vides, d'où l'écart perçu.

Cela contredit l'ADR 0005 (l'éditeur est un aperçu fidèle de l'export) et diverge de
l'export DOCX, où un paragraphe vide occupe déjà une ligne (Word donne toujours une
hauteur à un paragraphe).

## Décisions prises

- **Hauteur** : une ligne pleine, identique à une ligne de texte du même rôle sémantique.
- **Limite** : aucune. Dix Entrée = dix lignes vides. C'est le texte de l'auteur.

## Implémentation

### 1. Marquer les paragraphes vides — `TipTapToBookHtml`

Un paragraphe vide sort en `<p data-blank-line>` au lieu de `<p>`.

Le marqueur est nécessaire plutôt qu'un sélecteur CSS `p:empty` : un paragraphe où
l'auteur a tapé des espaces contient un nœud texte et n'est donc pas `:empty`, alors que
`isBlankParagraph` le considère (à juste titre) comme vide.

### 2. Donner une hauteur au marqueur — `BookCssBuilder`

`p[data-blank-line]::before { content: "\200B"; }` — une espace de largeur nulle crée une
boîte de ligne réelle, qui hérite du `font-size`/`line-height` du rôle sémantique du
paragraphe. La hauteur suit donc automatiquement la typographie du niveau, sans calcul.

Le contenu généré CSS n'entre pas dans la sélection : aucune pollution du copier-coller.

### 3. Les exceptions

**Autour d'un titre de chapitre / sous-titre** : supprimées des deux côtés. Ces rôles gèrent
eux-mêmes leur espace vertical ; une ligne vide collée à eux fait doublon. Chaque côté a
néanmoins sa propre justification :

- *Après* (comportement existant) : la ligne vide vole le `break-after: avoid` de Paged.js,
  qui colle le titre à son voisin DOM immédiat et non au contenu visible suivant. Le titre
  peut alors rester orphelin en bas de page.
- *Avant* : la typographie de niveau applique déjà un `spaceBefore` (24 pt pour un
  sous-titre, 48 pt pour un titre de chapitre, qui ouvre en plus une page). Or l'éditeur
  n'affiche aucun style de niveau — aucune règle `data-semantic-role` dans `globals.css`,
  aucun `LevelStyleSet` injecté dans `TextEditor`. La ligne vide est donc l'auteur compensant
  un espace qu'il ne voit pas, pas une demande d'espace supplémentaire. Conservée, elle
  donnerait 24 pt avant certains sous-titres et 36 pt avant d'autres : un espacement de
  section irrégulier d'un chapitre à l'autre.

Une série entière de lignes vides est supprimée d'un bloc, pas seulement la plus proche.

**En fin de document** : supprimées. Sinon elles gonflent la pagination et peuvent pousser
une page superflue en fin de chapitre.

### Cause racine à traiter séparément

Le point « avant un titre » soigne un symptôme : l'éditeur n'affiche pas la typographie de
niveau (tailles, graisses, espaces avant/après). Tant que c'est le cas, l'auteur continuera
de compenser à la main des espaces déjà appliqués à l'export. C'est le vrai sujet de
l'ADR 0005, hors périmètre de ce plan.

### 4. Invalider le cache d'aperçu

Bumper `BOOK_PREVIEW_RENDERER_REVISION` dans `bookPreviewContentHash.ts` : le rendu change
alors que les données du manuscrit ne changent pas, donc sans bump les aperçus déjà en
cache resteraient périmés après déploiement.

## Portée

Tout part de `TipTapToBookHtml` + `BookCssBuilder` : aperçu chapitre, aperçu livre entier,
export PDF et compteur de pages en arrière-plan changent ensemble, par construction.

## Vérification

Mesure en navigateur réel (Chromium, profil KDP 6×9, rôle `corps`) : la ligne vide occupe
16,86 px, exactement la hauteur d'une ligne de texte du même rôle. La hauteur suit donc bien
la typographie du niveau, sans valeur codée en dur.

## Question ouverte — impact sur les projets existants

Le changement est rétroactif : au déploiement, tout manuscrit contenant des lignes vides voit
sa pagination changer. Le texte de l'auteur n'est jamais modifié, seule sa mise en page l'est,
et l'auteur voit le résultat immédiatement dans l'aperçu. Mais un livre déjà exporté et publié
ne correspondrait plus, à l'identique, à un nouvel export.

Alternative si cet impact est jugé inacceptable : un réglage par projet
(`ProjectSettings.honorBlankLines`). `undefined` = comportement historique (lignes vides
invisibles), stampé à `true` à la création des nouveaux projets. Aucune migration de données
nécessaire, mais le réglage doit alors traverser le sérialiseur, une action serveur, l'UI des
réglages de publication, le hash de cache et les quatre appelants du renderer — de l'ordre de
dix fichiers supplémentaires, contre deux pour le cœur du changement, déjà écrit et testé.
