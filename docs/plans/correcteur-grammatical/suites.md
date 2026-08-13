# Suites du correcteur grammatical

Ce document liste ce qui reste à faire **après** l'atterrissage de `codex/grammalecte`
dans `main`. La conception est dans [plan.md](plan.md) ; le récit du merge est dans
[atterrissage.md](atterrissage.md) ; l'ordre d'exécution, les lots et leurs vérifications
sont dans [suites-plan.md](suites-plan.md). Ici : uniquement les constats.

## État au 12 août 2026

`codex/grammalecte` est mergée dans `main` (commit de merge `1c67330`, 26 commits,
126 fichiers, +6 819 / −1 487) et supprimée, en local comme sur `origin`.

Portes mesurées sur `main` juste avant le merge :

| Porte | Résultat |
|---|---|
| `lint` | ✅ 0 |
| unitaires (`npm test`) | ✅ 3 523 verts / 13 ignorés |
| `build` | ✅ 0 |
| E2E | ✅ 98–99 verts, 1 aléa préexistant (`autocomplete.spec.ts`) |

Trois issues restaient ouvertes et étiquetées `needs-triage` : **#185**, **#186**, **#187**.
Elles n'étaient pas des oublis — elles avaient été volontairement sorties du périmètre de la
livraison. Elles sont triées depuis le 13 août 2026 : **#185 est close** (voir §2), **#186**
est `ready-for-human`, **#187** est `ready-for-agent`.

---

## 1. `.gitattributes` — la classe entière du bug CRLF

**Ce qu'il faut faire.** Ajouter un `.gitattributes` à la racine qui fixe les fins de ligne
des fichiers de données, dans son propre commit.

**Pourquoi maintenant.** C'est la phase 3 explicitement reportée par
[atterrissage.md](atterrissage.md), et elle ne pouvait pas se faire pendant la livraison :
un `.gitattributes` change la façon dont les fichiers sont écrits sur le disque de chaque
machine. La livraison est finie, l'obstacle a disparu.

**La preuve que ça vaut le coup.** Les corpus
`src/infrastructure/grammar/fixtures/fiction-{clean,errors}.txt` sont découpés sur
`\n\n---\n\n`. Avec `core.autocrlf=true`, le checkout Windows les écrit en CRLF et le
découpage renvoyait **1 paragraphe au lieu de 15** : les deux seuils du moteur portaient
sur un texte quasi vide et passaient au vert sans rien mesurer. Le correctif appliqué rend
le séparateur tolérant (`/\r?\n\r?\n---\r?\n\r?\n/`) — il soigne ces deux fichiers, pas la
classe. Le prochain fichier de données silencieusement vidé ne préviendra pas davantage.

Le commit `a5b8299` a d'ailleurs contourné le problème plutôt que de l'affronter :
`e2e/helpers/hiroshima-corpus.ts` est un **module TypeScript et non un `.txt`**, précisément
pour ne pas dépendre des fins de ligne du checkout. C'est un aveu, pas une solution.

---

## 2. Le sort de nspell (#185) — tranché : nspell reste

**Décision du 13 août 2026 : nous ne changeons pas de correcteur orthographique pour
l'instant.** #185 est close en `wontfix`. Ce qui suit reste écrit parce que c'est ce qui
rouvrirait la question, pas parce que c'est à faire.

**Les chiffres qui plaidaient pour le changement.** Revise fait tourner deux moteurs pour un
seul travail depuis le merge. À l'initialisation : nspell ≈ **7 s et 305 Mo**, Grammalecte
≈ **0,9 s et 49 Mo**. Le correcteur réputé le plus complexe démarre 8× plus vite que celui
déjà en production, parce qu'il utilise une structure compressée là où nspell déplie tout
en mémoire.

**Ce qu'il aurait fallu mesurer pour basculer** (repris de #185, à mesurer et non à supposer) :

- Comparer la **qualité des suggestions** sur un échantillon réel de fautes de frappe.
  C'est le point bloquant : si Grammalecte suggère moins bien, le gain au démarrage ne
  compense pas.
- Décider du sort du **dictionnaire personnel existant** : migration, double écriture,
  ou reconstruction.
- Arbitrer l'**acceptation inconditionnelle des majuscules**, qui rend aujourd'hui invisible
  toute faute en début de phrase. Documentée et testée comme intentionnelle, mais un lexique
  morphologique rend peut-être la béquille inutile. Décision produit.
- Chiffrer l'impact sur les **E2E d'orthographe**, nombreux, sériels, et dont les assertions
  portent sur des suggestions précises.
- Décider si l'orthographe **reste au fil de la frappe** ou bascule à la demande comme la
  grammaire. Sur un moteur commun, la question se repose.

**Ce que la décision change ailleurs dans ce document.** §4 n'attend plus rien : la dette du
correcteur orthographique ne partira pas avec un moteur qui reste, elle est donc à payer.
Et dans §3, le cluster « orthographe » reste chez nspell — ces fautes-là ne seront pas
rattrapées par Grammalecte.

---

## 3. Le trou de rappel mesuré sur de la vraie prose

**Ce qu'il faut faire.** Reprendre les fautes que le correcteur ne voit pas, cluster par
cluster, et relever les planchers du test au fur et à mesure.

**Ce qui est mesuré aujourd'hui.** `e2e/ai-strategy/grammar-real-text.spec.ts` sème une page
de prose portant **98 fautes listées par l'auteur**. Le correcteur produit 99 soulignements
et attrape **66 des 98** (67 selon le moteur ; l'heuristique de recoupement du test en perd
un). Les planchers assertés sont volontairement sous la mesure — 70 plages signalées,
55 fautes connues attrapées — pour qu'une dérive du jeu de règles ne passe pas au rouge
mais qu'un effondrement du rappel, si.

**Les ~32 fautes manquées ne sont pas un bruit indifférencié.** Elles se regroupent, et les
groupes disent chacun où aller :

| Cluster | Où le traiter |
|---|---|
| Fautes d'**orthographe** et non de grammaire | nspell — c'est l'autre moteur qui devrait les voir, et il reste (§2) |
| **Traits d'union** | §5 / #186 — la micro-typographie est coupée *exprès* dans le profil fiction ; ces fautes ne sont pas manquées, elles sont hors périmètre par décision |
| Homophones **`c'est` / `s'est`** | Sans propriétaire aujourd'hui. Relève de la famille `conf`, qui est active. À investiguer pour de vrai : règle absente du jeu, ou désactivée par le profil ? |

Le troisième cluster est le seul vrai trou : les deux premiers ont déjà un ticket. Il mérite
son propre ticket une fois la cause établie.

**Quand relever `MIN_FLAGGED_RANGES` et `MIN_KNOWN_MISTAKES_CAUGHT`** : à chaque amélioration
constatée. Un plancher qu'on ne remonte jamais cesse de mesurer quoi que ce soit.

---

## 4. Dette architecturale du correcteur orthographique (#187)

**Débloqué par §2.** Ce chantier attendait de savoir si nspell disparaîtrait, auquel cas une
bonne partie de cette dette serait partie avec lui. nspell reste : la dette est à payer.

**Ce qui est en dette**, mesuré contre la contrainte Clean Architecture du `CLAUDE.md` :

- L'adaptateur nspell est **inliné dans la Server Action** — un fichier de la couche interface
  lit des fichiers et instancie le moteur.
- Le port `SpellChecker` du domaine existe mais n'est utilisé **que comme un cast**, jamais
  injecté : nspell n'est pas remplaçable sans éditer la Server Action, ce qui vide le port
  de son sens.
- **Aucun use case** entre l'action et le moteur.
- Le type positionnel d'une faute vit dans un composant d'interface et est importé par un hook,
  sans représentation de domaine.

Le correcteur grammatical livré est construit à l'opposé — port, use case, adaptateur en
infrastructure — précisément pour ne pas propager le schéma. Les deux correcteurs cohabitent
donc avec deux architectures différentes. C'est acceptable tant que c'est consigné ; ce
document est cette consignation.

**Défauts adjacents relevés dans #187**, à rattacher ou à sortir explicitement : persistance
en « fire and forget » sans gestion d'erreur, écritures silencieusement ignorées quand les
réglages du projet n'existent pas encore, comparaison de casse incohérente entre filtrage
serveur et filtrage client, absence de déduplication des initialisations concurrentes du
moteur.

**Prérequis non négociable** : il n'existe aujourd'hui **aucun test d'intégration pour
l'orthographe** ; les actions adossées à la base ne sont couvertes que par les E2E.
Refactoriser sans filet à cet endroit est un pari, pas un refactor.

---

## 5. Normalisation typographique à l'export (#186)

**Ce qu'il faut faire.** Déplacer les règles de micro-typographie du moment de l'écriture
vers le moment de l'export.

**Pourquoi.** Le profil fiction coupe délibérément toute la famille micro-typographie —
apostrophes typographiques, insécables avant `! ? : ;`, espaces fines, ligatures. C'est là
que vivaient **29 faux positifs sur 29** mesurés sur de la prose correcte. Mais ce ne sont
pas des signalements faux : c'est exactement la qualité typographique qu'attend un livre
publié. Le problème est l'étage, pas la règle. Souligner chaque point d'exclamation d'un
roman pendant que l'auteur écrit est catastrophique ; appliquer la transformation à l'export
ne coûte rien et sert directement l'objectif d'auto-édition.

**Ce qui manque pour spécifier** : où la transformation s'applique (export seul, ou aussi
l'aperçu livre) ; si elle est réversible ou destructive — la philosophie du produit penche
lourdement pour un rendu qui ne touche pas au manuscrit, mais ça se tranche explicitement ;
si elle est optionnelle par profil d'export ; son interaction avec les nœuds non textuels
(appels de note, marques) qu'un décalage d'offsets peut casser ; le moteur retenu (réutiliser
les règles Grammalecte ou écrire une transformation dédiée) ; et la **liste précise** des
conventions retenues — « typographie française » n'est pas une spécification.

---

## 6. Les sept `test.fixme` de l'autocomplétion

**Ce qu'il faut faire.** Traiter l'instabilité de la télémétrie d'autocomplétion à la racine,
et réactiver les tests.

**L'état réel.** `e2e/ai-strategy/autocomplete.spec.ts` porte **sept `test.fixme`** — lignes
150, 173, 199, 218, 237, 260, 332 — tous sur la même cause déclarée : `waitForTelemetry`
expire par intermittence et `tracker.accept()` renvoie parfois `null`. S'y ajoute l'aléa
d'environ 20 % constaté pendant le merge, isolé comme en suite.

**Pourquoi c'est ici.** Ce n'est pas un dommage du merge — ni `main` ni la branche n'ont
touché ce test ni le code d'autocomplétion, et c'est la seule raison pour laquelle il n'a pas
bloqué l'atterrissage. Mais sept tests désactivés sur un même fichier ne sont plus une
flakiness : c'est un **trou de couverture sur la télémétrie d'autocomplétion**, et il grandit
sans bruit.

---

## 7. Le démarrage à froid du moteur, côté auteur

**Ce qu'il faut faire.** Mesurer ce que coûte réellement la **première** « Corriger le
chapitre » d'un processus serveur, en conditions de production, puis décider s'il faut agir.

**Ce qu'on sait.** Le paquet fait 24,9 Mo décompressés et charge règles, dictionnaires
Graphspell, conjugaisons et thesaurus par chemins relatifs au premier appel.
`GrammalecteGrammarChecker` garde le moteur dans un **singleton de module** : le coût est payé
une fois par processus — mais en déploiement serverless, « une fois par processus » veut dire
une fois par instance froide, pas une fois par jour. Le test E2E accorde **150 s** à la
première vérification (`FIRST_CHECK_TIMEOUT`), ce qui est un budget de test et ne dit rien
de l'expérience réelle.

**À ne pas optimiser avant d'avoir mesuré.** La note ici est de faire la mesure, pas de
préchauffer quoi que ce soit.

---

## 8. La réinstallation du dictionnaire à chaque vérification

**Le constat.** `GrammalecteGrammarChecker.checkParagraph` compare le dictionnaire installé
au dictionnaire demandé **par identité de référence** (`dictionary !== installedDictionary`).
Or les réglages sont relus depuis Mongo à chaque vérification de chapitre : la référence
diffère toujours, même quand le contenu est rigoureusement identique. Conséquence : un
`clearStorage()` et une réinstallation à chaque « Corriger le chapitre » d'un projet doté
d'un dictionnaire, donc la perte du cache de morphologie que le moteur venait de constituer.

**Ce qui n'est pas en cause.** La sécurité. Vider le cache quand le dictionnaire change est
la bonne décision et elle est documentée : sans ça, le vocabulaire d'un projet ressortait
dans le paragraphe d'un autre. Le comparer par valeur plutôt que par référence garderait
cette garantie tout en cessant de la payer pour rien.

**Priorité basse, et à mesurer d'abord.** Le coût est réel mais amorti sur une vérification
entière (les blocs d'un même chapitre partagent la référence, donc ne rechargent pas).
Ne pas y toucher tant que §7 n'a pas dit si ça se voit.

---

## Ordre recommandé

L'arbitrage #185 étant rendu, l'ordre ci-dessous remplace celui écrit le 12 août. Le découpage
en lots, les tests à écrire et les vérifications sont dans [suites-plan.md](suites-plan.md).

1. **§1 `.gitattributes`** — indépendant, court, et il ferme une classe de bugs déjà avérée.
2. **§6 autocomplétion** — indépendant de tout le reste, et le trou s'élargit.
3. **§3 cluster `c'est`/`s'est`** — la seule part du trou de rappel sans propriétaire.
4. **§7 mesure du démarrage à froid**, puis §8 s'il le justifie — mesurer et décider par écrit,
   sans optimiser.
5. **§4 dette #187** — débloqué par §2, et à ne pas commencer avant d'avoir posé les tests
   d'intégration qui manquent.
6. **§5 spécification #186** — le livrable est une spec, pas du code : les décisions produit
   restent à prendre.
