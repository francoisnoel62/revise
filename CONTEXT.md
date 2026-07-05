# Revise

Revise est un assistant d'écriture IA pour auteurs de fiction. Son rôle est d'augmenter le processus créatif de l'auteur sans jamais remplacer sa voix.

## Language

### L'auteur et son œuvre

**Auteur** :
La personne qui écrit le roman. Propriétaire absolu de son texte. L'IA suggère, l'auteur décide.
_Avoid_ : utilisateur, écrivain, user

**Manuscrit** :
L'ensemble des chapitres écrits par l'auteur, dans leur ordre narratif. Source de vérité unique sur ce qui existe dans l'œuvre à l'instant T.
_Avoid_ : texte, roman, document

**Chapitre** :
Unité de travail du manuscrit. L'auteur écrit chapitre par chapitre ; le système traite les faits et le contexte au niveau du chapitre.

**Document de recherche** :
Document de planification créé par l'auteur : plan du roman, chronologie, résolution de l'intrigue, notes de world-building. Distinct du manuscrit — c'est ce que l'auteur a prévu, pas ce qu'il a écrit.
_Avoid_ : note, document, contexte

**Fiche personnage** :
Fiche descriptive d'un personnage : identité, psychologie, voix, backstory, relations. Créée ou générée par l'auteur. Sert de base au chat avec le personnage.
_Avoid_ : profil, character

### Canon et continuité narrative

**Fait canon** :
Affirmation atomique sur un personnage, établie par le texte du manuscrit, valide à partir d'un chapitre donné. Cinq catégories : fait objectif, état de connaissance, croyance, croyance sur les autres, dynamique relationnelle.
_Avoid_ : fait, information, donnée

**État de connaissance** :
Catégorie de fait canon. Ce qu'un personnage sait ou ignore à l'instant T du récit. ("sait que Tom est le traître", "ignore que Léa a survécu")
_Avoid_ : information, savoir

**Croyance** :
Catégorie de fait canon. Ce qu'un personnage tient pour vrai, même si c'est faux. ("croit à tort que Marc est innocent"). La croyance est établie par le texte, indépendamment de sa véracité dans le monde du roman.
_Avoid_ : opinion, supposition

**Dynamique relationnelle** :
Catégorie de fait canon. La nature de la relation entre deux personnages à l'instant T. ("entretient une méfiance active envers Martin")
_Avoid_ : relation, lien

**Horizon narratif** :
La limite de connaissance de l'IA lors d'une autocomplétion : uniquement ce qui a été écrit jusqu'au chapitre courant. L'IA ne connaît ni la résolution de l'intrigue ni les événements futurs.
_Avoid_ : contexte, limite

**Omniscience narrative** :
Anti-pattern. L'IA a accès à des informations sur la résolution de l'intrigue (via les documents de recherche) et propose des suggestions qui anticipent des événements que les personnages ne connaissent pas encore.
_Avoid_ : spoiler, biais

### Autocomplétion

**Contexte d'autocomplétion** :
L'ensemble des informations envoyées à l'IA pour une requête d'autocomplétion : faits canon filtrés + chapitres précédents + texte avant le curseur.
_Avoid_ : prompt, contexte

**Extraction incrémentale** :
Processus d'extraction des faits canon qui ne traite que les chapitres nouveaux ou modifiés depuis la dernière extraction, identifiés par leur hash de contenu.
_Avoid_ : mise à jour, synchronisation

**Déclencheur de fin de session** :
Mécanisme qui lance l'extraction incrémentale des faits canon en arrière-plan quand l'auteur arrête d'écrire pendant 15-30 minutes.
_Avoid_ : cron, timer, job

**Centre de notifications** :
Interface (cloche) qui informe l'auteur d'événements système pertinents pendant ou après sa session d'écriture. Toutes les notifications sont actionnables avec confirmation avant action.
_Avoid_ : alertes, messages, toast

### Mise en page et publication

**Profil de publication** :
Lentille de rendu et de contraintes appliquée au manuscrit pour une cible donnée (KDP 6×9, A4, A5, passerelle Word…). Changeable à tout moment, dans les deux sens, sans perte ; le manuscrit lui-même n'en dépend pas. L'auteur choisit un profil et l'écriture épouse le rendu d'export de cette cible.
_Avoid_ : format, template, thème

**Profil print-ready** :
Profil de publication strict destiné à une marketplace d'impression (KDP, BoD, TheBookEdition). N'expose que des styles sémantiques : un fichier invalide est impossible à produire, garantissant l'acceptation sans aller-retour.
_Avoid_ : preset, gabarit

**Profil passerelle** :
Profil de publication permissif destiné à une remise éditable (Word, Google Docs), par exemple pour un bêta-lecteur. Autorise les surcharges de présentation.
_Avoid_ : brouillon, draft

**Style sémantique** :
Marquage du rôle d'un bloc ou d'un fragment (Corps, Titre de chapitre, Sous-titre, Citation, Épigraphe, Séparateur de scène) — pas son apparence. Le profil décide du rendu. L'auteur choisit un style, jamais une police ni une taille.
_Avoid_ : format, style de paragraphe, police

**Corps** :
Rôle sémantique du paragraphe de narration ordinaire. Valeur par défaut pour tout paragraphe non explicitement reclassifié lors de la migration. Identifiant code : `corps`.
_Avoid_ : paragraphe, texte

**Titre de chapitre** :
Rôle sémantique du nœud `heading` level 1 — intitulé du chapitre courant. Mappé automatiquement lors de la migration. Un seul par chapitre. Identifiant code : `titre-de-chapitre`.
_Avoid_ : titre, heading, h1

**Sous-titre** :
Rôle sémantique d'un titre de section à l'intérieur d'un chapitre (heading level 2+). Nécessite une reclassification manuelle — la migration ne peut pas l'inférer depuis les marques de présentation. Identifiant code : `sous-titre`.
_Avoid_ : intertitre, heading

**Citation** :
Rôle sémantique d'un bloc de texte cité (extrait d'œuvre tiers, discours indirect libre). Rendu en retrait dans les profils print-ready. Nécessite une reclassification manuelle. Identifiant code : `citation`.
_Avoid_ : blockquote, extrait

**Épigraphe** :
Rôle sémantique d'une citation placée en exergue, généralement en tête de chapitre. Un paragraphe centré est signalé comme ambigu lors de la migration — l'auteur confirme s'il s'agit d'une épigraphe. Identifiant code : `epigraphe`.
_Avoid_ : exergue

**Séparateur de scène** :
Rôle sémantique d'une rupture entre deux scènes dans un chapitre. Représenté par le nœud `horizontalRule` — le type de nœud lui-même est le marqueur sémantique, aucun attribut supplémentaire n'est nécessaire. Identifiant code : `separateur-de-scene`.
_Avoid_ : hr, break, séparateur

**Surcharge de présentation** :
Mise en forme manuelle (police, taille, alignement) posée en profil passerelle. Stockée en couche séparée, ignorée par les profils print-ready et restituée au retour en passerelle — jamais destructive.
_Avoid_ : override, format manuel

**Migration sémantique** :
Script idempotent qui convertit le contenu TipTap legacy (portant des marques de présentation : fontFamily, fontSize, textAlign) en contenu sémantique pur (attribut `semanticRole` sur chaque bloc). Les cas ambigus (paragraphe centré pouvant être une épigraphe) sont conservés comme `corps` et signalés pour reclassification par l'auteur. Réversible par script inverse ; ne perd aucun texte.
_Avoid_ : conversion, nettoyage, reformatage

**Pagination vivante** :
Affichage du chapitre en vraies pages au trim de la cible pendant l'écriture, re-paginées à la pause de frappe (débounce). Le curseur circule de page en page comme dans le livre imprimé.
_Avoid_ : aperçu, preview, mode impression

**Moteur de rendu paginé** :
Composant unique HTML/CSS « paged media » qui paginate à la fois l'éditeur et l'export PDF. Une seule définition du livre, d'où la parité.
_Avoid_ : exporteur, générateur PDF

**Parité d'aperçu** :
Garantie que ce que l'auteur voit dans l'éditeur paginé est, au pixel, le PDF exporté. Atteignable pour le PDF/impression, pas pour le DOCX (refluable).
_Avoid_ : WYSIWYG, fidélité

**Liminaires** :
Pages d'entrée du livre (faux-titre, page de titre, copyright, dédicace, épigraphe) et table des matières. Générés automatiquement depuis les annexes éditoriales et les métadonnées ; comptés dans la numérotation mais hors de la surface d'écriture.
_Avoid_ : front matter, préliminaires, en-têtes

**Aperçu livre entier** :
Le livre complet (liminaires + sommaire + corps) rendu comme **le vrai PDF d'export**, généré côté serveur et affiché dans un lecteur PDF. Généré **paresseusement** à l'ouverture puis mis en cache : aperçu et export sont le même artefact. Le profil `passerelle` n'a pas d'aperçu livre entier (cible partage/DOCX).
_Avoid_ : rendu navigateur, preview client, aperçu Paged.js

**Cache d'aperçu livre entier** (`BookPreviewCacheEntry`) :
Entrée de cache par `{projet, profil, auteur}` : le **PDF** dans GridFS et les **métriques** (nombre de pages, pages liminaires, offsets de chapitres, empreinte de contenu) dans un document. Recalculé quand tout ce qui se voit dans le PDF change (contenu, ordre des chapitres, liminaires). Les offsets pilotent la navigation par `#page=N`.
_Avoid_ : cache métriques seules, recalcul éager

**Folio** :
Numéro de page des liminaires en **chiffres romains bas de casse** (i, ii, iii…). Le faux-titre (1ʳᵉ page) ne porte pas de numéro imprimé ; le corps redémarre en **chiffres arabes à « 1 »**. Une seule correction dans le pipeline paginé sert aperçu et export.
_Avoid_ : numéro de page liminaire, pagination romaine
