# PRD — Revise, plateforme d'auto-édition

> **Statut : spécification produit, rien n'est implémenté.** Ce document décrit une
> cible. Pour le comportement actuel, la source de vérité reste le code câblé.
> Rédigé le 18 août 2026.

## Le problème

Revise s'adresse aujourd'hui aux auteurs de fiction. Ce public est, dans le monde
francophone, fermé et méfiant vis-à-vis de l'IA d'écriture — hostile, souvent. Le
produit est bon et son marché ne l'est pas.

Un autre public existe, demandeur et solvable : **l'auteur auto-publié professionnel**,
dont publier est le métier. Il veut deux choses, dans cet ordre :

1. **Écrire vite et bien** un livre qui peut se vendre.
2. **Publier vite et sans friction**, en broché, en relié et en ebook.

Aujourd'hui il assemble trois à cinq outils pour y arriver : un traitement de texte, un
outil de mise en page, un générateur de couverture, un outil de recherche de mots-clés.
Revise possède déjà la moitié difficile de cette chaîne.

## Ce qui est déjà construit

Ce PRD ne part pas de zéro. Le pipeline de publication existe et fonctionne :

- Profils de publication `kdp-6x9`, `a5`, `passerelle`, moteur Paged.js sur Chromium,
  export PDF paginé, export DOCX avec notes de bas de page Word natives
- Modèle de contenu **sémantique** — les rôles sont séparés de leur rendu, ce qui rend
  plusieurs formats de sortie possibles sans retoucher le texte
- Aperçu du livre entier mis en cache, avec **nombre de pages total persisté par profil**
- Import `.docx` et dossier Markdown, chapitrage, snapshots et historique de versions
- Correction orthographique locale (nspell) et grammaticale serveur (Grammalecte),
  **sans consommer de token**
- Suivi du coût IA en euros par token, tarification synchronisée depuis OpenRouter
- Clean Architecture avec `LLMProvider`, `DocumentExporter` et `DocumentParser` comme
  interfaces du domaine

Deux découvertes déterminent une grande partie du plan :

- **La couche de rendu paginé ne connaît aucune entité du domaine.**
  `PagedRenderer.render()` prend `bodyHtml: string` et un value object
  `PublicationProfile` ; `WholeBookHtmlAssembler` prend des données plates. Un intérieur
  généré peut donc alimenter le moteur sans construire de faux projet.
- **Les briques HTML de l'EPUB existent déjà.** `TipTapToBookHtml`, `TocHtmlBuilder`,
  `FrontMatterHtmlBuilder`, `BackMatterHtmlBuilder` et `EndnotesHtmlBuilder` produisent
  le HTML du livre *avant* que Paged.js ne le pagine. Un EPUB, c'est ce HTML plus un
  empaquetage.

## Ce qui manque

| Manque | État vérifié |
|---|---|
| EPUB | Aucun exporter. Seuls PDF et DOCX existent. |
| Images dans le manuscrit | **Aucune extension TipTap `Image`**, aucun `case` image dans le convertisseur HTML du livre. |
| Tableaux | **Aucune extension table installée**, aucun `case 'table'`, aucun support DOCX. |
| Gabarit de couverture | Seulement un upload d'image de projet. Pas de calcul de dos. |
| Prévalidation avant dépôt | `CONTEXT.md` l'écrit noir sur blanc : le profil imprimable n'effectue aucune prévalidation. |
| Fiche produit | `ProjectMetadata` est de l'analyse de manuscrit, pas un listing marchand. |
| Éditions multiples | Un seul `isbn`, un seul `publicationProfileId`. |
| Monétisation | Aucun prestataire de paiement installé. BYOK, bêta gratuite. |
| Multilingue | **Aucune bibliothèque i18n** — l'application est en français en dur. |

Ce qui **existe déjà** et qu'on croyait manquant : listes à puces, listes numérotées,
citations et blocs de code sont rendus dans le HTML du livre **et** dans le DOCX. Le
trou de mise en page se réduit aux images et aux tableaux.

## Utilisateurs et périmètre

**Utilisateur principal** — l'auteur auto-publié qui vend sur Amazon KDP, seul ou en
petite structure, et qui publie plusieurs titres par an.

**Utilisateur conservé** — l'auteur de fiction actuel. Rien ne lui est retiré. Le mode
fiction passe en maintenance : pas de régression, pas de nouveauté.

**Cœur de la valeur : le medium content** — essais, manuels, guides. Texte, images,
tableaux, mise en page riche. C'est là que le marché se déplace, et c'est ce que la
distribution récompense.

**Offre secondaire : le low content** — carnets, journaux, planners. Offert, mais sans y
concentrer l'effort. Ce n'est pas un choix de goût : **cinq plateformes sur six le
restreignent ou le refusent**. Kobo et Draft2Digital le refusent explicitement ; Lulu
signale qu'Amazon et Ingram n'acceptent ni carnets, ni journaux, ni agendas, ni livres à
nombreuses pages blanches ou lignées ; KDP l'exclut de l'Expanded Distribution, avec une
limite de dix titres par format et par semaine et un délai de publication pouvant aller
à dix jours ouvrés. Le low content ne se vend qu'en direct, sur peu de canaux.

**Hors v1** — thèses, mémoires, rapports et études. Ils exigent un appareil critique
(citations normalisées, bibliographie, index, renvois, numérotation de figures) dont
rien n'existe : `citation` n'est qu'un rôle sémantique de bloc, pas une référence. Les
notes de fin, en revanche, sont réelles et exportées en notes Word natives — c'est un
acquis pour la v2.

## Décisions produit

Les cinq décisions structurantes ont chacune leur ADR :

| ADR | Décision |
|---|---|
| [0007](../../adr/0007-perimetre-produit-et-revision-philosophie.md) | Périmètre produit et révision de la philosophie |
| [0008](../../adr/0008-trois-types-de-projet.md) | Trois types de projet, immuables |
| [0009](../../adr/0009-editions-multiples-par-manuscrit.md) | Un manuscrit, plusieurs éditions |
| [0010](../../adr/0010-frontiere-avec-les-plateformes-de-publication.md) | Frontière avec les plateformes |
| [0011](../../adr/0011-abonnement-et-credits.md) | Abonnement et crédits |

En résumé : trois `ProjectKind` immuables ; une entité `Edition` par sortie publiée ; un
master EPUB unique plus un profil de sortie par destination ; jamais de connexion
automatique à un compte KDP ; un abonnement de plateforme plus des crédits d'usage IA
via Stripe ; une philosophie qui conserve la propriété des écrits et le
non-entraînement, et abandonne les principes de protection de la voix.

## Promesse et vocabulaire

- Accroche : **« De la page blanche au livre publié »**
- Signature courte : **« Écrivez et publiez »**
- Le nom **Revise** ne change pas
- **Story Intelligence** — les analyses du mode fiction (nom visible)
- **Knowledge Intelligence** — les analyses du mode non-fiction (nom visible) :
  Consistency Checker, Knowledge Graph, Argument Analysis, Source Intelligence
- **Édition** — une sortie publiée d'un manuscrit, avec son format, son ISBN, son prix
  et sa couverture

Deux affirmations du README doivent disparaître : « passez votre chemin si vous cherchez
du technique, marketing, factuel » et « si vous espérez qu'il écrive le livre à votre
place ».

## Critères de réussite

Ils sont fonctionnels, pas chiffrés en usage — nous n'avons pas de base d'utilisateurs
mesurée sur ce marché.

1. Un auteur produit, depuis un seul manuscrit, un **PDF intérieur** et un **EPUB
   valide EPUBCheck** sans quitter Revise.
2. Il obtient un **gabarit de couverture** aux bonnes dimensions, dos compris, sans
   calculer quoi que ce soit lui-même.
3. Le produit lui dit **avant le dépôt** ce qui sera refusé, pour les règles que nous
   savons vérifier.
4. Il gère **plusieurs éditions** du même texte sans dupliquer le manuscrit.
5. Il rédige un guide illustré : les **images** apparaissent correctement à l'écran, dans
   le PDF paginé, dans le DOCX et dans l'EPUB.
6. Le mode fiction ne subit **aucune régression**.

## Risques et incertitudes assumés

Ces points sont ouverts. Ils sont écrits ici pour ne pas être redécouverts plus tard
comme des surprises.

**Les faits KDP et plateformes n'ont jamais été lus verbatim.** L'egress externe était
bloqué pour tous les domaines pendant la recherche. Les faits proviennent d'extraits de
moteur restreints aux domaines officiels : la prose est fiable, **les tableaux HTML
n'ont jamais pu être restitués**. Concrètement, il manque :

- la table des **marges intérieures par nombre de pages** — la règle la plus utile de la
  prévalidation ;
- les **tables de coût d'impression** par marketplace, encre et format ; seuls trois
  exemples isolés ont été obtenus ;
- la liste exhaustive des **trim sizes** et des maxima de pagination.

**Deux contradictions internes non résolues** sur la version EPUB acceptée : deux pages
officielles de Google se contredisent, deux pages d'Apple aussi. Ne pas figer
« EPUB 3.3 » sur la foi de cette recherche.

**Un changement tarifaire postérieur à notre date de connaissance** : la bande de la
redevance à 70 % passerait de 2,99–9,99 $ à 2,99–12,99 $ depuis le 7 juillet 2026.
Cohérent sur deux pages officielles, à revérifier avant d'en faire une règle.

**Performance non mesurée** : générer 120 à 200 pages via Chromium et Paged.js est un
profil de charge différent de l'aperçu actuel. `tests/performance/` et
`vitest.performance.config.ts` existent — un budget chiffré est requis avant de promettre
le low content.

**Conséquence** : le simulateur de redevances est **bloqué** tant que les grilles
manquent ; la prévalidation est livrable **partiellement** ; le calcul du dos, lui, est
entièrement spécifié et constitue la brique la plus dé-risquée du programme.

## Ce que nous ne ferons pas

- Aucune connexion automatique à un compte KDP, jamais. Pas d'API publique, donc
  scraping, donc risque de suspension du compte de l'utilisateur.
- Pas d'intégration Amazon Ads — autre métier, accès filtré.
- Pas d'export spécifique par plateforme : un master, des profils de sortie.
- Pas d'appareil critique en v1.
- Pas d'éléments interactifs embarqués dans les fichiers : liens, QR codes et ressources
  téléchargeables uniquement.
