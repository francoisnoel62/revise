# PRD – IA Writing Tool (MVP)

## 1. Vision
Créer un **outil d’aide à l’écriture ultra minimaliste**, centré sur une seule action à très forte valeur : **réécrire un bloc de texte sélectionné sans casser le flux créatif**.

Ce projet n’est **pas un chat IA**, ni un assistant bavard. C’est un **outil de production**, pensé pour des écrivains exigeants.

---

## 2. Objectif du MVP
Permettre à un utilisateur de :
1. Sélectionner un bloc de texte
2. Déclencher une réécriture
3. Recevoir **5 propositions stylistiquement distinctes**
4. Insérer instantanément la version choisie à la place du texte original

**Succès du MVP** : l’utilisateur préfère ce flux à un copier/coller vers ChatGPT.

---

## 3. Utilisateur cible
- Écrivains, auteurs, scénaristes
- À l’aise avec le texte
- Sensibles au style et à la voix
- Intolérants aux interfaces lourdes et aux outils verbeux

---

## 4. Problème à résoudre
La réécriture assistée par IA aujourd’hui :
- Interrompt le flow d’écriture
- Nécessite de reformuler sans cesse les demandes
- Produit des résultats génériques et homogènes

---

## 5. Solution fonctionnelle

### Chargement du document (pré-requis d’usage)
L’utilisateur doit pouvoir **importer un document existant** afin de travailler sur un texte réel dès l’ouverture de l’application.

Formats acceptés (MVP) :
- `.txt`
- `.docx`
- `.pdf` (texte uniquement, sans mise en page complexe)

Le document est converti en texte brut et chargé dans l’éditeur.
Aucune mise en forme avancée n’est garantie dans le MVP.

**Sans chargement de document, l’outil n’a pas de valeur fonctionnelle.**

---

Un éditeur de texte minimaliste intégrant une seule commande contextuelle : **Réécrire**.

### Flow utilisateur
1. L’utilisateur sélectionne un bloc de texte
2. Un bouton contextuel « Réécrire » apparaît
3. L’IA génère 5 propositions
4. Chaque proposition dispose d’un bouton « Insérer »
5. Le texte sélectionné est remplacé
6. Undo immédiat possible (Ctrl+Z)

Aucune discussion, aucun paramétrage, aucun onboarding.

---

## 6. Périmètre fonctionnel du MVP

### Principe de persistance (décision MVP)
- **Aucune sauvegarde côté serveur**
- **Aucune persistance de session**
- Le document est **jetable** et vit uniquement en mémoire le temps de l’utilisation
- La responsabilité de conservation du texte appartient à l’utilisateur

La valeur du produit repose sur la **réécriture assistée**, pas sur le stockage.

---


### Inclus
- Import de document (txt, docx, pdf)
- Extraction du texte et chargement dans l’éditeur
- Export manuel du texte modifié
  - `.txt` (obligatoire)
  - `.docx` (si implémentation simple)

- Import de document (txt, docx, pdf)
- Extraction du texte et chargement dans l’éditeur

- Éditeur de texte (TipTap)
- Sélection inline
- Bouton contextuel « Réécrire »
- Génération de 5 propositions distinctes
- Insertion d’une proposition
- Annulation / Undo natif
- Utilisation de l’API OpenAI (clé propriétaire)
- Prompt unique, figé, soigneusement travaillé

### Exclu volontairement
- Sauvegarde serveur
- Autosave
- Reprise de session
- Versioning
- Comptes utilisateurs
- Historique de documents

- Édition collaborative
- Gestion avancée de la mise en page
- Export formaté (PDF, DOCX)

- Authentification
- Comptes utilisateurs
- Projets / dossiers
- Sauvegarde / historique
- Styles personnalisables
- Réglages utilisateur
- Streaming
- Base de données

**Règle stricte : si ce n’est pas indispensable à la boucle sélection → remplacement, c’est hors scope.**

---

## 7. UX – Principes non négociables
- Pas de modal plein écran
- Pas de sidebar
- Pas de chat
- Pas de jargon IA
- Interaction en maximum 2 clics après sélection
- Interface silencieuse, rapide, discrète

---

## 8. Exigences techniques

### Gestion des données (MVP)
- Aucune base de données requise
- Aucune donnée utilisateur persistée
- Aucun texte stocké après la session

---



### Stack
- Next.js 16+ (App Router)
- React Server Components
- TipTap
- shadcn/ui
- Librairie d’extraction de texte (ex: pdf-parse, mammoth)
- API Routes / Server Actions
- OpenAI API

- Next.js 16+ (App Router)
- React Server Components
- TipTap
- shadcn/ui
- API Routes / Server Actions
- OpenAI API

### Architecture
Le projet **doit impérativement respecter les principes de la Clean Architecture**, adaptés à Next.js :

#### Séparation des couches
- **Domain** : entités `TextDocument`, règles métier
- **Application** : cas d’usage (`ImportDocumentUseCase`, `RewriteTextUseCase`, `ExportDocumentUseCase`)
- **Infrastructure** : parsers (docx, pdf), exporters, implémentation OpenAI
- **Interface** : composants React, éditeur, UI

#### Règles
- Le domaine ne dépend d’aucun framework
- OpenAI est abstrait derrière une interface (LLMProvider)
- Les parsers et exporters sont des implémentations interchangeables
- Les composants UI ne contiennent aucune logique métier
- Les API routes / server actions orchestrent, elles ne décident pas

Objectif : permettre l’évolution future (sauvegarde, projets, mémoire) sans refonte.

Le projet **doit impérativement respecter les principes de la Clean Architecture**, adaptés à Next.js :

#### Séparation des couches
- **Domain** : logique métier pure (réécriture, règles, contrats)
- **Application** : cas d’usage (RewriteTextUseCase)
- **Infrastructure** : implémentation OpenAI, frameworks, APIs externes
- **Interface** : composants React, éditeur, UI

#### Règles
- Le domaine ne dépend d’aucun framework
- OpenAI est abstrait derrière une interface (LLMProvider)
- Les composants UI ne contiennent aucune logique métier
- Les API routes / server actions orchestrent, elles ne décident pas

Objectif : permettre l’évolution future (styles, mémoire, fine-tuning) sans refonte.

---

## 9. Prompting (MVP)
- Prompt unique
- Génération de 5 variantes clairement différenciées
- Respect strict du sens original
- Préservation de la voix de l’auteur
- Interdiction des clichés et du remplissage

Le prompt est considéré comme **une pièce critique du produit**.

---

## 10. Critères de réussite
- Temps sélection → propositions < 3 secondes
- Les 5 propositions sont réellement différentes
- Aucun besoin d’expliquer ou de reconfigurer la demande
- L’outil est utilisable sans documentation

---

## 11. Planning cible (indicatif)
- Jour 1–2 : setup projet + éditeur
- Jour 3 : clean architecture + use case rewrite
- Jour 4 : intégration OpenAI + prompt
- Jour 5 : UI propositions + insertion
- Jour 6 : tests réels sur textes longs
- Jour 7 : polish UX + mise en production

---

## 12. Positionnement produit
Ce MVP n’est pas un produit final.
C’est la **fondation d’un outil d’écriture chirurgical**, capable d’évoluer vers :
- styles personnalisés
- mémoire de la voix
- analyse stylistique avancée

Mais **pas avant d’avoir prouvé la valeur du cœur : la réécriture instantanée**.

