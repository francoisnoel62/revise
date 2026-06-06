# Workflow C — Non-régression multi-providers

**Actes couverts :** non-régression des 3 features IA après la bascule providers (Acte 1, Phase 3) sur **Claude / OpenAI / Gemini**.
**Durée :** ~10 min (3 min par provider).

## Ce qu'on vérifie
Après le gros refactor de l'Acte 1 (les providers reçoivent un bloc de contexte string), les 3 features doivent marcher à l'identique sur chaque provider, et la **langue doit être préservée** (FR → FR).

## Étapes (à répéter pour CHAQUE provider configuré)

1. [ ] Nouveau projet (ou réutiliser). Coller `manuscrit-passage.md` dans le chapitre 1. Sauvegarder.
2. [ ] cockpit → providers : **assigner le provider à tester** au projet (Claude, puis OpenAI, puis Gemini).
3. [ ] **Reformulation** : sélectionner la phrase
   `Les mots étaient restés coincés quelque part entre sa gorge et son orgueil.`
   → action **Reformuler**.
   - 🎯 **Attendu** : **exactement 3 propositions** étiquetées **épuré**, **lyrique**, **amplifié**, **en français**, sans changement de sens.
4. [ ] **Complétion** : en fin de texte, taper `Il sortit son téléphone et` puis **Tab**.
   - 🎯 **Attendu** : une suggestion fluide, **en français**, cohérente avec le ton.
5. [ ] **Génération de chapitre** : lancer une génération *début de chapitre*.
   - 🎯 **Attendu** : du contenu pertinent, en français.
6. [ ] Générer une **Analyse Narrative** (cockpit → Métadonnées) pour vérifier que les analyses marchent aussi sur ce provider.

## Tableau de relevé
| Provider | Reformulation (3 variations FR) | Complétion FR | Génération FR | Analyse OK |
|---|---|---|---|---|
| Claude | ☐ | ☐ | ☐ | ☐ |
| OpenAI | ☐ | ☐ | ☐ | ☐ |
| Gemini | ☐ | ☐ | ☐ | ☐ |

## Verdict
- ✅ **Réussi** si les 4 colonnes sont cochées pour chaque provider configuré.
- ❌ Échec si une feature plante, renvoie autre chose que 3 propositions, ou **change de langue** (ex. propositions en anglais).

> Astuce : si une seule clé API est disponible, teste au moins ce provider à fond. Les 3 partagent le même code de placement du contexte depuis l'Acte 1.
