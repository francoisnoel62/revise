<div align="center">

# ✍️ Revise

### L'outil d'écriture IA conçu pour les auteurs de fiction

**Débloquez. Explorez. Réécrivez. Sans quitter votre flow.**

[![Tests](https://img.shields.io/badge/tests-520%20passed%20%7C%2032%20skipped-success?style=flat-square)](https://github.com/yourusername/revise)
[![Coverage](https://img.shields.io/badge/coverage-40.8%25-blue?style=flat-square)](https://github.com/yourusername/revise)
[![Architecture](https://img.shields.io/badge/architecture-9.5%2F10-purple?style=flat-square)](https://github.com/yourusername/revise)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

[Pourquoi Revise](#pourquoi-revise) • [Fonctionnalités](#-fonctionnalités) • [Installation](#-installation) • [Documentation](#-documentation) • [Contribuer](#-contribuer)

<br />

<img src="docs/assets/revise-demo.gif" alt="Revise Demo" width="800" />

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
| 👤 **Personnages plats** | Travaille les motivations, réactions, arcs |
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
- **Navigation par chapitres** : Panneau latéral, drag & drop, renommage inline
- **Export multi-format** : DOCX et PDF avec typographie préservée
- **Auto-save** : Vers MongoDB, debounce 1 seconde
- **Historique des corrections** : Retrouvez toutes vos réécritures par chapitre

### 📄 Expérience d'écriture A4

- **Page réaliste** : 794px, ombres, marges professionnelles
- **Typographie** : Georgia / Times New Roman, 11-16pt
- **Mise en page** : Alignement, indentation première ligne, interligne 1.5
- **Compteur de mots** : Statistiques caractères/mots en temps réel
- **Undo/Redo** : Boutons dans la toolbar + raccourcis clavier
- **Raccourcis** : Gras, italique, surligné, tiret cadratin...

### 🧠 Analyse de manuscrit par IA

Six types d'analyse pour comprendre votre texte en profondeur :

| Analyse | Ce qu'elle révèle |
|---------|-------------------|
| **Narrative** | POV, structure, temporalité, voix |
| **Personnages** | Profils, relations, hiérarchie narrative |
| **Intrigue** | Structure, conflits, progression, fils narratifs |
| **ADN Stylistique** | Registre, syntaxe, figures de style, règles d'écriture |
| **Worldbuilding** | Thèmes, symbolisme, décor, contexte social |
| **Synthèse** | Méta-analyse avec feedback éditorial |

> **Cache intelligent** : Les analyses ne se régénèrent que si votre contenu change réellement (hash SHA-256).

### ✨ UX soignée

- **Citations d'auteurs** : 100 citations inspirantes pendant l'attente IA
- **Progression visuelle** : Barre de chargement avec rotation des citations
- **Menu contextuel** : Régénération des analyses via menu 3 points

### 🔌 Multi-providers IA

Apportez votre propre clé API :

<p align="center">
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Anthropic-191919?style=for-the-badge&logo=anthropic&logoColor=white" alt="Anthropic" />
  <img src="https://img.shields.io/badge/Mistral-FF7000?style=for-the-badge&logo=mistral&logoColor=white" alt="Mistral" />
  <img src="https://img.shields.io/badge/Cohere-39594D?style=for-the-badge" alt="Cohere" />
  <img src="https://img.shields.io/badge/Google_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google AI" />
</p>

### 🔐 Sécurité

- **Chiffrement AES-256-GCM** des clés API
- **Isolation multi-tenant** par utilisateur
- **Auth.js + bcrypt** (12 rounds)
- **Clés jamais exposées** côté client

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

# 🗄️ Requis : Base de données
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_DB_NAME=revise

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

---

## 🏗️ Architecture

Clean Architecture stricte avec séparation par couches :

```
src/
├── domain/           # Logique métier pure (zéro dépendance)
│   ├── entities/     # Chapter, Project, Provider, User, ProjectMetadata
│   ├── value-objects/# TextSelection, RewriteProposal, MetadataType...
│   └── interfaces/   # Contrats repositories & services
│
├── application/      # Use cases orchestrant le domaine
│   └── use-cases/    # 25+ use cases
│
├── infrastructure/   # Implémentations externes
│   ├── ai/           # Providers OpenAI, Anthropic
│   ├── persistence/  # Repositories MongoDB
│   └── document/     # Import/export DOCX
│
└── app/              # Couche interface Next.js
```

> Cette architecture a permis d'ajouter la persistence (Phase 3), la gestion des providers (Phase 3.5) et l'analyse de manuscrit (Phase 3.6) **sans refactorer le code existant**.

---

## 🧪 Tests

```bash
npm test                  # 520+ tests passed + 32 skipped (552+ total)
npm run test:coverage     # Rapport de couverture (40.8%)
npm run test:integration  # Tests avec vraies APIs (OpenAI & Anthropic)
npm run test:e2e          # Tests end-to-end (Playwright)
```

| Statistiques | Valeur |
|--------------|--------|
| Tests totaux | 552+ (520+ passed, 32 skipped) |
| Fichiers de test | 80+ (66+ passed, 14 skipped) |
| Couverture globale | 40.8% (v8) |
| Couverture domaine | 92%+ (entités) |
| Couverture application | **100%** (use cases) |
| Tests d'intégration | 12 provider-specific (conditional) |

---

## 🗺️ Roadmap

### ✅ Livré

- [x] Phase 1-2 : Réécriture, multi-chapitres, import/export
- [x] Phase 2.5 : Style A4, contrôles typographiques
- [x] Phase 3 : Persistence MongoDB, authentification
- [x] Phase 3.5 : Multi-providers, chiffrement, Clean Architecture
- [x] Phase 3.6 : Analyse de manuscrit IA (6 types)
- [x] Phase 3.7 : Export PDF, historique des corrections, UX améliorée

### 🔜 Phase 4

- [ ] Recherche full-text dans les chapitres
- [ ] Templates de chapitres
- [ ] Objectifs d'écriture & statistiques
- [ ] Partage de projets

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
