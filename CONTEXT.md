# Contexte de Revise

Vocabulaire et contraintes de conception vérifiés le 13 août 2026. Ce document décrit les comportements actifs ; les décisions datées sont conservées dans `docs/adr/`.

## Langage commun

**Auteur** — personne qui écrit l'œuvre. L'IA suggère ; l'auteur décide. Éviter « user » dans les textes produit.

**Manuscrit** — ensemble ordonné des chapitres d'un projet, source de vérité de l'œuvre à l'instant T.

**Chapitre** — unité de travail du manuscrit, stockée comme document TipTap sémantique.

**Document de recherche** — document de planification de l'auteur (plan, chronologie, notes de monde), distinct de ce qui est déjà écrit dans le manuscrit.

**Fiche personnage** — description d'un personnage (identité, psychologie, voix, passé, relations), créée ou complétée par l'auteur. Elle sert notamment au chat personnage.

**Fait canon** — affirmation atomique établie par le manuscrit, avec une validité à partir d'un chapitre et éventuellement jusqu'à un autre. Les catégories sont : fait objectif, état de connaissance, croyance, croyance sur autrui et dynamique relationnelle. Un fait est `derived` (extrait) ou `author` (manuel).

**Horizon narratif** — limite du contexte de l'autocomplétion : le flux actif ne reçoit que le texte local, les chapitres antérieurs et les faits de canon pertinents. Il n'injecte pas les documents de recherche.

**Contexte d'autocomplétion** — texte autour du curseur, manuscrit antérieur et canon filtré, complétés par des directives d'intention, de longueur et d'audace. Ce n'est pas le même assemblage que celui des opérations de réécriture ou de génération.

**Extraction incrémentale** — traitement des seuls chapitres non vides dont le hash a changé pour mettre à jour le canon, en préservant les faits manuels et inchangés.

## Publication et contenu

**Profil de publication** — cible de rendu choisie pour un projet : `kdp-6x9`, `a5` ou `passerelle`. Le profil se modifie sans réécrire le manuscrit. KDP 6×9 et A5 sont les profils paginés ; Passerelle est destiné au DOCX/Word ou Google Docs.

**Profil imprimable** — profil KDP 6×9 ou A5 appliqué par le moteur Paged.js. Il structure l'export PDF, mais n'effectue pas de prévalidation de marketplace ni ne garantit l'acceptation par KDP, BoD ou un autre service.

**Profil Passerelle** — profil pour remise éditable. Il peut conserver des surcharges de police, taille et alignement, séparées du contenu sémantique. Ces surcharges sont retirées du rendu et des exports imprimables, puis restaurées au retour dans Passerelle.

**Style sémantique** — rôle d'un bloc ou fragment : `corps`, `titre-de-chapitre`, `sous-titre`, `citation`, `epigraphe` ou `separateur-de-scene`. Le profil détermine son rendu. Dans Passerelle, l'auteur peut ajouter des surcharges de présentation ; dans les profils imprimables, il travaille avec les rôles et les styles de niveau.

**Titre de chapitre** — un `heading` de niveau 1 portant le rôle `titre-de-chapitre`. Les nouveaux chapitres en reçoivent un. Un chapitre importé ou ancien peut en contenir plusieurs : le système ne suppose pas qu'il n'y en ait qu'un seul.

**Sous-titre** — rôle d'un titre de section. Les titres de niveau 2 et plus sont classés comme sous-titres par la migration sémantique ; l'auteur peut les ajuster dans l'éditeur.

**Séparateur de scène** — rupture entre deux scènes, représentée par le nœud TipTap `horizontalRule`.

**Migration sémantique** — conversion idempotente du contenu TipTap ancien qui portait des marques de présentation (`fontFamily`, `fontSize`, `textAlign`) vers des rôles sémantiques. Les paragraphes centrés ambigus sont signalés. `ContentDemigrator` est un helper expérimental, non relié au produit et avec perte de présentation : il ne constitue pas un retour arrière opérationnel.

## Aperçu et export

**Aperçu de publication** — rendu paginé distinct du champ d'écriture. Il utilise les réglages de publication et ne fait pas circuler le curseur entre des pages imprimées dans TipTap.

**Aperçu du livre entier** — PDF du livre complet généré côté serveur et mis en cache pour `kdp-6x9` et `a5`. Il contient liminaires, sommaire, chapitres et notes. Passerelle n'en a pas.

**Empreinte d'aperçu** — hash des entrées qui font varier le PDF : contenu et ordre des chapitres, liminaires/annexes, styles de niveau, préférences de sommaire, titre des notes, lignes blanches et révision du moteur. Le profil est une clé de cache distincte.

**Notes de fin** — références intégrées au chapitre, lues dans l'ordre du document et renumérotées à chaque chapitre. Elles deviennent des notes Word natives en DOCX et une section Notes compilée dans le PDF paginé.

## Correction et analyse

**Orthographe** — vérification locale par `nspell` avec dictionnaire français, sans appel IA.

**Grammaire et ponctuation** — vérification locale côté serveur par Grammalecte. Le profil de règles et le dictionnaire personnel sont propres au projet. Les remarques déclinées sont mémorisées par famille de règle et texte, de façon à résister aux déplacements dans le chapitre.

**Analyse de chapitre** — service IA limité aux catégories `style` et `repetition`. Son résultat est éphémère : il n'est ni mis en cache ni archivé.

**Dictionnaire personnel** — vocabulaire ajouté par l'auteur. Lorsqu'une nature, un genre ou un pluriel sont renseignés, le dictionnaire est compilé pour aider Grammalecte avec les accords ; une simple entrée de mot reste valide pour l'orthographe.

## Règles de contribution

- Partir d'une Server Action ou d'une route active pour comprendre un flux, puis suivre les imports jusqu'à `src/infrastructure/config/providers.ts`.
- Ne pas décrire le flux SSE d'autocomplétion comme s'il utilisait automatiquement les documents de recherche ; ce n'est vrai que pour certains autres chemins de contexte.
- Ne pas présenter les éléments non raccordés (`PdfExporter`, `ContentDemigrator`, anciens composants) comme des capacités produit.
- Lorsqu'une donnée quitte Revise vers un fournisseur IA, documenter le contexte transmis et l'option de journal IA ; ne pas faire de promesse au nom du fournisseur externe.
- Toute évolution de correction doit mettre à jour ensemble les guides utilisateur, `docs/architecture.md`, le README de l'infrastructure et les tests de corpus.
