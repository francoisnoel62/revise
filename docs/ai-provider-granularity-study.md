# Étude IA — granularité par fonctionnalité et abstraction multi-providers

## Objectif

Cette étude cartographie les usages d'intelligence artificielle dans Revise et propose une refonte progressive pour permettre à chaque fonctionnalité de choisir le bon niveau de capacité — simple génération, JSON strict, streaming, outil d'analyse, ou raisonnement — sans lier le domaine à un provider ou à un modèle précis.

Constat principal : l'interface actuelle `LLMProvider` expose des méthodes métier très nombreuses, et chaque provider réimplémente presque toute la logique de prompts, de parsing JSON, de streaming, de suivi d'usage et d'options modèle. Cette structure rend les évolutions de modèles coûteuses, notamment quand Anthropic et Google ajoutent des options de raisonnement différentes selon les familles de modèles.

## Sources externes consultées

- Anthropic documente le raisonnement étendu via un budget de tokens de pensée, et indique que des budgets plus élevés peuvent améliorer la qualité sur les problèmes complexes : https://platform.claude.com/docs/en/build-with-claude/extended-thinking
- Anthropic documente aussi un mode de raisonnement adaptatif pour certaines générations récentes, où le modèle décide dynamiquement quand et combien raisonner : https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking
- Google documente `thinkingBudget` pour Gemini 2.5 et recommande `thinkingLevel` pour Gemini 3 ; `thinkingBudget` reste accepté mais peut produire un comportement inattendu avec Gemini 3 Pro : https://ai.google.dev/gemini-api/docs/thinking
- Google documente les thought signatures pour conserver un contexte de raisonnement entre étapes multi-tours sur Gemini 2.5/3 : https://ai.google.dev/gemini-api/docs/thought-signatures

Ces éléments justifient de ne pas coder les options de raisonnement directement dans les méthodes métier : elles doivent être traduites par adaptateur selon la capacité réelle du modèle.

## Cartographie des fonctionnalités IA

| Fonctionnalité | Entrée principale | Sortie attendue | Streaming | JSON strict | Raisonnement recommandé | Commentaire |
| --- | --- | --- | --- | --- | --- | --- |
| Réécriture de sélection | Texte sélectionné, contexte, profil auteur | 3 propositions typées | Non | Oui | Non par défaut | Tâche créative courte ; privilégier faible latence et température créative. |
| Autocomplétion | Texte avant/après curseur, contexte projet | 1-3 phrases | Oui | Non | Non | Tâche interactive ; le raisonnement augmenterait la latence sans bénéfice clair. |
| Chat personnage | Historique, prompt persona | Réponse conversationnelle | Oui | Non | Faible/auto seulement si contexte complexe | Besoin de cohérence de persona, mais latence importante. |
| Fiche personnage auto-remplie | Nom, champs existants, contexte projet | Champs structurés | Non | Oui | Faible à moyen | Raisonnement utile si le contexte est long ou ambigu. |
| Alternatives lexicales IA | Mot, phrase, profil auteur | 3-5 alternatives justifiées | Non | Oui | Non | Tâche locale ; un modèle rapide suffit. |
| Analyse narrative | Manuscrit complet | Objet `NarrativeAnalysis` | Non | Oui | Moyen | Raisonnement utile pour focalisation, structure et voix narrative. |
| ADN stylistique | Manuscrit complet | Objet `StylisticDNA` | Non | Oui | Moyen | Raisonnement utile pour inférer règles et tics d'écriture. |
| Personnages | Manuscrit complet | Objet `Characters` | Non | Oui | Moyen à élevé | Extraction relationnelle ; peut bénéficier de raisonnement. |
| Intrigue | Manuscrit complet | Objet `Plot` | Non | Oui | Élevé | Analyse de conflits, scènes, arcs et questions dramatiques. |
| Worldbuilding | Manuscrit complet | Objet `Worldbuilding` | Non | Oui | Moyen | Utile pour cohérence d'univers, thèmes et règles implicites. |
| Synthèse éditoriale | Texte + analyses précédentes | Objet `Synthesis` | Non | Oui | Élevé | Méta-analyse ; nécessite arbitrages et consolidation. |
| Résumés de chapitres | Manuscrit balisé | Objet `ChapterSummaries` | Non | Oui | Faible à moyen | Extraction/synthèse ; raisonnement léger si chapitres nombreux. |
| Génération de chapitre | Manuscrit, type de génération, contexte | Prose ou plan | Non | Non ou JSON léger | Moyen | Raisonnement utile pour plan/structure, mais la prose doit rester fluide. |
| Analyse orthographe/grammaire/ponctuation/style/répétitions | Contenu de chapitre | Issues structurées | Non | Oui | Variable : non pour typo, faible/moyen pour style | Le client dédié `AnalysisLLMClient` duplique déjà une partie de l'abstraction. |
| Test de connexion provider | Clé et modèle | Succès/erreur | Non | Non | Non | Doit rester minimal et peu coûteux. |
| Ledger de transparence et usage | Dernier appel IA | Tokens + prompt/input/output | N/A | N/A | N/A | Besoin transversal, pas une capacité métier. |

## Diagnostic codebase

### 1. Interface domaine trop orientée méthodes métier

`LLMProvider` contient une méthode par fonctionnalité IA : réécriture, analyses, génération de chapitre, autocomplétion, chat, fiche personnage et alternatives lexicales. Cette approche garantit une API simple pour les use cases, mais elle oblige chaque provider à dupliquer la logique de toutes les opérations.

Risque : ajouter une option transversale comme `reasoning`, `jsonSchema`, `toolChoice`, `safety`, `cache`, `latencyTier` ou `maxOutputTokens` impose des modifications répétées dans OpenAI, Anthropic, Google, les tests et parfois `AnalysisLLMClient`.

### 2. Fabrique provider fermée

`LLMProviderFactoryImpl` utilise un `switch` sur `openai`, `anthropic`, `google`. Cela rend chaque nouveau provider ou backend compatible OpenAI dépendant d'un changement applicatif, alors qu'une configuration de type endpoint + protocole pourrait suffire.

### 3. Duplication des clients d'analyse

`AnalysisLLMClient` réimplémente OpenAI, Anthropic et Google pour les analyses de chapitre, au lieu de réutiliser un client générique capable de faire un appel JSON strict. Il contient aussi des helpers de parsing JSON dupliqués dans les providers principaux.

### 4. Options modèle codées au mauvais niveau

Les providers définissent localement température, limites de tokens et comportements JSON par méthode. OpenAI possède déjà quelques garde-fous pour les modèles de raisonnement, Anthropic gère un `thinkingBudget` dans un helper, et Google a des commentaires sur le thinking Gemini 3. Mais la décision « cette fonctionnalité a besoin de raisonnement » n'est pas exprimée au niveau métier.

### 5. Observabilité transverse imbriquée dans les providers

`TrackedLLMProvider` décore les appels métier, mais il dépend encore de la liste complète des méthodes `LLMProvider`. Chaque nouvelle opération implique un nouveau wrapper, au lieu d'enregistrer un appel générique avec un `operationType`.

## Architecture cible proposée

### Principe

Séparer trois couches :

1. **Intentions métier IA** : `rewrite.selection`, `analysis.plot`, `chapter.generate`, `chat.character`, etc.
2. **Contrat générique d'inférence** : un petit nombre d'opérations techniques (`generateText`, `generateJson`, `streamText`).
3. **Adaptateurs providers** : traduction des options génériques vers OpenAI, Anthropic, Gemini ou tout autre provider.

### Nouveau contrat générique

```ts
export type AIReasoningEffort = 'none' | 'low' | 'medium' | 'high' | 'adaptive';

export interface AIRequestOptions {
  operation: AIOperationType;
  mode: 'text' | 'json' | 'stream';
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  reasoning?: {
    effort: AIReasoningEffort;
    budgetTokens?: number;
    includeSummary?: boolean;
  };
  json?: {
    schemaName?: string;
    schema?: unknown;
    repair?: boolean;
  };
  latency?: 'interactive' | 'standard' | 'batch';
  costTier?: 'economy' | 'balanced' | 'premium';
}

export interface AIModelClient {
  generateText(request: AITextRequest): Promise<AITextResponse>;
  generateJson<T>(request: AIJsonRequest<T>): Promise<T>;
  streamText(request: AITextRequest): AsyncIterableIterator<string>;
  testConnection(): Promise<ConnectionTestResult>;
  describeCapabilities(): AIModelCapabilities;
}
```

Les use cases ne devraient plus appeler `provider.generatePlot(...)`, mais un service d'opération IA qui connaît la policy : `aiOperations.run('analysis.plot', payload)`.

### Registry de policies par fonctionnalité

Créer un registre central, versionné et testé :

```ts
export const AI_OPERATION_POLICIES = {
  'rewrite.selection': {
    mode: 'json',
    temperature: 0.85,
    maxOutputTokens: 4096,
    reasoning: { effort: 'none' },
    latency: 'standard',
    costTier: 'balanced',
  },
  'completion.stream': {
    mode: 'stream',
    temperature: 0.7,
    maxOutputTokens: 256,
    reasoning: { effort: 'none' },
    latency: 'interactive',
    costTier: 'economy',
  },
  'analysis.plot': {
    mode: 'json',
    temperature: 0.3,
    maxOutputTokens: 8192,
    reasoning: { effort: 'high' },
    latency: 'batch',
    costTier: 'premium',
  },
} satisfies Record<AIOperationType, AIOperationPolicy>;
```

Cette table devient le point unique pour ajuster le raisonnement par fonctionnalité.

### Traduction provider-spécifique

- **OpenAI** : convertir `reasoning.effort` vers les options supportées par les familles de modèles compatibles ; désactiver automatiquement les options incompatibles comme certains formats JSON ou températures quand nécessaire.
- **Anthropic** : convertir `medium/high` vers `thinking` avec budget si le modèle le supporte ; convertir `adaptive` vers le mode adaptatif quand disponible ; retirer `temperature` quand le mode de pensée l'interdit.
- **Google Gemini** : convertir `none/low/medium/high` vers `thinkingBudget` pour Gemini 2.5, vers `thinkingLevel` pour Gemini 3, et préserver les thought signatures pour les workflows multi-étapes si une conversation ou un agent en a besoin.
- **Providers OpenAI-compatible** : supporter une configuration `baseUrl`, `apiKey`, `model`, `capabilities`, avec fallback sans raisonnement si l'API ne supporte pas l'option.

## Plan de migration recommandé

### Phase 1 — Inventaire et contrats sans régression

1. Ajouter `AIOperationType` exhaustif pour toutes les opérations IA existantes.
2. Ajouter `AIOperationPolicy` et `AI_OPERATION_POLICIES` sans modifier le comportement effectif.
3. Ajouter des tests de snapshot de policy : mode, JSON, streaming, température, max tokens, raisonnement attendu.
4. Documenter les opérations qui doivent explicitement rester sans raisonnement.

### Phase 2 — Client générique derrière l'interface actuelle

1. Implémenter `AIModelClient` pour OpenAI, Anthropic et Google.
2. Faire appeler les méthodes existantes de `LLMProvider` via ce client générique.
3. Extraire les helpers communs : assemblage messages, extraction/réparation JSON, token usage, exchange capture, streaming chunks.
4. Supprimer progressivement les duplications de parsing JSON.

### Phase 3 — Remplacer `AnalysisLLMClient`

1. Migrer orthographe, grammaire, ponctuation, style et répétitions vers `generateJson`.
2. Conserver les stratégies d'analyse dans l'application, mais supprimer les trois implémentations provider du client dédié.
3. Ajouter des tests multi-providers au niveau du client générique, pas au niveau de chaque stratégie.

### Phase 4 — Provider/model universel

1. Étendre l'entité provider avec `baseUrl`, `protocol`, `capabilitiesOverride`, `defaultModel`, éventuellement `headers` chiffrés.
2. Remplacer le `switch` strict par un registry d'adaptateurs : `openai-responses`, `openai-chat`, `anthropic-messages`, `google-generate-content`, `openai-compatible`.
3. Permettre à l'utilisateur de choisir n'importe quel modèle, mais afficher les capacités détectées ou configurées : JSON strict, streaming, raisonnement, outils, contexte long.
4. Dégrader proprement : si `analysis.plot` demande `reasoning: high` mais que le modèle ne le supporte pas, soit avertir, soit fallback vers `reasoning: none` selon la criticité de l'opération.

### Phase 5 — Routing intelligent optionnel

1. Ajouter des presets : économique, équilibré, premium, faible latence.
2. Autoriser un modèle par opération au niveau projet ou utilisateur.
3. Ajouter une matrice de compatibilité visible dans l'interface providers.
4. Mesurer qualité/coût/latence par `AIOperationType` grâce au ledger existant.

## Risques et points d'attention

- Le raisonnement peut augmenter fortement coût et latence ; il doit être désactivé pour l'autocomplétion et les micro-tâches.
- Les options de raisonnement ne sont pas homogènes entre providers ni stables entre familles de modèles ; les capacités doivent être détectées ou configurées, pas supposées par nom de modèle seulement.
- Les sorties JSON doivent être gérées comme une capacité distincte du raisonnement : une analyse peut nécessiter JSON strict sans raisonnement élevé, ou inversement.
- Le domaine doit rester indépendant des SDK et des noms d'options propriétaires.
- Les tests doivent valider la policy et la traduction provider, pas seulement le parsing final.

## Recommandation synthétique

La meilleure évolution est de remplacer progressivement l'abstraction « une méthode métier par provider » par une abstraction « opération IA + policy + client générique ». Cette approche rendra possible l'usage de n'importe quel provider avec n'importe quel modèle, tout en exprimant finement les besoins par fonctionnalité : raisonnement nul pour les interactions rapides, raisonnement moyen/élevé pour les analyses profondes, JSON strict pour les métadonnées, streaming pour les usages interactifs.
