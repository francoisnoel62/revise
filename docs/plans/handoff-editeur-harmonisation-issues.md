# Handoff — Harmonisation post-épopée éditeur (profils/export, toggle preview, numérotation/perf livre entier)

## Contexte

Repo : `Revise` (assistant d'écriture IA pour auteurs de fiction). Branche courante : `claude/main-changes-since-commit-xdcnpc`.

Une épopée précédente (issues GitHub `#122`-`#135`, fiches `docs/plans/0001` à `0016`, décrite dans l'ADR [`docs/adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md`](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md) et orchestrée par [`docs/plans/METAPLAN-orchestration-refonte-editeur.md`](METAPLAN-orchestration-refonte-editeur.md)) a mis en place le moteur de rendu paginé unique (Paged.js + Chromium), les profils de publication, le contenu sémantique, les liminaires/TOC et l'aperçu livre entier. Toutes les issues `actor: agent` de cette épopée sont marquées `done` ; seule `K` (`#131`, marketplaces + preflight) reste `ready-for-human`, volontairement non traitée.

Dans cette session, l'utilisateur a demandé (1) un compte-rendu détaillé de tout ce qui a été fait depuis un commit donné (pourquoi/comment/couverture de tests), puis (2) a signalé 3 défauts concrets constatés dans l'usage réel de l'éditeur, et a mené avec moi une session d'interview/« grilling » pour cadrer les corrections. Cette session s'est terminée par la rédaction de 3 nouvelles fiches de plan (Phase 6) dans `docs/plans/`, déjà présentes dans le dépôt (non commitées à ce stade) :

- [`0017-issue-harmoniser-profils-export.md`](0017-issue-harmoniser-profils-export.md)
- [`0018-issue-toggle-apercu-editeur.md`](0018-issue-toggle-apercu-editeur.md)
- [`0019-issue-numerotation-perf-livre-entier.md`](0019-issue-numerotation-perf-livre-entier.md)

Ces 3 fichiers contiennent déjà : contexte détaillé avec références fichier:ligne, décisions produit arbitrées avec l'utilisateur (à ne pas rouvrir), périmètre In/Out, critères d'acceptation en checklist, ancre TDD. **Ne pas dupliquer leur contenu ici — les lire directement**, ils sont la source de vérité pour la suite.

## État exact du dépôt au moment du handoff

```
git status --short
?? docs/plans/0017-issue-harmoniser-profils-export.md
?? docs/plans/0018-issue-toggle-apercu-editeur.md
?? docs/plans/0019-issue-numerotation-perf-livre-entier.md
```

Aucun code source touché. Ces 3 fichiers ne sont pas encore commités (le repo interdit `git add -A`/`git add .` — stager par nom si un commit est demandé).

## Résumé des 3 sujets couverts par les fiches (voir les fiches pour le détail complet)

1. **`0017`** — L'aperçu propose 6 profils de publication mais l'export PDF ignore le profil actif (toujours câblé en dur sur KDP 6×9) et le DOCX est un système disjoint de `PublicationProfile`. Les deux exporteurs injectent aussi un titre de chapitre automatique que l'aperçu live ne montre jamais (source de duplication + décompte de pages faux). Décision : réduire à 3 profils réellement exportables (kdp-6x9→PDF/Amazon, a5→PDF/TheBookEdition, passerelle→DOCX/Google Docs), lien strict et symétrique profil↔format d'export, suppression de l'injection de titre (précédence : heading sémantique `titre-de-chapitre` > métadonnée `chapter.title` > rien), DOCX réduit à un seul style rattaché à `passerelle`.
2. **`0018`** — Le panneau de prévisualisation de l'éditeur est actuellement imposé (toujours visible, pas de toggle). Décision : ajouter un bouton masquer/afficher, masquage **CSS uniquement** (le composant `PublicationPreview` reste monté, pas de démontage, pas de persistance de préférence).
3. **`0019`** — L'aperçu « livre entier » a un bug de numérotation (le compteur de page ne se réinitialise jamais après les liminaires, donc la 1ère page du corps affiche un numéro décalé) et un problème de performance (rendu monolithique Paged.js côté navigateur, jamais mesuré à l'échelle d'un vrai roman — le test de perf existant tourne sur une fixture de 2 chapitres/47 mots). Décision : cache serveur par profil (jusqu'à 3 entrées/projet), recalcul **éager** via `after()` de Next.js 16 (première utilisation dans ce repo — **aucune infra de queue/Redis n'existe**, un risque explicite est documenté dans la fiche sur la limite de durée serverless réelle, à valider avant de considérer le mécanisme fiable en prod), numérotation en deux passes (mesure du nombre de pages liminaires puis rendu du corps avec le bon `counter-reset`), nouvelle fixture réaliste (~300-400 pages) pour un vrai test de perf.

## Décisions déjà tranchées avec l'utilisateur (ne pas rouvrir sans raison forte)

- Aucun projet réel n'utilise les profils `kdp-5x8`/`kdp-5_25x8`/`kdp-5_5x8_5` retirés — pas de migration de données nécessaire.
- DOCX et PDF sont TOUS DEUX à rattacher strictement au profil actif (correction explicite de l'utilisateur en cours de session : « que ce soit docx ou pdf, les deux fonctionnalités doivent être rattachées et liées au profil de visualisation choisi »).
- Repli du titre de chapitre : heading sémantique du corps d'abord, `chapter.title` en second recours.
- Toggle preview : masquage CSS seulement, pas de démontage, pas de persistance.
- Perf livre-entier : cache serveur + recalcul éager (pas de lazy, pas de réécriture incrémentale réutilisant `useBookPageOffset`), cache par profil avec sélecteur dédié dans l'aperçu livre-entier, recalcul limité aux profils déjà en cache + coalescing anti-rafale.
- Découpage retenu : 3 issues séparées (comme l'épopée précédente), pas un chantier unique.

## Prochaines étapes possibles (proposées à l'utilisateur en fin de session, pas encore choisies)

1. Mettre à jour `docs/plans/METAPLAN-orchestration-refonte-editeur.md` avec une section Phase 6 pointant vers ces 3 fiches (le métaplan actuel dit encore « toutes les issues agent sont done », ce qui est désormais obsolète).
2. Créer les issues GitHub correspondantes (`gh issue create`) — **attendre le feu vert explicite de l'utilisateur avant cette étape**, conformément à la règle du repo (« STOP — demander validation » avant toute création d'issue, cf. l'ancien métaplan §6).
3. Démarrer l'implémentation TDD de l'une des 3 fiches. Recommandation donnée en fin de session précédente : commencer par `0018` (le plus isolé, le moins risqué, aucune dépendance dure sur les deux autres).

Si l'utilisateur n'a rien précisé sur laquelle de ces 3 étapes il veut faire ensuite, le lui demander explicitement plutôt que de supposer.

## Repères utiles pour la suite (fichiers clés déjà identifiés, voir les fiches 0017/0018/0019 pour le détail)

- `src/domain/value-objects/PublicationProfile.ts`, `src/components/editor/PublicationProfileSelector.tsx`
- `src/infrastructure/document/paged/TipTapToBookHtml.ts`, `BookCssBuilder.ts`
- `src/infrastructure/document/exporters/PagedPdfExporter.ts`, `DocxExporter.ts`
- `src/components/document/ExportDialog.tsx`, `src/app/actions.ts`
- `src/app/editor/page.tsx` (layout deux colonnes, ligne ~813-851)
- `src/app/book-preview/page.tsx`, `src/app/actions/book-preview-actions.ts`
- `src/app/actions/chapter-actions.ts` (`updateChapterContentAction`, point d'accroche pour le hook éager `0019`)
- `src/application/services/WholeBookHtmlAssembler.ts`
- `src/hooks/useBookPageOffset.ts`, `src/components/editor/BackgroundPageCounter.tsx`

## Suggested skills

- **`tdd-cycle`** — obligatoire dès que l'implémentation de `0017`/`0018`/`0019` démarre (TDD strict imposé par `CLAUDE.md` : test rouge avant toute implémentation).
- **`systematic-debugging`** (ou `/debug`) — si l'investigation du risque `after()`/limite serverless documenté dans `0019` révèle un comportement inattendu en environnement réel.
- **`verify`** (`/verify`) — avant tout commit de fin d'étape (lint → tests → build), conformément à `CLAUDE.md`.
- **`domain-modeling`** — si l'implémentation de `0017` (précédence de titre, réduction des profils) ou `0019` (`BookPreviewCacheEntry`) introduit de nouveaux termes de domaine à documenter dans `CONTEXT.md`.
- **`commit`** — pour respecter la discipline git du repo (jamais `git add -A`/`.`, jamais `--no-verify`, stager par nom).
- **`grilling`** — si de nouvelles décisions produit ambiguës apparaissent pendant l'implémentation (le pattern d'interview a bien fonctionné dans cette session pour cadrer des choix à conséquences sur les données/l'architecture).
