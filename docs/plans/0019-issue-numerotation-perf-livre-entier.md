# Issue — Aperçu livre entier : numérotation correcte + rapidité (aperçu = PDF d'export)

**Phase** 6 · **Dépend de** : `0006`, `0013`, `0014`, `0015`, **`0017`** (dépendance **renforcée** : l'aperçu réutilise désormais le pipeline PDF d'export que `0017` corrige — profil actif, plus d'injection de titre, numérotation) · **Label** : `ready-for-agent`
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md), [0014-issue-numerotation-livre-entier.md](0014-issue-numerotation-livre-entier.md), [0015-issue-apercu-livre-entier.md](0015-issue-apercu-livre-entier.md).

> **Note de révision (grilling du 2026-07-04).** Cette fiche a été **entièrement retravaillée**. La version précédente proposait un cache de **métriques seules** avec recalcul **éager** via `after()`. Ce design a été abandonné : les métriques seules **ne réglaient pas la lenteur** (le navigateur repaginait quand même tout le livre à chaque ouverture — cf. `PagedJsRenderer.ts:36-43`, `window.PagedPolyfill.preview()` côté client). Décision retenue : **l'aperçu livre entier devient le vrai PDF d'export**, généré côté serveur et mis en cache. Le risque `after()`/serverless est **supprimé** (plus de recalcul éager).

## Contexte

Deux défauts distincts affectent l'aperçu « livre entier » (`src/app/book-preview/page.tsx`) :

**Bug de numérotation.** `startPageNumber` (qui pilote `counter-reset: page N` dans `BookCssBuilder.ts:58`) n'est jamais transmis dans le chemin livre-entier (`book-preview/page.tsx:97-103`) ni dans `PagedPdfExporter.renderToPdf` (même schéma frontMatter+toc sans `startPageNumber`). Sans ce reset, le compteur CSS `page` continue de s'incrémenter à travers liminaires (chiffres romains) → TOC → corps (chiffres arabes) : si le front-matter fait 5 pages, la 1ʳᵉ page du corps affiche « 6 » au lieu de « 1 ». Le test e2e existant (`e2e/book-preview/whole-book.spec.ts`) ne vérifie que la **présence** de la règle `counter(page)`, jamais sa **valeur résolue** — il ne détecte pas ce bug.

**Lenteur.** Aujourd'hui l'aperçu livre-entier pagine **intégralement dans le navigateur de l'auteur** : `book-preview/page.tsx` assemble tout le HTML (`WholeBookHtmlAssembler.assemble`), l'injecte dans une iframe (`srcDoc`), et une seule invocation **côté client** de `window.PagedPolyfill.preview()` (`PagedJsRenderer.ts:36-43`) pagine le DOM complet. Contrairement à l'export PDF (qui pagine déjà **côté serveur** via `PlaywrightBrowserLauncher`/Chromium headless), l'aperçu livre-entier fait tout ce travail dans le navigateur à chaque ouverture. Le test de perf existant tourne sur une fixture de 2 chapitres / ~47 mots — non représentative d'un roman de 300-400 pages.

## Décisions produit (arbitrées le 2026-07-04, ne pas rouvrir)

1. **L'aperçu livre entier devient le vrai PDF d'export.** Il n'est plus un rendu Paged.js côté navigateur, mais le PDF généré **côté serveur** (Chromium headless, via le pipeline `PagedPdfExporter`/`PlaywrightBrowserLauncher` déjà existant), affiché dans un lecteur PDF (iframe). Conséquence directe : **aperçu == export**, le même artefact, parfaitement fidèle. C'est l'aboutissement de la vision « l'éditeur est un aperçu fidèle de l'export ».
2. **Génération paresseuse (lazy), à l'ouverture — pas éager à la sauvegarde.** On ne fabrique **rien** au moment de sauvegarder un chapitre. Quand l'auteur **ouvre** l'aperçu, le serveur fabrique le PDF (spinner « génération en cours… »), puis le range en cache. Les ouvertures suivantes sont immédiates **tant que le contenu n'a pas changé**. Sont **abandonnés** : `after()` de `next/server`, le debounce/coalescing, le « recalcul limité aux profils déjà en cache ». Le calcul se fait pendant une **requête normale** (exactement comme l'export PDF fonctionne déjà), donc **aucun nouveau risque serverless** — le risque `after()`/`maxDuration` de la version précédente **disparaît**.
3. **Recalcul complet à chaque changement de contenu.** Le recalcul **incrémental** (ne repaginer que les chapitres modifiés) est **explicitement reporté** comme optimisation future, à n'entreprendre **que si** une mesure sur la fixture réaliste prouve que « modifier puis ouvrir » est trop lent. Raison : pour un **PDF**, l'incrémental gagne peu (une modif décale les numéros de page **partout** après elle → il faut re-rendre ces pages de toute façon) pour beaucoup de complexité (suivi du chapitre modifié, boucle de rétroaction du sommaire, réordonnancement). L'outil `BookOffsetCalculator.computeBookOffsets` reste la base envisagée le jour où l'incrémental des **chiffres** sera justifié.
4. **Cache par `{projectId, profileId, ownerId}`, à deux étages :** le **PDF** est stocké dans **GridFS** (pas de limite MongoDB de 16 Mo → supporte les livres avec images/couverture haute résolution) ; les **métriques** (`frontMatterPageCount`, `startPageNumber`, `totalPageCount`, `chapterOffsets`, `contentHash`, `computedAt`) dans un document normal de la collection `book_preview_cache`.
5. **Invalidation élargie.** L'empreinte `contentHash` couvre **tout ce qui apparaît dans le PDF** : contenu des chapitres **+ ordre des chapitres + pages liminaires** (titre du livre, auteur, dédicace) **+ réglages du sommaire**. Règle : *« si ça se voit dans le PDF, ça entre dans l'empreinte »*. (Correction d'un manque de la version précédente, qui n'invalidait que sur les chapitres → bug « titre du livre pas à jour ».)
6. **Le profil `passerelle` n'a pas d'aperçu livre entier.** Le bouton est caché/désactivé quand le profil actif du projet est `passerelle`. Justification produit : `passerelle` sert au **partage** (Google Docs / DOCX, cf. `0017`), sa mise en page paginée n'a pas d'intérêt ; et il n'y a de toute façon pas de PDF pour ce profil.
7. **Barre latérale de navigation par chapitre conservée.** Le clic sur un chapitre saute à la bonne page via l'ancre **`#page=N`** du lecteur PDF, en réutilisant les `chapterOffsets` du cache. Pas de dépendance aux signets PDF natifs (comportement moins maîtrisé, variable selon le navigateur).
8. **Sélecteur de profil propre à l'aperçu livre-entier**, réutilisant `PublicationProfileSelector.tsx`, mais limité aux **2 profils PDF** : `kdp-6x9` et `a5`. `passerelle` est exclu de ce sélecteur (cf. décision 6). Il permet de comparer les cibles d'impression sans changer le profil actif du projet dans l'éditeur.
9. **Numérotation en deux passes**, réutilisant `counter-reset: page N` de `BookCssBuilder` : passe 1 mesure le nombre de pages des liminaires+TOC (rendu dédié), passe 2 rend le corps avec le bon `counter-reset`. Cette correction est faite **une seule fois** dans le pipeline PDF et sert **simultanément l'aperçu et l'export** (puisque c'est désormais le même artefact — le « fix symétrique de `PagedPdfExporter` » de l'ancienne version devient de facto le même code). Ce coût de double-passe n'est payé qu'au (re)calcul du cache, jamais à l'affichage d'un cache chaud.

## Ce que stocke le cache (arbitrage mis à jour)

**Retenu : le PDF fini (GridFS) + les métriques (document).**

- On ne stocke **plus** « les métriques seules » (option écartée de la version précédente) : elles corrigent la numérotation mais **ne suppriment pas la repagination client**, donc ne règlent pas la lenteur.
- On ne stocke pas « le HTML paginé » : sans objet ici puisqu'on sert directement un **PDF**.
- Le **PDF** évite de refaire à chaque ouverture la pagination Chromium coûteuse (le vrai goulot). Les **métriques** servent la navigation `#page=N` et l'invalidation par `contentHash`.

## Risques / points de vigilance

- **Coût de la première ouverture (cache froid).** Fabriquer un PDF de 300-400 pages avec Chromium headless prend plusieurs secondes → spinner. Acceptable pour un écran ouvert **ponctuellement** (pas en boucle). À **mesurer** via la fixture réaliste, avec des budgets **distincts** « cache froid » (génération) et « cache chaud » (affichage). C'est déjà exactement ce que fait l'export PDF aujourd'hui, sur ce même déploiement — donc techniquement établi.
- **Concurrence sans verrou distribué.** Deux ouvertures concurrentes pour le même `{projet, profil}` froid peuvent lancer deux générations. Un upsert idempotent (`replaceOne` + remplacement du blob GridFS) évite toute corruption ; un gaspillage Chromium en double reste possible dans de rares cas — acceptable pour un premier jet, à surveiller.
- **Le risque `after()`/serverless de la version précédente est supprimé** (plus de fire-and-forget à la sauvegarde).

## Périmètre

**In** : entité `BookPreviewCacheEntry` (métriques : `projectId`, `profileId`, `contentHash`, `frontMatterPageCount`, `startPageNumber`, `totalPageCount`, `chapterOffsets`, `computedAt`) + stockage du **PDF dans GridFS** ; `MongoDBBookPreviewCacheRepository` (collection `book_preview_cache` + bucket GridFS, clé `{projectId, profileId, ownerId}`, upsert idempotent, pattern `MongoDBPresentationOverrideRepository.ts`) ; service `BookPreviewCacheComputer` orchestrant le calcul **deux passes** → produit le PDF + les métriques et écrit le cache ; extension de `getBookPreviewDataAction` pour accepter un `profileId`, lire le cache, et **générer paresseusement** si froid/périmé ; refonte de `book-preview/page.tsx` (affichage du **PDF** en iframe, barre latérale via `#page=N`, sélecteur de profil `kdp-6x9`/`a5`, spinner de génération + garde-fou timeout/retry existant) ; correction numérotation **deux passes** dans le pipeline PDF (sert aperçu **et** export) ; fixture e2e réaliste + test de perf dédié.

**Out** : recalcul incrémental/chunké du corps (explicitement **reporté**, optimisation future conditionnée à une mesure) ; `after()`/queue/Redis/worker externe (**supprimés** du design) ; aperçu livre-entier pour `passerelle` ; contenu de `0017` (consommé — pipeline PDF post-`0017` — mais pas réimplémenté) ; signets PDF natifs pour la navigation (remplacés par `#page=N`).

## Critères d'acceptation

- [ ] L'aperçu livre entier affiche **le PDF d'export réel** (aperçu == export), et non un rendu Paged.js navigateur distinct.
- [ ] La 1ʳᵉ page du corps (après liminaires+TOC) affiche le numéro arabe « 1 » — vérifié par la **valeur résolue**, pas seulement la présence de la règle CSS.
- [ ] Le même fix de numérotation vaut pour l'export PDF (c'est le **même pipeline**).
- [ ] Génération **paresseuse** : rien à la sauvegarde ; à l'ouverture, cache froid → génération (spinner) puis mise en cache ; ré-ouverture **sans** modification → affichage immédiat, sans repagination.
- [ ] Recalcul complet déclenché quand le **contenu d'un chapitre**, l'**ordre des chapitres**, **ou** les **liminaires** (titre du livre, auteur, dédicace, sommaire) changent.
- [ ] Cache `{projet, profil}` : **PDF en GridFS**, **métriques en document** ; lecture renvoie `null` si absent.
- [ ] Profil `passerelle` : **pas** d'aperçu livre entier (bouton caché/désactivé).
- [ ] Barre latérale : clic sur un chapitre → saut à la bonne page via **`#page=N`** (issu des `chapterOffsets`).
- [ ] Le sélecteur de profil de l'aperçu ne propose que `kdp-6x9` et `a5`.
- [ ] Une fixture e2e réaliste (~300-400 pages / 60-90k mots) existe ; un test dédié mesure **séparément** « cache froid » (génération) et « cache chaud » (affichage) avec des seuils **documentés** ; le test fumée existant sur la petite fixture est **conservé**.

## Ancre TDD

Tests (rouge avant implémentation) :
1. **Numérotation** : pipeline avec liminaires de `N` pages → `startPageNumber = N+1` → `counter-reset: page N` → 1ʳᵉ page du corps résout à « 1 » (test de **valeur**, pas seulement de présence).
2. `BookPreviewCacheComputer` : les deux passes produisent un `totalPageCount` cohérent ; changer de profil change le résultat (géométrie différente → pagination différente).
3. `MongoDBBookPreviewCacheRepository` : upsert idempotent par `{projectId, profileId, ownerId}` ; le PDF est stocké/relu via GridFS ; lecture des métriques renvoie `null` si absent.
4. `getBookPreviewDataAction` (étendu) : cache frais → pas de régénération ; `contentHash` périmé → régénération paresseuse ; **modifier les liminaires change le `contentHash`** (non-régression du bug « titre du livre pas à jour »).
5. `passerelle` : l'aperçu livre entier est indisponible (bouton absent/désactivé).
6. **Navigation** : à partir de `chapterOffsets`, le clic sur un chapitre produit le bon `#page=N`.
7. **E2E fumée** (existant, conservé) : 2 chapitres / 47 mots.
8. **E2E perf réaliste** (nouveau) : fixture 300-400 pages ; mesure séparée « cache froid » et « cache chaud », seuils explicites et documentés (pas recopiés du test fumée).
