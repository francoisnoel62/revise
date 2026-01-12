# Revise - Guide Utilisateur

## Introduction

Revise est un outil d'aide à l'écriture minimaliste qui vous permet de réécrire instantanément vos textes grâce à l'IA. Vos projets sont sauvegardés automatiquement dans le cloud et accessibles depuis n'importe quel appareil.

## Démarrage

### Création de Compte

1. Visitez la page d'inscription (Sign Up)
2. Entrez votre adresse email
3. Choisissez un mot de passe sécurisé
4. Cliquez sur "Créer un compte"
5. Vous êtes automatiquement connecté et redirigé vers le tableau de bord

### Connexion

1. Visitez la page de connexion (Sign In)
2. Entrez votre email et mot de passe
3. Cliquez sur "Se connecter"
4. Vous êtes redirigé vers votre tableau de bord

**Note**: Votre session reste active même après fermeture du navigateur.

## Tableau de Bord

Le tableau de bord est votre espace de gestion de projets.

### Créer un Projet

1. Cliquez sur "Créer un projet"
2. Un nouveau projet est créé automatiquement
3. Vous êtes redirigé vers l'éditeur

### Renommer un Projet

1. Cliquez sur l'icône d'édition (crayon) sur la carte du projet
2. Entrez le nouveau nom
3. Appuyez sur Entrée ou cliquez en dehors pour sauvegarder

### Supprimer un Projet

1. Cliquez sur l'icône de suppression (poubelle) sur la carte du projet
2. Confirmez la suppression dans la boîte de dialogue
3. Le projet est définitivement supprimé

**Attention**: La suppression d'un projet est irréversible.

### Ouvrir un Projet

1. Cliquez sur la carte du projet
2. Vous êtes redirigé vers l'éditeur avec le projet chargé

## Fonctionnalités d'Édition

### Import de Documents

1. Cliquez sur "Importer"
2. Sélectionnez un fichier .docx
3. Le document est divisé en chapitres (selon les titres H1)
4. Si aucun titre H1 n'est détecté, un seul chapitre est créé

### Sauvegarde Automatique

Toutes vos modifications sont **automatiquement sauvegardées** dans MongoDB Atlas après 1 seconde d'inactivité. Un indicateur de statut vous informe:
- "Enregistrement..." pendant la sauvegarde
- "Enregistré" quand tout est sauvegardé

**Note**: Vous n'avez plus besoin d'exporter pour sauvegarder - vos projets persistent automatiquement.

### Navigation entre Chapitres

1. Cliquez sur le Switch (📄) en haut à gauche
2. Votre panneau de chapitres s'ouvre à gauche
3. Cliquez sur un chapitre pour le charger (sauvegarde automatique du chapitre actuel)
4. Le panneau reste ouvert pour faciliter la navigation

### Gestion des Chapitres

**Ajouter un chapitre**:
- Cliquez sur "Nouveau chapitre" dans le panneau de navigation

**Renommer un chapitre**:
- Double-cliquez sur le titre du chapitre dans le panneau de navigation
- Entrez le nouveau titre
- Appuyez sur Entrée pour sauvegarder, Échap pour annuler

**Réorganiser les chapitres**:
- Glissez-déposez les chapitres dans le panneau de navigation

**Supprimer un chapitre**:
- Cliquez sur l'icône poubelle à côté du chapitre
- Attention : vous ne pouvez pas supprimer le dernier chapitre

### Formatage du Texte

**Formatage de base** (barre d'outils et raccourcis) :
- **Gras** : Ctrl+B
- *Italique* : Ctrl+I
- Souligné : Ctrl+U
- Surligné : Ctrl+Shift+H
- Tiret cadratin (—) : Ctrl+K

**Contrôles typographiques avancés** (barre d'outils) :
- **Police** : Bouton de basculement Georgia ↔ Times New Roman
- **Taille de police** : Menu déroulant (11pt, 12pt, 13pt par défaut, 14pt, 16pt)
- **Alignement** : Bouton cyclique (gauche/centre/droite/justifié)
- **Retrait première ligne** : Bouton d'activation (1,27 cm par paragraphe)

**Style de page** :
- Largeur A4 fixe (794px)
- Interligne 1,5
- Césure automatique
- Marges professionnelles
- Ombres de page réalistes

### Réécriture par IA

1. Sélectionnez le texte à réécrire
2. Cliquez sur "Réécrire" au-dessus de la sélection
3. 3 propositions apparaissent à droite
4. Cliquez sur "Insérer" pour la proposition choisie
5. Le texte original est remplacé
6. Utilisez Ctrl+Z pour annuler si besoin

### Export de Documents

1. Cliquez sur "Exporter"
2. Tous les chapitres sont exportés dans un seul fichier .docx
3. Les chapitres sont séparés par des sauts de page
4. Le formatage (gras, italique, etc.) **et la typographie** (police, taille, alignement, retrait) sont préservés

**Note**: L'export sert désormais de **sauvegarde supplémentaire** ou pour partager votre travail. Vos projets sont déjà sauvegardés automatiquement dans le cloud.

### Déconnexion

1. Cliquez sur le menu utilisateur en haut à droite
2. Sélectionnez "Sign out"
3. Vous êtes déconnecté et redirigé vers la page de connexion

**Note**: Vos projets restent sauvegardés et accessibles lors de votre prochaine connexion.

## Limitations Connues

- **Page Breaks**: Les sauts de page ne sont pas détectés à l'import
- **Formatage Complexe**: Tableaux, images, et styles complexes ne sont pas préservés à l'import
- **Undo/Redo**: L'historique d'annulation est partagé entre tous les chapitres
- **Import Typographique**: La police, taille et alignement sont partiellement préservés à l'import (limitations de mammoth)
- **Collaboration**: Pas encore de collaboration en temps réel entre utilisateurs

## Résolution de Problèmes

**"Unsupported file format"**:
- Vérifiez que le fichier est bien au format .docx (pas .doc)

**L'import ne fonctionne pas**:
- Vérifiez que le fichier n'est pas corrompu
- Essayez de réexporter depuis Word

**Le formatage est perdu à l'import**:
- Gras, italique, souligné et surligné sont préservés
- La typographie (police, taille) est partiellement préservée
- Le formatage complexe (tableaux, images) ne peut pas être préservé

**Les propositions IA ne s'affichent pas**:
- Vérifiez que votre sélection contient du texte
- Vérifiez votre connexion internet
- La génération prend 2-3 secondes

**Je ne peux pas me connecter**:
- Vérifiez votre email et mot de passe
- Le mot de passe est sensible à la casse
- Essayez de réinitialiser votre mot de passe (future feature)

**Mes projets ne se chargent pas**:
- Vérifiez votre connexion internet
- Actualisez la page
- Assurez-vous d'être connecté

**La sauvegarde automatique ne fonctionne pas**:
- Vérifiez votre connexion internet
- L'indicateur "Enregistrement..." ou "Enregistré" apparaît en haut
- Les modifications sont sauvegardées après 1 seconde d'inactivité

## Raccourcis Clavier

**Formatage** :
- **Ctrl+B**: Gras
- **Ctrl+I**: Italique
- **Ctrl+U**: Souligné
- **Ctrl+Shift+H**: Surligné
- **Ctrl+K**: Insérer un tiret cadratin (—)

**Édition** :
- **Ctrl+Z**: Annuler
- **Ctrl+Shift+Z**: Refaire

**Navigation** :
- **Esc**: Fermer les panneaux (chapitres ou propositions)

**Note**: Les contrôles typographiques (police, taille, alignement, retrait) sont accessibles uniquement via la barre d'outils.
