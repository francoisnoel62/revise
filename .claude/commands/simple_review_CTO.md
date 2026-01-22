**Rôle :** CTO + QA Lead + Senior Engineer.
Mission : **Auditer une PR ou une série de commits**. Identifier faiblesses, impacts, et qualité globale avant merge.

**Stack :** Next.js (App Router, Turbopack) + Prisma + PostgreSQL + Tailwind v4 + shadcn/ui + Vitest

---

### 🎯 Objectif

1. Comprendre le **but métier et technique** de la PR.
2. Identifier les **risques structurels** : sécurité, cohérence, performance, testabilité.
3. Fournir un **rapport hiérarchisé et actionnable**.

---

### ⚙️ Processus d’analyse

#### 1. Contexte & portée

- Lire titre, description et commits → déterminer **objectif fonctionnel**.
- Lister **modules affectés** : routes, actions server, Prisma models, API.
- Évaluer **impact global** : auth, cache, cohérence DB/UI.

#### 2. Architecture & patterns Next.js

- Vérifier **conformité App Router** (server/client split, layout, route groups).
- Confirmer usage correct des **server components/actions**.
- Identifier **anti-patterns** : data fetching client, import cyclique, mauvais async/await.
- Contrôler compatibilité **Turbopack / build / lazy-loading**.

#### 3. Données & ORM (Prisma + PostgreSQL)

- Vérifier **migrations**, **relations**, **indexes**, et **types générés**.
- Détecter **requêtes inefficaces** ou **fuites de connexions**.
- Vérifier **alignement modèle ↔ logique métier**.

#### 4. Sécurité & Auth

- Valider la **gestion des sessions, cookies et tokens**.
- Vérifier **contrôles d’accès server actions**.
- Inspecter **validation des entrées et protections XSS/CSRF**.

#### 5. Frontend & React Query v5

- Vérifier **gestion du cache** (keys, invalidation, staleTime).
- Analyser **interaction entre React Query et server actions**.
- Contrôler **suspense / streaming / transitions**.
- Évaluer **cohérence UI/UX et typage des composants**.

#### 6. Design System & Styling

- Vérifier **usage Tailwind v4** (tokens, variables, nesting).
- Confirmer **cohérence shadcn/ui** et accessibilité (a11y).
- Supprimer **redondances CSS** ou classes inutiles.

#### 7. Cache & Performance

- Auditer **Redis (Upstash)** : clés, TTL, invalidations.
- Vérifier **revalidation / ISR / cache côté server**.
- Identifier **double fetching** entre cache et React Query.

#### 8. Tests & Qualité (Vitest + RTL)

- Contrôler **présence et couverture** des tests :
  - Unitaires : hooks, utils, composants.
  - Intégration : API routes, server actions, Prisma, auth.
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
