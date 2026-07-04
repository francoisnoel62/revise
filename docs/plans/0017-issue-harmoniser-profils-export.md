# Issue — Harmoniser les profils de prévisualisation avec les possibilités d'export réelles

**Phase** 6 · **Dépend de** : `0005`, `0006`, `0007`, `0011` · **Label** : `ready-for-agent`
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md), [CONTEXT.md](../../CONTEXT.md) (Profils de publication / Export).

> **Note de révision (grilling du 2026-07-04).** Deux décisions ont été **durcies** par rapport à la version précédente : (a) le titre de chapitre passe en **fidélité stricte sans repli** (le repli sur `chapter.title` réintroduisait la divergence aperçu/export qu'on veut supprimer) → **migration unique** + H1 par défaut pour les nouveaux chapitres ; (b) la suppression des 3 profils KDP est **sécurisée** (vérification en base + repli `default` dans `fromId` + migration si besoin) plutôt que « supprimée sec en faisant confiance ».

## Contexte

Le sélecteur de profil (`PublicationProfileSelector.tsx`) propose 6 profils (`kdp-6x9`, `kdp-5x8`, `kdp-5_25x8`, `kdp-5_5x8_5`, `a5`, `passerelle`), mais l'export réel ne les honore pas tous :

- L'export PDF (`providers.ts` → `PagedPdfExporter.ts`) **ignore le profil actif** et retombe toujours sur `PublicationProfile.kdpSixByNine()`. La server action `exportProjectPdf` (`actions.ts`, via `ExportDialog.tsx`) ne transmet jamais de profil.
- L'export DOCX (`DocxExporter.ts`) est un système **totalement disjoint** de `PublicationProfile` : ses presets `kdp`/`neutral`/`structured` ont leur propre géométrie câblée en dur (`KDP_PAGE_WIDTH=8640`, etc.), sans aucune référence à `PublicationProfile`.
- Les deux exporteurs injectent systématiquement un `<h1>{chapter.title}</h1>` avant le corps (`PagedPdfExporter.ts:98`, `WholeBookHtmlAssembler.ts:31`, `DocxExporter.ts`), avec un dédup fragile côté PDF (`TipTapToBookHtml.startsWithTitleHeading`, ne marche que si le premier heading du corps correspond **exactement**, par le texte, au champ métadonnée) et **aucune protection côté DOCX**.
- L'aperçu live de l'éditeur (`PublicationPreview.tsx`) n'injecte jamais ce titre (`converter.convert()`, jamais `convertChapter()`) — l'auteur ne voit donc jamais ce qui sera ajouté à l'export : risque de titre dupliqué et décompte de pages faux pendant l'écriture (`useBookPageOffset`/`BackgroundPageCounter` mesurent un rendu plus court que l'export).

## Décisions produit (arbitrées, ne pas rouvrir)

1. **3 profils réellement exportables** : `kdp-6x9` (Amazon KDP → PDF), `a5` (TheBookEdition → PDF), `passerelle` (Google Docs → DOCX). Suppression des factory methods `kdpFiveByEight()`, `kdpFiveQuarterByEight()`, `kdpFiveHalfByEightHalf()` de `PublicationProfile.ts` et retrait des identifiants correspondants du type `PublicationProfileId`. Les tests qui les référencent (`PublicationProfile.test.ts`, `BookCssBuilder.test.ts`, etc.) sont **adaptés**, jamais supprimés.
   - **Suppression sécurisée (durcie le 2026-07-04).** `fromId()` n'a aujourd'hui **aucun cas `default`** : retirer les 3 cas ferait renvoyer `undefined` (puis un plantage `.values`) pour tout projet dont le profil stocké est l'un des trois → écran cassé. Donc :
     - (a) **Vérifier en base** : requête sur la collection des projets pour compter ceux dont `profileId` ∈ {`kdp-5x8`, `kdp-5_25x8`, `kdp-5_5x8_5`}.
     - (b) **Filet de sécurité** : ajouter à `fromId()` un cas `default` qui, face à un identifiant inconnu/supprimé, retombe proprement sur `PublicationProfile.kdpSixByNine()` (jamais de `undefined`).
     - (c) **Migration si besoin** : si (a) trouve des projets concernés, une migration les repasse en `kdp-6x9`.
2. **Le profil actif détermine intégralement et exclusivement le format d'export — pour DOCX comme pour PDF, symétriquement.**
   - Profil `kdp-6x9` ou `a5` actif → seul un export **PDF** est proposé, généré avec ce profil exact (plus de défaut `kdpSixByNine()` câblé en dur dans `PagedPdfExporter`).
   - Profil `passerelle` actif → seul un export **DOCX** est proposé, avec la géométrie de `PublicationProfile.passerelle()`.
   - `ExportDialog.tsx` n'offre plus de sélection libre de format ni de `DocxStylePreset` : le format est **dérivé du profil actif**, affiché en lecture. (Conséquence d'usage assumée : pour changer de format d'export, on change le profil actif du projet — un profil = une cible de publication.)
3. **Titre de chapitre : fidélité stricte, sans repli (durci le 2026-07-04).** Suppression de l'injection automatique de `<h1>{chapter.title}</h1>` dans `PagedPdfExporter.ts`, `WholeBookHtmlAssembler.ts` **et** `DocxExporter.ts`. Le titre affiché sur la page (et dans l'entrée de sommaire) provient **exclusivement** du heading portant `semanticRole: 'titre-de-chapitre'` dans le **corps** du chapitre — exactement ce que l'auteur voit dans son aperçu live. **Pas de repli sur `chapter.title`** : le repli réinjectait, pour les chapitres sans titre dans le corps, un titre que l'aperçu ne montre jamais → il ré-ouvrait la divergence aperçu/export que cette issue veut fermer. `chapter.title` (le nom du chapitre dans la liste) ne sert plus qu'à l'**étiquette** de navigation et du sommaire, jamais comme titre imprimé.
   - **Migration unique** : un passage sur tous les chapitres existants insère un H1 `titre-de-chapitre` (texte = nom du chapitre) en tête de tout chapitre qui n'en a pas, pour ne perdre **aucun** titre déjà exporté. (L'outil `ContentMigrator` existe pour ce type de transformation ; la couche présentation reste intacte, on ne touche que la structure sémantique.)
   - **Nouveaux chapitres** : la création d'un chapitre démarre désormais **toujours** avec un H1 `titre-de-chapitre`, pour que le cas « chapitre sans titre dans le corps » ne réapparaisse jamais.
   - Comme il n'y a plus d'injection, `convertChapter()` (avec son `startsWithTitleHeading`/strip) n'a plus lieu d'être : le corps rend son propre heading, donc **aperçu (`convert()`) et export rendent le même HTML**.
4. **`DocxExporter` réduit à un seul style**, rattaché exclusivement à `passerelle` : suppression des presets `kdp`/`neutral`/`structured` et des constantes géométriques câblées en dur, remplacées par la lecture de `PublicationProfile.passerelle().values` (marges, police, format). Applique la même règle de titre qu'au point 3 (titre depuis le corps, aucune injection).
5. **Aucun changement requis côté comptage de pages** (`useBookPageOffset`/`BackgroundPageCounter`) : ces composants mesuraient déjà un rendu sans titre injecté. C'est l'export qui s'aligne désormais sur ce que le comptage mesurait — la divergence disparaît **pour tous les chapitres** une fois le point 3 + la migration en place (plus de cas « fallback » divergent).

## Périmètre

**In** : nettoyage de `PublicationProfile.ts` (suppression de 3 factory methods + type `PublicationProfileId` + **cas `default` dans `fromId`**) et `PublicationProfileSelector.tsx` (3 options) ; **vérification en base** des projets sur profils supprimés + **migration** éventuelle vers `kdp-6x9` ; suppression de l'injection de titre dans les 3 exporteurs, titre **uniquement** depuis le heading sémantique du corps (pas de repli) ; **migration unique** insérant un H1 `titre-de-chapitre` dans les chapitres sans titre + **H1 par défaut** à la création d'un chapitre ; branchement réel du profil actif dans le pipeline d'export PDF de bout en bout (`ExportDialog.tsx` → `actions.ts` → `PagedPdfExporter`) ; réduction de `DocxExporter` à un seul style `passerelle` ; refonte de `ExportDialog.tsx` (format dérivé du profil, plus de sélection libre de format ni de preset).

**Out** : cache/performance de l'aperçu livre entier (`0019`) ; toggle de visibilité de la prévisualisation (`0018`) ; styles globaux par niveau de texte (futur `0020`) ; profils marketplaces additionnels et preflight (`0012`, reste `ready-for-human`).

## Critères d'acceptation

- [ ] Le sélecteur de profil ne propose que `kdp-6x9`, `a5`, `passerelle`.
- [ ] `fromId()` possède un cas `default` retombant sur `kdp-6x9` : un identifiant supprimé/inconnu **ne plante pas**, il ouvre le projet en `kdp-6x9`.
- [ ] La base a été vérifiée ; si des projets utilisaient un profil supprimé, ils ont été migrés vers `kdp-6x9`.
- [ ] Un projet en profil `kdp-6x9` ou `a5` ne peut exporter qu'en PDF, avec exactement ce profil (assertion sur la géométrie du PDF produit, pas seulement l'absence d'erreur).
- [ ] Un projet en profil `passerelle` ne peut exporter qu'en DOCX, avec la géométrie de `PublicationProfile.passerelle()`.
- [ ] Aucun export (PDF ou DOCX) n'injecte de titre : le titre affiché est **celui du heading sémantique `titre-de-chapitre` du corps**, **sans repli** sur `chapter.title` ; un chapitre sans ce heading n'affiche aucun titre imprimé (mais reste listé par son nom au sommaire/navigation).
- [ ] La migration unique a inséré un H1 `titre-de-chapitre` dans les chapitres qui n'en avaient pas ; un chapitre nouvellement créé démarre avec un H1 `titre-de-chapitre`.
- [ ] Le nombre de pages compté pendant l'écriture (`useBookPageOffset`) correspond exactement au nombre de pages produit à l'export pour un même chapitre (non-régression croisée).
- [ ] `ExportDialog.tsx` n'offre plus de choix de `DocxStylePreset` ni de sélection libre de format — le format est dérivé du profil actif.

## Ancre TDD

> **Discipline TDD (obligatoire).** Test **rouge avant** toute implémentation ; jamais supprimer un test qui échoue ; **aucun mock en E2E**. Écrire les tests en **outside-in**, autant que le sujet le permet, dans l'ordre **E2E → intégration → unit**.
> **E2E d'abord :** un projet en `kdp-6x9`/`a5` n'exporte qu'un **PDF** au bon format ; un projet `passerelle` qu'un **DOCX** ; aucun titre de chapitre injecté distinct du corps.
> **Puis intégration :** server action d'export liée au profil actif ; migration de contenu (H1) ; migration de profils supprimés.
> **Puis unit :** `PublicationProfile.fromId`, `TipTapToBookHtml` (titre depuis le corps), `DocxExporter`, `ExportDialog`.

Tests à écrire/adapter (rouge avant implémentation) :
- `PublicationProfile.test.ts` : `fromId('kdp-5x8' | 'kdp-5_25x8' | 'kdp-5_5x8_5')` retombe sur `kdp-6x9` (cas `default`), ne renvoie jamais `undefined`.
- Migration de données : un projet stocké sur un profil supprimé est repassé en `kdp-6x9`.
- `PagedPdfExporter.test.ts` : le profil transmis à l'export est celui du projet actif, jamais un défaut implicite ; aucun `<h1>` de titre injecté.
- `DocxExporter.test.ts` : un seul style produit, géométrie identique à `PublicationProfile.passerelle()`, aucun titre injecté.
- `TipTapToBookHtml.test.ts` : le titre vient du heading sémantique du corps ; **aucun repli** sur `chapter.title` ; `convert()` (aperçu) et le rendu d'export produisent le même HTML.
- Migration de contenu (`ContentMigrator`) : un chapitre sans H1 `titre-de-chapitre` reçoit un H1 en tête ; un chapitre qui en a déjà un n'est pas modifié (idempotence).
- Création de chapitre : le contenu initial contient un H1 `titre-de-chapitre`.
- `ExportDialog.test.tsx` : le format proposé est dérivé du profil actif, pas de sélection libre.
- Test d'intégration : nombre de pages `useBookPageOffset` pour un chapitre fixture == nombre de pages du PDF exporté pour ce même chapitre.
