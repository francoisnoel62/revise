# Workflow D — Boucle research → écriture → fraîcheur

**Actes couverts :** **Acte 2** (univers global injecté) + **Acte 3** (péremption après que le manuscrit a grossi) → la **boucle dérivé ↔ intentionnel** au complet.
**Durée :** ~15 min.

## Sentinelles (univers, absentes du manuscrit)
- **Xérion** (la planète) · **soleil double** (rouge + bleu) · **pluie d'acide** · les **éclats** (monnaie) · les **ramasseurs** · « **on ne prête jamais sa combinaison** ».

➡️ Le manuscrit parle de pluie, de combinaison, de dôme, mais **ne nomme rien** de la bible. Si ces mots ressortent → l'univers global est injecté (Acte 2).

## Étapes

1. [x] Nouveau projet. Coller `manuscrit-chapitre-1.md` dans le chapitre 1. Sauvegarder.
2. [x] cockpit → **Recherches** → Note → Titre « Bible d'univers » → **Corps** = `research-univers-global.md`. Créer.
3. [ ] **(Acte 2) Complétion** : en fin de texte, taper `Au coin de la rue, un vieux ramasseur lui tendit la main et demanda` puis **Tab**.
   - 🎯 **Attendu** : surgissement de **éclats** / **Xérion** / **combinaison** / **soleil double**.
4. [ ] **(Acte 2) Génération de chapitre** *complet*.
   - 🎯 **Attendu** : le chapitre mobilise l'univers (dômes, éclats, pluie d'acide, la règle « on ne prête jamais sa combinaison »).
5. [ ] cockpit → **Métadonnées** → générer **Univers** + **Analyse Narrative**.
6. [ ] **(Acte 3) Faire grossir le manuscrit** : insère le chapitre généré (ou ajoute plusieurs paragraphes) dans l'éditeur. Sauvegarder. Revenir à **Métadonnées**.
   - 🎯 **Attendu** : les cartes **Univers** et **Analyse Narrative** affichent le repère **« version antérieure »**.
7. [ ] **Régénérer** l'Univers → le repère disparaît, l'analyse intègre le texte enrichi.
8. [ ] **(boucle — Acte 2 ↔ invalidation)** Édite la bible : change la monnaie en « **les ombres** » au lieu des éclats. Sauve. Relance une complétion.
   - 🎯 **Attendu** : « **ombres** » peut désormais ressortir **rapidement** (cache de contexte invalidé à l'édition d'une note).

## Verdict
- ✅ 3-4 : l'univers global nourrit complétion et génération (Acte 2).
- ✅ 6-7 : la péremption apparaît quand le manuscrit change, et se résout à la régénération (Acte 3).
- ✅ 8 : éditer une note se répercute vite sur les suggestions (invalidation de cache).
- 🔁 Tout est probabiliste : 2-3 relances si une sentinelle ne sort pas.

## Ce que ce workflow démontre
La boucle complète de la stratégie : l'auteur écrit son **intention** (bible) → l'IA s'en sert pour **produire** → le manuscrit grossit → les **analyses dérivées** se signalent périmées → l'auteur les rafraîchit → elles repartent du texte (lui-même nourri par l'intention). Dérivé et intentionnel tournent ensemble.
