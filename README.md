<div align="center">

# ✍️ Revise

### L'outil d'écriture IA conçu pour les auteurs de fiction

**Débloquez. Explorez. Réécrivez. Sans quitter votre flow.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

[Pourquoi Revise](#pourquoi-revise) • [Fonctionnalités](#-fonctionnalités) • [Installation](#-installation) • [Documentation](#-documentation) • [Contribuer](#-contribuer)

<br />

</div>

---

## Pourquoi Revise ?

Les IA généralistes sont des couteaux suisses. Revise est un **scalpel pour la fiction**.

Il comprend ce que ChatGPT ignore : les scènes, les conflits, la tension dramatique, les arcs narratifs. Il pousse votre créativité — parfois au détriment de la précision factuelle. **C'est volontaire.**

### Ce que Revise fait pour vous

| Situation | Comment Revise aide |
|-----------|---------------------|
| 🧱 **Blocage d'écriture** | Propose des continuations cohérentes avec votre style |
| 🎬 **Scène qui ne fonctionne pas** | Améliore le rythme, les descriptions, les émotions |
| 🔀 **Exploration créative** | Génère des variantes : mêmes idées, tons différents |
| 👤 **Personnages plats** | Travaille les motivations, réactions, arcs ; discutez directement avec eux |
| ✏️ **Phrase qui coince** | 3 reformulations distinctes, vous choisissez |

### Le verdict clair

<table>
<tr>
<td width="50%" valign="top">

#### ✅ Parfait pour vous si...

- Vous écrivez des **romans, nouvelles, scénarios**
- Vous cherchez un **co-auteur brutal mais inspirant**
- Vous voulez un outil qui **comprend la narration**
- Vous acceptez qu'il **challenge vos choix**

</td>
<td width="50%" valign="top">

#### ❌ Passez votre chemin si...

- Vous voulez un assistant **polyvalent**
- Vous cherchez du **technique, marketing, factuel**
- Vous espérez qu'il **écrive le livre à votre place**
- Vous voulez des réponses **toujours précises**

</td>
</tr>
</table>

> ⚠️ **Avertissement honnête** : Si vous utilisez Revise comme un pilote automatique, le résultat sera plat. C'est un instrument, pas une béquille.

### Revise vs ChatGPT

| Critère | Revise | ChatGPT |
|---------|--------|---------|
| Comprend les arcs narratifs | ✅ Natif | ⚠️ Avec prompting |
| Propose des variantes stylistiques | ✅ 3 d'un coup | ❌ Une à la fois |
| Respecte votre voix d'auteur | ✅ Analyse votre style | ⚠️ Tend à uniformiser |
| Gère des manuscrits multi-chapitres | ✅ Conçu pour | ❌ Limité par le contexte |
| Précision factuelle | ⚠️ Sacrifiée pour la créativité | ✅ Prioritaire |
| Polyvalence | ❌ Fiction uniquement | ✅ Tout-terrain |

---

## ✨ Fonctionnalités

### L'essentiel : Réécriture instantanée

```
Sélectionnez du texte → Cliquez "Réécrire" → 3 alternatives apparaissent → Insérez votre choix
```

Pas de chat. Pas d'explications. Pas de friction. Vous restez dans votre flow.

**3 styles distincts** : épuré, lyrique, amplifié — pour un choix clair sans surcharge cognitive.

### 📚 Gestion de manuscrit

- **Import .docx intelligent** : Détection automatique des chapitres (H1)
- **Import de dossier Markdown** : Importez un dossier de fichiers .md comme chapitres
- **Navigation par chapitres** : Panneau latéral, drag & drop, renommage inline
- **Export multi-format** : DOCX et PDF avec typographie préservée et image de couverture
- **Sélection des chapitres** : Choisissez les chapitres à exporter ou publier
- **Auto-save** : Vers MongoDB, debounce 1 seconde
- **Historique des corrections** : Retrouvez toutes vos réécritures par chapitre
- **Génération de texte IA** : Générez le début d'un chapitre vide avec contexte du projet
- **Autocomplétion IA** : Appuyez sur Tab pour déclencher une suggestion (streaming temps réel) ; `→` accepte un mot, `Tab` accepte tout, `Échap` rejette ; point animé quand une suggestion est déjà prête en arrière-plan ; variantes navigables au clavier ; préférences par projet (longueur, audace, prefetch)
- **Partage public** : Partagez votre projet via un lien unique en lecture seule
- **Temps de lecture** : Affichage du temps de lecture estimé par chapitre
- **Image de couverture** : Uploadez une image de couverture pour vos projets
- **Objectifs d'écriture** : Définissez des objectifs quotidiens, hebdomadaires ou totaux

### 📄 Expérience d'écriture A4

- **Page réaliste** : 794px, ombres, marges professionnelles
- **Typographie** : Georgia / Times New Roman, 11-16pt
- **Mise en page** : Alignement, indentation première ligne, interligne 1.5
- **Compteur de mots** : Statistiques caractères/mots en temps réel
- **Undo/Redo** : Boutons dans la toolbar + raccourcis clavier
- **Raccourcis** : Gras, italique, surligné, tiret cadratin...

### 💬 Chat avec les personnages

Interagissez directement avec vos personnages dans leur voix :

- **Conversation immersive** : Le personnage répond en s'appuyant sur son profil (traits, motivations, arcs), le manuscript et les métadonnées du projet
- **Streaming temps réel** : Les réponses arrivent mot par mot, comme un vrai dialogue
- **Historique persisté** : La conversation se sauvegarde et reprend à la réouverture
- **Copie rapide** : Bouton "Copier" sur chaque réponse du personnage pour insérer une réplique dans le manuscrit
- **Fiche personnage auto-générée** : Un bouton "Auto-fill" analyse le manuscrit et remplit les 8 champs de la fiche ; vous gardez le contrôle final

### 🧠 Analyse de manuscrit par IA

Sept types d'analyse pour comprendre votre texte en profondeur :

| Analyse | Ce qu'elle révèle |
|---------|-------------------|
| **Narrative** | POV, structure, temporalité, voix |
| **Personnages** | Profils, relations, hiérarchie narrative |
| **Intrigue** | Structure, conflits, progression, fils narratifs |
| **ADN Stylistique** | Registre, syntaxe, figures de style, règles d'écriture |
| **Worldbuilding** | Thèmes, symbolisme, décor, contexte social |
| **Résumés des chapitres** | Résumé concis de chaque chapitre + arc narratif global |
| **Synthèse** | Méta-analyse avec feedback éditorial |

> **Cache intelligent** : Les analyses ne se régénèrent que si votre contenu change réellement (hash SHA-256).

### ✅ Vérification de chapitre

Analysez vos chapitres pour détecter et corriger les erreurs :

| Catégorie | Ce qu'elle détecte |
|-----------|-------------------|
| **Orthographe** | Fautes d'orthographe avec suggestions de correction |
| **Grammaire** | Erreurs grammaticales et accords |
| **Ponctuation** | Erreurs de ponctuation et typographie |
| **Style** | Suggestions d'amélioration stylistique |
| **Répétitions** | Mots et phrases répétés trop souvent |

**Fonctionnalités** :
- 3 niveaux de rigueur : strict, équilibré, léger
- Application des corrections en un clic
- Exclusion de mots des répétitions (noms de personnages)
- Historique des analyses par chapitre
- Export du rapport d'analyse en Markdown

### ✨ UX soignée

- **Citations d'auteurs** : 100 citations inspirantes pendant l'attente IA
- **Progression visuelle** : Barre de chargement avec rotation des citations
- **Menu contextuel** : Régénération des analyses via menu 3 points

### 🔌 Multi-providers IA

Apportez votre propre clé API :

<p align="center">
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Anthropic-191919?style=for-the-badge&logo=anthropic&logoColor=white" alt="Anthropic" />
  <img src="https://img.shields.io/badge/Google_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google AI" />
</p>

### 🔐 Sécurité & Conformité RGPD

- **Chiffrement AES-256-GCM** des clés API
- **Isolation multi-tenant** par utilisateur
- **Auth.js + bcrypt** (12 rounds)
- **Clés jamais exposées** côté client
- **Approbation des inscriptions** par administrateur avec email de notification
- **Rate limiting** : Protection contre les abus (5 requêtes/IP/heure à l'inscription)
- **hCaptcha** : Vérification anti-bot à l'inscription
- **Consentement RGPD** enregistré avec timestamps
- **Suppression de compte** avec effacement de toutes les données associées
- **Export des données personnelles** (Article 20 RGPD)
- **Pages légales complètes** : CGU, CGV, Mentions légales, Politique de confidentialité, Politique cookies
- **Bannière de cookies** conforme RGPD

### 📝 Blog

Section blog intégrée avec articles SEO pour les auteurs :

- **Techniques d'écriture** : Cliffhangers, méthodes plotter/pantser
- **Création de personnages** : Antagonistes, arcs de transformation, personnages secondaires
- **Conseils éditoriaux** : Ce que recherchent les éditeurs
- **IA & écriture** : L'IA comme outil de réécriture
- **Admin blog** : Interface d'administration pour gérer les articles

---

## ⚡ Performance

| Opération | Cible | Réel | vs. Cible |
|-----------|-------|------|-----------|
| Export document | < 2s | **57ms** | 🚀 35× plus rapide |
| Changement de chapitre | < 200ms | **0.23ms** | 🚀 870× plus rapide |
| Mise à jour contenu | < 100ms | **0.10ms** | 🚀 1000× plus rapide |
| Réécriture IA | < 3s | **2.7-3.3s** | ✅ Dans la cible |

---

## 🚀 Installation

### Prérequis

- Node.js 18+
- Compte MongoDB Atlas ([tier gratuit disponible](https://www.mongodb.com/cloud/atlas))
- Clé API d'un provider IA supporté

### Installation rapide

```bash
git clone https://github.com/yourusername/revise.git
cd revise
npm install
cp .env.example .env.local
```

### Configuration

```env
# 🔐 Requis : Auth & Chiffrement
AUTH_SECRET=votre-secret-aleatoire-min-32-chars
ENCRYPTION_KEY=votre-cle-chiffrement-32-caracteres
NEXT_PUBLIC_APP_URL=https://votre-domaine.com

# 🗄️ Requis : Base de données
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DB_NAME=revise

# 📧 Requis : Emails (système d'approbation)
RESEND_API_KEY=re_votre-cle-resend
ADMIN_EMAIL=admin@votre-domaine.com
EMAIL_FROM=noreply@votre-domaine.com

# 🤖 Optionnel : Provider IA par défaut (configurable via UI)
OPENAI_API_KEY=sk-votre-cle-api
OPENAI_MODEL=gpt-4o-mini
```

<details>
<summary><strong>🔑 Générer des clés sécurisées</strong></summary>

```bash
openssl rand -base64 32  # Pour AUTH_SECRET
openssl rand -base64 32  # Pour ENCRYPTION_KEY
```

</details>

### Lancer

```bash
npm run dev          # Développement
npm run build && npm start  # Production
```

Ouvrez [http://localhost:3000](http://localhost:3000).

---

## 📖 Documentation

### Workflow type

```mermaid
graph LR
    A[Créer un compte] --> B[Ajouter un provider IA]
    B --> C[Créer/Importer un projet]
    C --> D[Écrire]
    D --> E{Blocage ?}
    E -->|Oui| F[Sélectionner texte]
    F --> G[Réécrire]
    G --> H[Choisir parmi 3]
    H --> D
    E -->|Non| I[Continuer]
    I --> D
    D --> J[Exporter DOCX/PDF]
```

### Raccourcis clavier

| Action | Raccourci |
|--------|-----------|
| Gras | `Ctrl/⌘ + B` |
| Italique | `Ctrl/⌘ + I` |
| Souligné | `Ctrl/⌘ + U` |
| Surligné | `Ctrl/⌘ + Shift + H` |
| Tiret cadratin (—) | `Ctrl/⌘ + K` |
| Annuler | `Ctrl/⌘ + Z` |
| Rétablir | `Ctrl/⌘ + Shift + Z` |
| Autocomplétion — déclencher / accepter tout | `Tab` |
| Autocomplétion — accepter un mot | `→` (flèche droite) |
| Autocomplétion — ignorer | `Échap` |
| Palette de commandes IA | `Ctrl/⌘ + Shift + I` |

---

## 🏗️ Architecture

Clean Architecture stricte avec séparation par couches :

```
src/
├── domain/           # Logique métier pure (zéro dépendance)
│   ├── entities/     # Chapter, Project, Provider, User, ProjectMetadata, CorrectionHistory, BlogArticle, ContactMessage, Character, CharacterConversation, ProjectSettings, ProjectTask, ResearchDocument, WritingGoal, AIUsageRecord, AutocompleteEvent, CanonFact
│   ├── value-objects/# TextSelection, RewriteProposal, MetadataType, TaskPriority, TaskStatus, Contributor, RelatedWork, NarrationSettings, AIOperationType, ChatMessage, ModelPricing, AutocompletePreferences, AutocompleteIntent, AutocompleteOutcome, CanonFacts...
│   └── interfaces/   # Contrats repositories & services
│
├── application/      # Use cases orchestrant le domaine
│   └── use-cases/    # 90+ use cases
│
├── infrastructure/   # Implémentations externes
│   ├── ai/           # Providers OpenAI, Anthropic, TrackedLLMProvider
│   ├── persistence/  # Repositories MongoDB (18 repositories)
│   ├── storage/      # Vercel Blob Storage
│   ├── email/        # Service email Resend
│   └── document/     # Import/export DOCX/PDF
│
└── app/              # Couche interface Next.js
    ├── (auth)/       # Pages signin, signup
    ├── project/      # Éditeur et cockpit projet
    ├── blog/         # Section blog
    ├── admin/        # Administration blog
    └── settings/     # Paramètres utilisateur
```

> Cette architecture a permis d'ajouter la persistence (Phase 3), la gestion des providers (Phase 3.5) et l'analyse de manuscrit (Phase 3.6) **sans refactorer le code existant**.

---

## 🧪 Tests

```bash
npm test                  # 1700+ tests passed
npm run test:coverage     # Rapport de couverture
npm run test:integration  # Tests avec vraies APIs (OpenAI & Anthropic)
npm run test:e2e          # Tests end-to-end (Playwright)
```

| Statistiques | Valeur |
|--------------|--------|
| Tests totaux | 1750+ |
| Tests passés | 1700+ |
| Fichiers de test | 200+ |
| Couverture domaine | 92%+ (entités) |
| Couverture application | **100%** (use cases) |
| Tests d'intégration | 35+ provider-specific (conditional) |

---

## 🗺️ Roadmap

### ✅ Livré

- [x] Phase 1-2 : Réécriture, multi-chapitres, import/export
- [x] Phase 2.5 : Style A4, contrôles typographiques
- [x] Phase 3 : Persistence MongoDB, authentification
- [x] Phase 3.5 : Multi-providers, chiffrement, Clean Architecture
- [x] Phase 3.6 : Analyse de manuscrit IA (6 types)
- [x] Phase 3.7 : Export PDF, historique des corrections, UX améliorée
- [x] Phase 3.8 : Système d'approbation des inscriptions avec emails
- [x] Phase 3.9 : Traduction FR complète
- [x] Phase 3.10 : Création projet sans provider IA obligatoire
- [x] Phase 3.11 : Conformité RGPD/LCEN (pages légales, cookies, suppression compte)
- [x] Phase 4.0 : Section blog avec articles SEO
- [x] Phase 4.1 : Génération de texte IA + autocomplétion
- [x] Phase 4.1+ : Menu IA unifié, palette de commandes, responsive mobile, temps de lecture, pagination blog
- [x] Phase 5.0 : Partage public de projets via liens uniques
- [x] Phase 5.1 : Import de dossier Markdown
- [x] Phase 6.0 : Project Cockpit (tableau de bord projet, gestion personnages, tâches, objectifs, recherche, statistiques IA)
- [x] Phase 6.1 : Images de couverture, objectifs d'écriture, sélection des chapitres, rate limiting, hCaptcha
- [x] Phase 7.0 : Vérification de chapitre (orthographe, grammaire, ponctuation, style, répétitions)
- [x] Phase 8.0 : Stratégie de contexte IA — l'IA écrit à partir des métadonnées et documents de recherche de l'auteur, avec la règle « l'édition de l'auteur l'emporte » et un indicateur de péremption des analyses
- [x] Phase 9.0 : Chat avec les personnages (streaming SSE, historique persisté) + fiche personnage auto-générée + suivi des coûts IA (€) avec calcul par token + menu cockpit dans l'éditeur
- [x] Phase 10.0 : Refonte autocomplétion — manuscrit-premier, acceptation partielle (mot / tout), variantes par intention, prefetch silencieux + breathing dot, préférences par projet, télémétrie de qualité, registre canon (cohérence long roman), génération longue déclassée

### 🔜 En cours

- [ ] Recherche full-text dans les chapitres
- [ ] Templates de chapitres
- [ ] Historique de versions

### 🔮 Futur

- [ ] Collaboration temps réel
- [ ] Commentaires & annotations
- [ ] Mémoire de style/voix
- [ ] Prompts IA personnalisés

---

## Principes

1. **Performance > fonctionnalités**
2. **Simplicité > flexibilité**
3. **Clean Architecture > hacks rapides**

---

<div align="center">

**Construit pour les auteurs exigeants qui veulent un co-auteur brutal, pas un pilote automatique.**

[⬆ Retour en haut](#-revise)

</div>
