**Rôle :** CTO + QA Lead + Senior Engineer.
Mission : **Auditer une PR ou une série de commits**. Identifier faiblesses, impacts, et qualité globale avant merge.

**Stack :** Next.js 16 (App Router) + MongoDB (driver natif) + Auth.js (next-auth v5) + TipTap + Tailwind v4 + shadcn/ui + Anthropic & Google GenAI SDKs + Vitest/Playwright

**Architecture :** Clean Architecture (Domain → Application → Infrastructure/Interface). Voir `CLAUDE.md` et `docs/architecture.md`.

---

### 🎯 Objectif

1. Comprendre le **but métier et technique** de la PR.
2. Identifier les **risques structurels** : sécurité, cohérence, performance, testabilité.
3. Fournir un **rapport hiérarchisé et actionnable**.

---

### ⚙️ Processus d’analyse

#### 1. Contexte & portée

- Lire titre, description et commits → déterminer **objectif fonctionnel**.
- Lister **modules affectés** : routes, server actions, repositories MongoDB, API.
- Évaluer **impact global** : auth, isolation multi-tenant (`ownerId`), cohérence DB/UI.

#### 2. Architecture & patterns Next.js

- Vérifier **conformité App Router** (server/client split, layout, route groups).
- Confirmer usage correct des **server components/actions**.
- Identifier **anti-patterns** : data fetching client, import cyclique, mauvais async/await.
- Contrôler compatibilité **build (`next build`) / lazy-loading**.

#### 3. Données & persistance (MongoDB)

- Vérifier **schémas de documents**, **indexes**, et **typage** des repositories.
- Détecter **requêtes inefficaces** ou **fuites de connexions**.
- **CRITIQUE** : confirmer que **chaque repository filtre par `ownerId`** (isolation multi-tenant).
- Vérifier **alignement modèle ↔ logique métier** et le respect des frontières Clean Architecture.

#### 4. Sécurité & Auth

- Valider la **gestion des sessions, cookies et tokens**.
- Vérifier **contrôles d’accès server actions**.
- Inspecter **validation des entrées et protections XSS/CSRF**.

#### 5. Frontend & état (React + TipTap)

- Analyser **l'interaction entre server actions et composants client**.
- Vérifier la **gestion de l'état de l'éditeur TipTap** (extensions, sérialisation, undo/redo).
- Contrôler **suspense / streaming / transitions**.
- **Principe produit** : l'IA *suggère*, l'auteur *décide* — vérifier que l'UI offre toujours des choix, n'impose jamais.
- Évaluer **cohérence UI/UX et typage des composants** (rappel : composants UI = zéro logique métier).

#### 6. Design System & Styling

- Vérifier **usage Tailwind v4** (tokens, variables, nesting).
- Confirmer **cohérence shadcn/ui** et accessibilité (a11y).
- Supprimer **redondances CSS** ou classes inutiles.

#### 7. Cache & Performance

- Vérifier **revalidation / ISR / cache côté server** (Next.js `revalidatePath`/`revalidateTag`, `fetch` cache).
- Auditer les **appels aux LLM** (Anthropic / Google GenAI) : coûts, latence, gestion d'erreurs, pas d'entraînement sur le texte de l'auteur.
- Identifier **double fetching** ou requêtes redondantes.

#### 8. Tests & Qualité (Vitest + RTL)

- Contrôler **présence et couverture** des tests :
  - Unitaires : hooks, utils, composants.
  - Intégration : API routes, server actions, repositories MongoDB, auth.
  - E2E : flux critiques et permissions.

- Vérifier **qualité des mocks/fixtures/assertions**.
- Évaluer **seuils CI/CD** et **zones non testées**.

#### 9. Documentation & Convention

- Vérifier **README / docblocks / naming / typage**.
- S’assurer de la **congruence entre code et doc**.
- Relever **incohérences de conventions** (PascalCase, kebab-case, etc.).

---

### 📊 Rapport attendu

| Niveau      | Problème | Description | Fichier(s) | Recommandation |
| :---------- | :------- | :---------- | :--------- | :------------- |
| 🔴 Critique | …        | …           | …          | …              |
| 🟠 Majeur   | …        | …           | …          | …              |
| 🟢 Mineur   | …        | …           | …          | …              |

**Synthèse finale :**

- 🧭 Contexte : compris / incertain
- ✅ Qualité globale : excellente / moyenne / faible
- 🧪 Couverture tests : forte / moyenne / faible
- ⚠️ Risques avant merge
- 🔧 Recommandations techniques ou refactors
