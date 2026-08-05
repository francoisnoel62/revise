# Correcteur grammatical local

## Chaîne d’approvisionnement

Le moteur est distribué séparément dans le paquet npm privé `@francoisnoel62/grammalecte`, sans code Grammalecte recopié dans Revise. Il est construit depuis le miroir GitHub `Pofilo/grammalecte`, révision `08511c222029b3be20bf547563315d10fb48d44b` (15 décembre 2025), correspondant à la base Grammalecte 2.3.0.

Le dépôt privé du paquet conserve cette révision et les adaptations minimales nécessaires à CommonJS/Node : chargement des modules générés, accès aux options et injection du correcteur orthographique dans les fonctions de règles. La publication est reproductible avec :

```text
python -X utf8 make.py fr -js
npm test
npm publish --tag revise
```

Le smoke test charge le moteur français et détecte la famille `gn` dans `Les chien de la voisine sont partis.`. La licence reste GPL-3.0-only, conformément à l’analyse de l’issue #175.

## Empreinte et déploiement

La mesure effectuée avec `npm pack --dry-run` pour `2.3.0-revise.0` est de 24,9 Mo décompressés et 6,0 Mo gzip (tarball npm). Le paquet charge au démarrage des fichiers JavaScript et JSON générés par des chemins relatifs : règles, dictionnaires Graphspell, données de conjugaison et thesaurus.

`next.config.ts` laisse donc le paquet externe au bundle et force la trace de `_build/nodejs/fr/core/**/*` pour la route éditeur. La trace inclut aussi `dictionary-fr`, qui suit le même mode de chargement dynamique. Le correcteur n’est ainsi ni téléchargé au build de Revise ni omis des fonctions déployées.

## Profil de fiction et régression

Chaque `ProjectSettings` persiste son propre profil de familles de règles. Le profil initial active les accords (`gn`, `ppas`), les conjugaisons (`infi`, `conj`, `imp`, `inte`, `vmode`), les confusions (`conf`) et la ponctuation structurante (`esp`, `nbsp`, `virg`, `poncfin`). Il désactive les microtypographies, la chimie, l’OCR, les dates, les répétitions et les règles de balisage. Le cas d’usage et les Server Actions de paramètres exposent ce profil afin qu’un projet puisse le modifier et le relire.

Le corpus déterministe est volontairement séparé :

- `src/infrastructure/grammar/fixtures/fiction-clean.txt` contient 15 extraits littéraires corrects, dont des dialogues et noms propres inventés ; il ne doit produire aucun faux positif.
- `src/infrastructure/grammar/fixtures/fiction-errors.txt` contient 15 extraits avec une faute grammaticale injectée ; il fixe le plancher de rappel du profil initial.

Les tests de l’adaptateur exécutent le moteur réel, sans mock, et gardent les deux seuils distincts pour que la baisse des faux positifs ne masque pas une perte de détection.

## Le vocabulaire propre au roman

Un mot inventé peut être listé sans être décrit — c’est la forme qu’avaient toutes les entrées avant cette étape, et elle reste valide : le correcteur orthographique l’accepte, le correcteur grammatical n’en dit rien. Déclarer sa nature (nom propre, nom commun, adjectif), son genre et sa forme au pluriel donne au moteur de quoi juger les accords autour de lui. `PersonalDictionaryEntry` traduit une déclaration en flexions Grammalecte : `:M1`/`:N`/`:A` pour la nature, `m|f|e` pour le genre, `:i` quand aucun pluriel n’est déclaré, sinon un couple `:s`/`:p`. Sans nature, aucune flexion — d’où le silence du moteur.

L’automate est construit à l’écriture par `UpdatePersonalDictionaryUseCase`, seul chemin d’écriture du vocabulaire, et rangé dans `ProjectSettings` à côté de la liste dont il est issu : les deux ne peuvent pas décrire des mots différents. La vérification d’un chapitre se contente de l’installer. Ajouter un mot depuis la palette d’orthographe ne déclare rien, donc ne produit aucune flexion, donc laisse l’automate valide sans reconstruction.

Aucune migration : une entrée en chaîne simple est relue comme une entrée sans déclaration, et un document sans dictionnaire reste lisible. Les tests du sérialiseur couvrent les trois formes (chaînes seules, mélange, document vide).

Le moteur mémorise la morphologie de chaque mot rencontré pour la durée du processus, dictionnaire personnel compris — `activateStorage()` est appelé par `gc_engine`. Désactiver le dictionnaire ne vide pas ce cache : le vocabulaire d’un projet ressortait donc dans le paragraphe d’un autre. L’adaptateur vide désormais le cache au moment où le dictionnaire installé change, dans le même bloc synchrone que l’installation.

## L’analyse IA recentrée

Orthographe, grammaire et ponctuation sont vérifiées hors ligne. Les demander en plus à un modèle de langue revenait à refaire, plus lentement et moins sûrement, un travail déjà fait — et l’orthographe était pire encore : proposée à l’auteur sans stratégie derrière, elle ne renvoyait rien. `AnalysisCategory` ne contient plus que les répétitions et le style, `createAnalysisStrategies` refuse toute catégorie sans stratégie, et l’entrée de menu « Analyser le style » se distingue de « Corriger le chapitre ». Une analyse n’étant jamais persistée, ce resserrement ne demande aucune migration ; un test échoue si un sérialiseur ou un dépôt se met à référencer l’entité.
