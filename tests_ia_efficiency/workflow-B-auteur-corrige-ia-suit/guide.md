# Workflow B — L'auteur corrige, l'IA suit

**Actes couverts :** **Acte 1** (l'édition manuelle d'une fiche fait foi pour l'IA) + **Acte 3** (péremption visible, régénération à la demande).
**Durée :** ~10 min.
**C'est le test le plus important de tout le chantier.**

## Sentinelle
Le manuscrit dit explicitement que Marguerite a les **yeux bleus**. On va l'éditer à la main en **yeux violets** dans la fiche Personnages, et vérifier que l'IA suit la **fiche** (violets), pas le manuscrit (bleus).

## Étapes

1. [x] Nouveau projet. Coller `manuscrit-chapitre-1.md` dans le chapitre 1. Sauvegarder.
2. [x] cockpit → **Métadonnées** → générer **Personnages**.
   - ✅ Ouvrir la fiche : elle décrit Marguerite avec des **yeux bleus** (issu du manuscrit). Pas de repère de péremption.
3. [x] **(cœur — Acte 1)** Dans la fiche Personnages, **éditer à la main** : remplacer « yeux bleus » par « **yeux VIOLETS, injectés de mauve** ». Sauvegarder la fiche.
4. [x] Aller dans l'éditeur, à la fin du texte, taper :
   `Il s'approcha et plongea son regard dans le sien. Ses yeux étaient`
   puis **Tab**.
   - 🎯 **Attendu** : la complétion tend vers **violets / mauve** (la valeur **éditée**), pas vers « bleus ».
   - 🔁 Probabiliste : relancer 2-3 fois.
5. [ ] **(cœur — Acte 3)** Retourner dans le manuscrit, **ajouter un paragraphe** quelconque (ex. « Le facteur passa sans s'arrêter. »). Sauvegarder. Revenir à cockpit → **Métadonnées**.
   - 🎯 **Attendu** : la carte **Personnages** affiche le repère **« basé sur une version antérieure — régénérer »**.
6. [x] Cliquer **⋮ → Régénérer** sur la carte Personnages → choisir le provider → confirmer.
   - 🎯 **Attendu** : après régénération, **le repère disparaît**. (Et la fiche repart du manuscrit : Marguerite redevient « yeux bleus » — c'est normal, la régénération écrase l'édition manuelle, l'auteur a été prévenu par le dialogue.)
7. [x] Vérifier qu'une **annexe éditoriale** (créer une *Dédicace*) **n'affiche jamais** le repère de péremption.

## Verdict
- ✅ Étape 4 : la valeur **éditée** (violets) ressort → **l'auteur fait foi** (Acte 1).
- ✅ Étape 5 : le repère apparaît après modification du manuscrit (Acte 3).
- ✅ Étape 6 : le repère disparaît après régénération, et **rien ne s'est régénéré tout seul** avant ton clic.
- ✅ Étape 7 : les annexes/fiches manuelles ne sont jamais marquées périmées.

## Point de vigilance
Entre l'étape 4 (auteur prioritaire) et l'étape 6 (régénération qui écrase) : c'est volontaire et conforme à la philosophie — **l'IA propose, l'auteur décide**. La régénération est toujours un **acte explicite**, jamais automatique.
