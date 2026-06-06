# Workflow A — Du plan à la prose

**Actes couverts :** champ « Corps » (précurseur) · Acte 2 (contexte intentionnel global) · génération de chapitre · complétion.
**Durée :** ~10 min.

## Sentinelles à surveiller
Ces éléments **n'existent PAS** dans le manuscrit `manuscrit-chapitre-1.md` — ils ne vivent que dans le plan :
- **Éliane Vaucresson** (héroïne)
- **Silas Greffe** (horloger)
- **la montre à treize heures** / le **treizième chiffre**
- **Brumes-sur-Loire** (la ville)

➡️ Si l'un d'eux ressort dans une suggestion → l'IA a bien lu le plan (Acte 2).

## Étapes

1. [x] Créer un **nouveau projet**. Dans le chapitre 1, **coller** le contenu de `manuscrit-chapitre-1.md`. Sauvegarder.
2. [x] cockpit → **Recherches** → *Nouveau document* → type **Note** → Titre : « Plan du roman » → **Corps** : coller le contenu de `research-plan-global.md` (sans toucher aux tags ni au lien). Créer.
   - ✅ La carte affiche le début du corps (vérifie au passage le **champ Corps** du précurseur).
3. [x] cockpit → **Métadonnées** → générer **Analyse Narrative**, **Personnages**, **Intrigue** (laisse l'IA travailler).
4. [x] **(cœur) Complétion** : retourner dans l'éditeur, à la fin du texte, taper :
   `L'horloger leva les yeux et se présenta : — Je m'appelle`
   puis **Tab**.
   - 🎯 **Attendu** : la complétion tend vers **Silas** (Greffe) — un nom absent du manuscrit.
5. [x] **(cœur) Génération de chapitre** : lancer une génération *complète*.
   - 🎯 **Attendu** : le chapitre généré mobilise **Éliane**, **Silas**, **Brumes-sur-Loire** et/ou **la montre à treize heures**.

## Verdict
- ✅ **Réussi** si au moins une sentinelle apparaît en complétion **ou** en génération.
- 🔁 C'est probabiliste : si rien ne sort, relancer 2-3 fois (et vérifier que le provider est bien configuré).
- ❌ **Échec** si, sur plusieurs essais, aucune sentinelle n'apparaît jamais → le contexte research n'est pas injecté (à investiguer).

## Bonus (facultatif)
- [x] Modifie le **Corps** de la note : renomme l'héroïne « **Noor Bachir** ». Sauve. Relance une complétion/génération → le nouveau nom doit pouvoir ressortir **rapidement** (preuve que le cache est invalidé à l'édition d'une note — Acte 2).
