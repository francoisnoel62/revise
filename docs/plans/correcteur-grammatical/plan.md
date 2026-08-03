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
