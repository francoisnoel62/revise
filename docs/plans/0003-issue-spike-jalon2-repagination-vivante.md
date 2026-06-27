# Issue — Spike J2 : re-pagination vivante (budget perf)

**Phase** 0 (spike) · **Dépend de** : J1 (`0002`) · **Label** : `ready-for-agent`
**Détail complet** : [`0001-spike-editeur-apercu-kdp-parite-pixel.md`](0001-spike-editeur-apercu-kdp-parite-pixel.md) (Jalon 2). Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md).

## Contexte
Lever le risque de perf : prouver que Paged.js re-paginate **à la pause de frappe** (débounce ~300 ms) sans lag perceptible, en préservant le curseur. C'est le verrou qui valide le « moteur unique » pour l'écriture vivante.

## Périmètre
**In** : route spike rendue éditable (TipTap) ; re-pagination débouncée de l'aperçu Paged.js à la pause ; mesure d'un budget chiffré.
**Out** : « taper directement sur les pages » (édition dans le DOM paginé) — viendra après ; tout le post-spike.

## Critères d'acceptation
- [ ] La frappe dans un chapitre réaliste (~4 000 mots) déclenche une re-pagination à la pause.
- [ ] La re-pagination à la pause tient sous le budget (**< 900 ms**, décision humaine du 2026-06-27).
- [ ] Ajouter du texte qui déborde une page fait passer le curseur à la page suivante, position correcte.
- [ ] Résultats consignés dans l'ADR 0005, section « Premier incrément — résultats » (Paged.js tient-il le budget ? sinon fallback documenté).

## Ancre TDD (test rouge d'abord)
Test de budget : frappe simulée sur fixture ~4 000 mots → assert temps de re-pagination à la pause < budget, et caret correct après débordement. Écrire le test AVANT.

## Décision de sortie
Si Paged.js ne tient pas le budget vivant : documenter le fallback (paginateur ProseMirror custom) en notant qu'il **rouvre la question de parité** (le moteur d'export devrait répliquer ses règles). Cette issue débloque/contraint les phases 1-5.
