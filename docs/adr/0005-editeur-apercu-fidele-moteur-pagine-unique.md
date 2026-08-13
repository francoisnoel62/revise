# Éditeur-aperçu fidèle : pagination vivante et moteur de rendu unique piloté par les profils de publication

> **Statut au 13 août 2026 : partiellement réalisé et complété par une
> architecture d'aperçu séparé.** Cette ADR conserve l'objectif et les choix de
> l'époque ; les garanties de pagination vivante et de parité pixel dans le champ
> d'écriture ne décrivent pas le comportement actuel.

## Statut actuel

- Le contenu sémantique, les profils `kdp-6x9`, `a5` et `passerelle`, les styles par
  niveau, les surcharges Passerelle, Paged.js et l'export PDF paginé sont actifs.
- L'éditeur reste une surface TipTap de manuscrit. `PublicationPreview` est un rendu
  de publication séparé : le caret ne circule pas à travers des pages imprimées.
- L'aperçu du livre entier est un PDF serveur mis en cache (MongoDB/GridFS), distinct
  de l'export lancé depuis l'éditeur, même s'ils partagent le sous-système Paged.js.
- Aucun préflight de marketplace ni garantie d'acceptation KDP/BoD n'est implémenté.
- Le spike `editor/paged-spike` est conservé comme expérience et n'est pas exposé dans
  le parcours de production.

## Contexte

L'objectif de Revise est de permettre à l'auteur de **publier le plus facilement possible**, en supprimant les points de douleur de l'auto-édition sur les marketplaces (Amazon KDP, BoD, TheBookEdition, Bookelis…). Le critère dur : un export destiné à une plateforme doit être **accepté du premier coup, sans aller-retour**.

Or l'éditeur actuel trahit cet objectif. Il n'affiche pas le livre tel qu'il sera publié : un chapitre s'étire sur une page unique indéfiniment longue, en A4 / Georgia / justification générique. Surtout, trois moteurs de rendu divergent — l'éditeur (aucune mise en page livre), l'export PDF (A4 / Times via `pdf-lib`, codé en dur) et l'export DOCX KDP (6×9 / Garamond / marges miroir, autre moteur). Conséquence vécue : l'auteur écrit dans Revise pour l'IA, exporte en DOCX KDP, puis finit le rendu dans Google Docs (Garamond, table des matières, titres) — un détour contradictoire.

## Décision

L'éditeur devient un **aperçu fidèle du livre**, et le rendu est unifié.

1. **Pagination vivante.** Le chapitre s'affiche en vraies pages au trim de la cible pendant l'écriture, re-paginées **à la pause de frappe** (débounce). Le curseur circule de page en page comme dans le livre imprimé.

2. **Moteur de rendu paginé unique.** Un seul composant HTML/CSS « paged media » paginate à la fois l'éditeur et l'export. C'est la cause-racine de la divergence actuelle qui disparaît : une seule définition du livre, partout.

3. **Parité d'aperçu pour le PDF, passerelle pour le DOCX.** Le **PDF** est l'export fidèle au pixel (= ce que montre l'éditeur). Le **DOCX** reste une remise éditable refluable (structure, styles, Garamond, TOC préservés) — re-paginée par Word/Docs, donc non pixel-identique, et annoncée comme telle.

4. **Manuscrit sémantique, profils-lentilles.** Le manuscrit est stocké en **contenu sémantique pur**, indépendant de toute cible. Un **profil de publication** (KDP 6×9, A4, A5, passerelle Word…) est une lentille de rendu + contraintes appliquée par-dessus, **changeable à tout moment, dans les deux sens, sans perte** (viser KDP → basculer passerelle pour un bêta-lecteur → revenir KDP → puis TheBookEdition).

5. **Formatage par styles sémantiques, contraint par le profil.** L'auteur choisit des styles (Corps, Titre de chapitre, Citation, Séparateur de scène…), jamais une police ou une taille. Les profils **print-ready** sont stricts — un fichier invalide est impossible à produire, d'où l'acceptation sans aller-retour. Les profils **passerelle** sont permissifs : les **surcharges de présentation** y sont autorisées, stockées en couche séparée non destructive, ignorées par les profils stricts et restituées au retour en passerelle.

6. **Liminaires et table des matières générés.** Faux-titre, page de titre, copyright, dédicace, épigraphe et TOC sont assemblés automatiquement depuis les annexes éditoriales et les métadonnées. Ils comptent dans la numérotation mais restent **hors de la surface d'écriture**, qui demeure focalisée sur la prose.

7. **Numérotation exacte du livre, édition par chapitre.** L'auteur édite un chapitre à la fois (perf bornée), mais ses pages portent leur **numéro réel dans le livre** (offsets calculés et cachés via le nombre de pages des chapitres précédents). Un aperçu « livre entier » rend le manuscrit continu complet.

## Premier incrément

Le risque #1 est le moteur de pagination/parité. Le premier jalon est un **spike de faisabilité ciblé**, sans largeur fonctionnelle :

- un seul profil (**KDP 6×9**), un seul chapitre ;
- pagination vivante au bon trim/typo (Garamond, justification, marges réelles), re-paginée à la pause ;
- export **PDF par le même moteur**, prouvant la parité pixel éditeur ↔ PDF ;
- styles sémantiques minimaux (Corps + Titre de chapitre).

Sont **différés** : bascule de profil, surcharges passerelle, liminaires/TOC, numérotation livre-entier, profils additionnels.

## Conséquences

- L'export PDF `pdf-lib` (A4 / Times codé en dur) est remplacé par le pipeline HTML/CSS → Chromium du moteur unique.
- La partie *formatage* de la barre d'outils devient des styles sémantiques **adaptés au profil actif** ; les contrôles manuels (police, taille, alignement, retrait, surlignage) ne réapparaissent qu'en profil passerelle.
- Les fonctions IA existantes (bulle thésaurus, palette `Ctrl+K`, menu IA, propositions, autocomplétion inline) sont **conservées**, adaptées là où l'architecture l'impose : insertion dans du contenu sémantique, sélection à travers les sauts de page.
- Le risque de perf de re-pagination est dé-risqué par le débounce (re-pagination à la pause, pas à chaque frappe) et mesuré par le spike avant tout investissement en largeur.
- Conformément aux règles du dépôt, l'implémentation se fait en **TDD** : test en échec d'abord, y compris pour le spike.

### Questions ouvertes

- Liste des profils au-delà de KDP 6×9 (A5, autres trims KDP, BoD, TheBookEdition…) et où vit la définition de chaque cible.
- Faut-il un **preflight de validation** explicite (marges, fond perdu, polices embarquées, DPI images, nombre de pages minimal) en plus de la garantie par construction ?
- Modèle de stockage précis des surcharges de présentation (couche séparée scopée au profil passerelle).
- Stratégie de calcul/cache des offsets de numérotation livre-entier pendant l'édition.

## Premier incrément — résultats du spike #122

- **Parité statique prouvée** : l'aperçu KDP 6×9 et le PDF Chromium utilisent le même HTML, la même CSS, Paged.js et EB Garamond. Le pixel-diff structurel de la première page est sous 1 % après tolérance des différences d'anti-aliasing ClearType/PDF.js.
- **Re-pagination vivante acceptée** : sur un chapitre réaliste de 4 000 mots (80 paragraphes), la mesure observée est de **331,4 ms** après le debounce de 300 ms. Le nombre de pages augmente correctement lors du débordement et le caret reste inchangé.
- **Budget décidé** : le budget de re-pagination est fixé à **< 900 ms** par décision humaine du 2026-06-27. La mesure tient ce budget ; Paged.js est donc retenu et le fallback ProseMirror custom n'est pas déclenché.
