# Issue — `PublicationProfile` + `PagedRenderer` (généraliser les coutures)

**Phase** 1 · **Dépend de** : Spike J1 (`0002`) · **Label** : `needs-triage` → `ready-for-agent` au spike vert
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md), [CONTEXT.md](../../CONTEXT.md) (Profil de publication, Moteur de rendu paginé).

## Contexte
Le spike pose des coutures minimales. Cette issue les **durcit en abstractions de domaine pérennes** : un `PublicationProfile` (value object) et un `PagedRenderer` (interface) à implémentation unique servant aperçu **et** export — la matérialisation du « moteur unique ».

## Périmètre
**In** : `PublicationProfile` (domaine) = trim + marges (miroir) + police + tailles + interligne + retrait + règles de styles ; `BookCssBuilder` (profil → CSS) ; `TipTapToBookHtml` (JSON sémantique → HTML) ; interface `PagedRenderer` + impl Paged.js ; preset KDP 6×9 validé contre les constantes de `DocxExporter`.
**Out** : profils additionnels (`0011`), surcharges (`0009`), UI de sélection (`0010`).

## Critères d'acceptation
- [ ] `PublicationProfile` est un value object domaine pur, sans dépendance infra.
- [ ] Le preset KDP 6×9 reproduit exactement la spec de `DocxExporter`.
- [ ] Aperçu éditeur et export consomment la **même** instance de `PagedRenderer` + le **même** profil.
- [ ] Le pixel-diff du spike reste vert après refactor.

## Ancre TDD
Tests unitaires : `BookCssBuilder` émet la bonne CSS pour KDP 6×9 (marges/police/tailles) ; `PublicationProfile` valide ses invariants. Test d'intégration : un profil → CSS → Paged.js → mêmes pages des deux côtés.
