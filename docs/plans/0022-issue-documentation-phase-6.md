# Issue — Mettre à jour toute la documentation après la Phase 6

**Phase** 6 (clôture) · **Dépend de** : `0017`, `0018`, `0019`, `0020`, `0021` (documente ce qui a réellement été livré) · **Label** : `ready-for-agent`
**Porte** : ne démarrer que lorsque `0017`–`0021` sont `done` (on ne documente pas une cible mouvante).
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md), [CLAUDE.md](../../CLAUDE.md), [CONTEXT.md](../../CONTEXT.md).

## Contexte

La Phase 6 change des comportements **visibles par l'auteur** (export lié au profil, titres depuis le corps, aperçu livre-entier = PDF, toggle d'aperçu, typographie par niveau, sommaire configurable) et des éléments **d'architecture/infra** (aperçu généré côté serveur, cache **GridFS**, abandon de `after()`). La documentation — utilisateur **et** technique — doit refléter cet état. Cette issue est une **passe de documentation transverse**, exécutée **en dernier**.

> **Nature particulière.** Peu de logique métier neuve : surtout de la **rédaction** et des mises à jour de contenu. Le cycle TDD rouge→vert ne s'applique pas au texte. Règle : tout fichier **code** touché (pages `.tsx` du guide/landing) conserve son en-tête `ABOUTME` et **ne casse aucun test existant** (`npm run verify` vert). Aucune invention : ne documenter que ce qui est réellement livré (vérifier dans le code, pas dans les fiches).

## Périmètre — inventaire des cibles (vérifié dans le repo)

**Documentation projet (Markdown)**
- [ ] `README.md` (racine) — liste des fonctionnalités : profils réduits à 3, export lié au profil, aperçu livre-entier fidèle (= PDF), typographie par niveau, sommaire configurable.
- [ ] `docs/architecture.md` — moteur paginé ; aperçu livre-entier **serveur** + cache **GridFS** (métriques + PDF) ; pipeline d'export unifié ; suppression du chemin de pagination navigateur.
- [ ] `CONTEXT.md` — glossaire/domaine : nouveaux termes (`BookPreviewCacheEntry`, `LevelStyleSet`, `tocDepth`/`tocStyle`, règle de titre stricte, 3 profils) ; retirer les mentions des 3 profils KDP supprimés.
- [ ] `docs/adr/` — **nouvel ADR** (ex. `0006`) actant les décisions d'architecture de la Phase 6 : « aperçu livre-entier = PDF d'export, calcul serveur paresseux + cache GridFS, abandon du recalcul éager `after()` ». Amender `0005` par un lien plutôt que le réécrire.
- [ ] `docs/journal/2026-07.md` — **nouvelle entrée** (mois de juillet) via la logique du skill `journal` : décisions du grilling 2026-07-04, pivot métriques→PDF, correctif `h2<h1`, split `0020`/`0021`.
- [ ] `docs/README.md` — index des docs : ajouter les pointeurs vers le nouvel ADR et les guides mis à jour.
- [ ] `docs/user-guide.md` — guide utilisateur Markdown : sections export/profils, aperçu livre-entier, typographie, sommaire.
- [ ] `docs/developer/api-reference.md` — si des server actions ont changé de signature (`getBookPreviewDataAction` étendu au `profileId` ; actions `project-settings` pour styles/TOC ; export lié au profil).
- [ ] `CLAUDE.md` — **seulement si nécessaire** : mentionner la réalité « 3 profils » si une règle de gouvernance y fait référence. Ne pas gonfler ce fichier (règle : procédures répétables dans les skills, pas ici).

**Guide utilisateur in-app (React/`.tsx`)**
- [ ] `src/app/guide/editeur/page.tsx` — le plus impacté : toggle d'aperçu, export dérivé du profil, titre depuis le corps, panneau de typographie par niveau.
- [ ] `src/app/guide/page.tsx` (index) — ajouter les entrées vers les nouvelles rubriques si besoin.
- [ ] Vérifier `src/app/guide/manuscrit/page.tsx` et `src/app/guide/cockpit/page.tsx` pour toute mention devenue fausse (profils, export, aperçu).

**Landing page (marketing)**
- [ ] `src/app/page.tsx` — mettre en avant les nouveaux arguments : **aperçu WYSIWYG fidèle à l'export**, **profils de publication** (KDP 6×9 / A5 / partage), **aperçu livre-entier**, **mise en page par l'auteur** (typographie + sommaire).

**Changelog (à créer)**
- [ ] `CHANGELOG.md` (racine, **inexistant aujourd'hui**) — créer au format « Keep a Changelog », avec une entrée Phase 6 listant les changements visibles (`0017`–`0021`) et le correctif `h2`.

## Décisions à acter (petites, dans la fiche)

1. **Nouvel ADR vs amender `0005`** → recommandation : **nouvel ADR `0006`** (le pivot aperçu=PDF + cache GridFS est une décision distincte), avec renvoi depuis `0005`.
2. **Créer `CHANGELOG.md`** au format Keep a Changelog → recommandé (référence unique des changements visibles, utile aussi pour la landing/guide).
3. **Journal** : entrée `2026-07.md` (le fichier de juin ne doit pas être étendu au-delà de son mois).

## Critères d'acceptation

- [ ] Chaque cible de l'inventaire ci-dessus est soit **mise à jour**, soit **explicitement marquée sans changement** (avec la raison), aucune n'est oubliée.
- [ ] Aucune documentation ne mentionne encore les 3 profils KDP supprimés, l'injection de titre, ni la pagination navigateur de l'aperçu livre-entier.
- [ ] Le guide in-app et la landing décrivent le comportement **réellement livré** (vérifié dans le code, captures/textes à jour).
- [ ] `CHANGELOG.md` existe et couvre la Phase 6 ; un nouvel ADR acte l'aperçu=PDF + cache GridFS ; le journal de juillet est écrit.
- [ ] `npm run verify` vert (les pages `.tsx` touchées gardent `ABOUTME` et leurs tests).

## Ancre TDD / vérification

Pas de cycle rouge→vert sur du texte. Vérifications :
- Les pages `.tsx` modifiées conservent `ABOUTME` (hook `check-edit`) et leurs tests de rendu existants passent.
- Relecture croisée : ouvrir chaque comportement Phase 6 dans le code et confirmer que la doc correspondante le décrit sans écart (pas de doc « en avance » sur du non-livré).
- `npm run verify` (lint → tests → build) vert avant commit.
