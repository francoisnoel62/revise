# Handoff — Grilling + cadrage Phase 6 éditeur (session 2026-07-04)

## But de la session
Grilling (stress-test) des fiches Phase 6 de l'épopée « refonte éditeur », livraison d'un correctif ponctuel, réécriture/création des fiches, mise à jour du METAPLAN, et création des issues GitHub. **Aucun code produit hormis un petit correctif CSS** ; l'essentiel est de la conception + de la documentation de plans.

## État git au moment du handoff
Branche : `claude/main-changes-since-commit-xdcnpc`. Fichiers produits cette session :
- **Code + test** : `src/infrastructure/document/paged/BookCssBuilder.ts` et `BookCssBuilder.test.ts` (correctif sous-titres, ci-dessous).
- **Plans (Markdown)** : `docs/plans/0017`, `0018`, `0019` (réécrits) ; `0020`, `0021`, `0022` (créés) ; `METAPLAN-orchestration-refonte-editeur.md` (section Phase 6 ajoutée) ; ce handoff.

Le repo interdit `git add -A`/`.` (hook `guard-bash`) → stager par nom. Jamais `--no-verify`. Brancher avant de committer (ne pas committer sur `main`).

## Correctif déjà livré (TDD rouge→vert)
Bug rapporté par l'auteur : **sous-titres rendus plus gros que les titres de chapitre**. Cause : `BookCssBuilder` fixait `h1` (titre-de-chapitre) à 14pt mais **n'avait aucune règle `h2`** (sous-titre) → taille navigateur par défaut (~16,5pt). Correctif : règle `h2` à 12pt. Test ajouté (`heading hierarchy`) vérifiant `h2 < h1`. **242 tests du dossier `src/infrastructure/document` verts.** `npm run verify` complet **non exécuté** cette session.

## Décisions du grilling — NE PAS les redécouvrir, elles sont dans les fiches
Les 6 fiches sont la **source de vérité** (ne pas dupliquer ici). Résumé des pivots majeurs :
- **`0019`** : l'aperçu livre-entier **devient le PDF d'export** (généré serveur, cache **GridFS** + métriques, **paresseux** à l'ouverture). Abandon du cache « métriques seules » et du recalcul éager `after()` → le risque serverless disparaît. `passerelle` sans aperçu ; navigation via `#page=N` ; numérotation corrigée une seule fois pour aperçu+export.
- **`0017`** : titre de chapitre en **fidélité stricte** (depuis le corps, **sans repli** `chapter.title`) + **migration unique** insérant un H1 + H1 par défaut aux nouveaux chapitres ; suppression des 3 profils KDP **sécurisée** (cas `default`→`kdp-6x9` dans `fromId`, vérif base, migration).
- **`0018`** : toggle d'aperçu + **persistance `localStorage`**.
- **`0020`** (typographie par niveau) : dans `ProjectSettings`, **par profil PDF**, 5 rôles sémantiques, jeu riche borné **sans couleur**, bornes simples.
- **`0021`** (sommaire configurable) : **global**, profondeur 2 niveaux (chapitres ± sous-titres imbriqués, ancres à poser sur les sous-titres), 3 designs (Classique défaut / Épuré / Littéraire).
- **`0022`** : passe de documentation transverse, **à exécuter en dernier**.

## Issues GitHub créées (francoisnoel62/revise)
Mapping dans le METAPLAN §9. #142=`0018`, #143=`0017`, #144=`0019`, #145=`0020`, #146=`0021`, #147=`0022`. Toutes `ready-for-agent`.
**Ordre d'implémentation :** `#142 ∥ #143` → `#144`, puis `#145 ∥ #146` (après #143), puis **`#147` en dernier**.

## Points ouverts / à confirmer
- **`0017`** : la « vérif en base » (des projets utilisent-ils `kdp-5x8`/`kdp-5_25x8`/`kdp-5_5x8_5` ?) nécessite un accès DB — non fait. Le repli `default` protège de toute façon du plantage.
- **`0019`** : à confirmer à l'implémentation si un server action produit **déjà** le PDF livre-entier ou seulement par chapitre. Alternative numérotation 1 passe (reset CSS à la frontière du corps) vs 2 passes — à explorer en TDD.
- **`0022`** : deux choix proposés par défaut, à valider avec l'auteur — (a) **nouvel ADR `0006`** plutôt qu'amender `0005` ; (b) **créer `CHANGELOG.md`** (inexistant). L'auteur peut refuser l'un ou l'autre.
- La **feature `0020`** avait été « parquée » puis grillée en fin de session ; le grilling a produit la scission `0020`/`0021`.

## Prochaine action probable
Implémentation TDD de `#142` et/ou `#143`. `#147` (documentation) en tout dernier, une fois `#142`–`#146` livrés.

## Contexte projet utile
- Gouvernance : `CLAUDE.md` (TDD strict, ABOUTME, Clean Architecture, vocabulaire « auteur »). Philosophie : `.claude/philosophie.md`.
- Le vocabulaire de domaine se maintient dans `CONTEXT.md` + `docs/adr/`.
- Fichiers clés déjà identifiés (voir fiches pour le détail) : `PublicationProfile.ts`, `BookCssBuilder.ts`, `PagedJsRenderer.ts`, `PagedPdfExporter.ts`, `WholeBookHtmlAssembler.ts`, `TocHtmlBuilder.ts`, `TipTapToBookHtml.ts`, `ProjectSettings.ts`, `PresentationOverride*`, `book-preview/page.tsx`, `editor/page.tsx`.

## Suggested skills
- **`tdd-cycle`** (ou `tdd`) — obligatoire dès qu'on implémente `#142`–`#147` : test rouge avant tout code.
- **`verify`** (`/verify`) — lint → tests → build, avant tout commit de fin d'étape.
- **`commit`** — discipline git du repo (stage par nom, jamais `-A`/`--no-verify`).
- **`domain-modeling`** — nouveaux termes de `0019`/`0020`/`0021` (`BookPreviewCacheEntry`, `LevelStyleSet`, `tocDepth`/`tocStyle`) à documenter dans `CONTEXT.md`.
- **`journal`** — capter les décisions/apprentissages (fait partie du périmètre de `0022`, fichier `docs/journal/2026-07.md`).
- **`grilling`** — si de nouvelles ambiguïtés produit surgissent pendant l'implémentation.
- **`systematic-debugging`** (`/debug`) — seulement si un comportement inattendu apparaît (le risque `after()` est écarté par conception, ne pas le réintroduire).
