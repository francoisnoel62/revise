# Issue — Rendre la prévisualisation de l'éditeur optionnelle (masquage à la demande)

**Phase** 6 · **Dépend de** : `0005` · **Label** : `ready-for-agent` (indépendant de `0017`/`0019`, parallélisable)
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md).

> **Note de révision (grilling du 2026-07-04).** Un seul changement par rapport à la version précédente : on **ajoute la persistance** du choix via `localStorage`. Le « pas de persistance » initial se retournait contre l'utilisateur cible (l'auteur « mode concentration » devait re-masquer à **chaque** session). Le coût de la persistance est négligeable (~3 lignes) et sert exactement cet utilisateur.

## Contexte

L'éditeur de chapitre affiche en permanence deux volets côte à côte (`src/app/editor/page.tsx:813-851`) : `<TextEditor>` à gauche, `<PublicationPreview>` à droite, dans un layout CSS Grid pur (`grid w-full max-w-400 gap-4 xl:grid-cols-2`), sans librairie de redimensionnement. Aucun état `showPreview`/toggle n'existe dans le repo — le rendu de l'`<aside>` contenant `PublicationPreview` est inconditionnel. L'auteur qui souhaite se concentrer uniquement sur l'écriture ne peut pas éviter la prévisualisation en direct.

`PublicationPreview` est monté en permanence dès que l'éditeur est ouvert, et `BackgroundPageCounter` (calcul des offsets de pages, `0014`) tourne déjà en tâche de fond indépendamment de la visibilité de ce panneau — masquer visuellement le panneau n'a **aucune** incidence sur le calcul de pagination sous-jacent.

## Décision produit (arbitrée, ne pas rouvrir)

Masquage **CSS uniquement** : `PublicationPreview` reste **monté** et continue de tourner en arrière-plan quand le panneau est masqué (pas d'optimisation de performance recherchée ici — uniquement un gain d'espace visuel pour l'auteur qui veut se concentrer). Le bouton toggle s'ajoute dans la zone de contrôle existante.

**Persistance légère via `localStorage` (ajoutée le 2026-07-04).** Le choix « masqué / visible » est mémorisé dans le `localStorage` du navigateur (propre à chaque utilisateur/appareil). L'**état par défaut reste « visible »** pour un utilisateur qui n'a jamais touché au toggle (aucune régression) ; on ne mémorise que si l'auteur a **explicitement** changé. Rien n'est stocké côté serveur : c'est une préférence d'affichage locale, pas une donnée de projet.

## Périmètre

**In** : état `showPreview` initialisé depuis `localStorage` (défaut `true` si absent, préserve le comportement actuel) ; écriture dans `localStorage` à chaque bascule ; un bouton toggle visible ; masquage CSS conditionnel de l'`<aside>` contenant `PublicationPreview` (classe conditionnelle, **pas de démontage**) ; la colonne d'édition passe en pleine largeur (`grid-cols-1` au lieu de `xl:grid-cols-2`) quand l'aperçu est masqué.

**Out** : réécriture du layout en panneaux redimensionnables ; persistance **côté serveur** de la préférence ; synchronisation entre appareils ; tout changement de `FormattingToolbar.tsx` au-delà de l'ajout éventuel du bouton toggle dans la zone de contrôle existante.

## Critères d'acceptation

- [ ] Un bouton visible permet de masquer/afficher le panneau d'aperçu.
- [ ] Quand masqué, la zone d'édition occupe toute la largeur disponible.
- [ ] `PublicationPreview` reste monté (le calcul de pagination en arrière-plan continue de tourner) — seul l'affichage change.
- [ ] L'état par défaut à la **première** ouverture de l'éditeur (aucune préférence enregistrée) reste « aperçu visible ».
- [ ] Le choix de l'auteur est **mémorisé** : après avoir masqué l'aperçu, le rouvrir dans une nouvelle session le retrouve masqué (via `localStorage`), sans régression pour qui n'a jamais utilisé le toggle.

## Ancre TDD

Test composant sur `editor/page.tsx` (ou un sous-composant extrait pour l'isolation) vérifiant que :
- le clic sur le bouton toggle masque/affiche l'`<aside>` **sans démonter** `PublicationPreview` (vérifiable via un mock comptant les montages/rendus du composant) ;
- la grille passe en une colonne pleine largeur quand l'aperçu est masqué et revient à deux colonnes quand il est réaffiché ;
- au montage, l'état initial est lu depuis `localStorage` (une valeur « masqué » enregistrée ouvre l'éditeur avec l'aperçu masqué ; l'absence de valeur ouvre avec l'aperçu visible) ;
- une bascule écrit la nouvelle valeur dans `localStorage`.
