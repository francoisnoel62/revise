# Plan : capturer les tokens d'usage IA (et afficher les bonnes métriques)

> **✅ IMPLÉMENTÉ sur `origin/main`** (PR séparée, juin 2026). Ce document reste comme **référence technique** (champs SDK, design « pull », métriques supplémentaires). La branche `claude/ai-app-monetization-4qtag` ne contient pas encore ce correctif — il sera intégré lors du prochain merge de `main`.

> Contexte issu de l'étude de monétisation (`docs/monetisation.md`). Ce document est le plan d'implémentation du correctif de mesure des tokens, prérequis à toute facturation au token/crédit.

## Le problème ✅ résolu sur `main`

La structure de metering existait (schéma `AIUsageRecord`, agrégation MongoDB, UI cockpit), **mais la valeur des tokens n'était jamais capturée** :

- `TrackedLLMProvider.setTokenCounts()` n'était **jamais appelé en production** (uniquement défini + testé).
- **Aucun provider** (`AnthropicProvider`, `OpenAIProvider`, `GoogleProvider`) ne lisait l'`usage` de sa réponse SDK.
- Donc chaque `AIUsageRecord` était écrit avec `inputTokens: null, outputTokens: null`.
- L'agrégation neutralisait les `null` (`$ifNull → 0`, `MongoDBUsageRepository.ts:114-115,151-152,229-230`).
- Le cockpit (`UsageStatsCard.tsx:165,180-182`) affichait **0 token**.

**→ Corrigé sur `origin/main`** : les trois providers exposent `getLastTokenUsage()`, le décorateur tire la valeur après chaque appel, les vrais tokens sont persistés et affichés.

## Champs `usage` par provider (vérifiés, à date)

| Provider | Tokens entrée / sortie | Cache (économies) | Raisonnement / thinking | Streaming |
|---|---|---|---|---|
| **Anthropic** (`@anthropic-ai/sdk`) | `message.usage.input_tokens` / `output_tokens` | `usage.cache_read_input_tokens`, `usage.cache_creation_input_tokens` | compté **dans** `output_tokens` | `message_start` (entrée) + `message_delta.usage` (sortie cumulée) ; ou `stream.finalMessage().usage` |
| **OpenAI** (`openai` v6) | `usage.prompt_tokens` / `completion_tokens` (+ `total_tokens`) | `usage.prompt_tokens_details.cached_tokens` | `usage.completion_tokens_details.reasoning_tokens` | requiert `stream_options: { include_usage: true }` → `usage` dans le **dernier chunk** |
| **Google** (`@google/genai`) | `usageMetadata.promptTokenCount` / `candidatesTokenCount` (+ `totalTokenCount`) | `usageMetadata.cachedContentTokenCount` | `usageMetadata.thoughtsTokenCount` | `usageMetadata` **uniquement sur le dernier chunk** |

**Pièges à gérer :**
- **Google** : via l'API Gemini, `candidatesTokenCount` **inclut** les thinking tokens (pas sur Vertex AI) ; `thoughtsTokenCount` peut être **absent** sur `gemini-3-flash-preview` → traiter l'absence comme `0`/`null`.
- **OpenAI** : selon Chat Completions (`prompt/completion_tokens`) vs Responses API (`input/output_tokens` + `input_tokens_details`/`output_tokens_details`), les noms diffèrent — gérer le chemin réellement utilisé par `OpenAIProvider`.
- **Anthropic** : le streaming livre l'entrée tôt (`message_start`) et la sortie cumulée au fil des `message_delta` — prendre la valeur **finale**.

## Design retenu : modèle « pull » via l'interface (propre, sans course)

Les providers n'ont pas de référence vers le décorateur, donc on inverse le flux : chaque provider mémorise l'usage de son dernier appel et l'expose ; le décorateur **tire** la valeur juste après l'appel et la passe **en paramètre** à `recordUsage` (pas via un champ mutable partagé → évite les courses).

### Étape A — Interface `src/domain/interfaces/LLMProvider.ts`
```ts
export interface TokenUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  cachedInputTokens?: number | null;   // cache hit (économies)
  reasoningTokens?: number | null;     // thinking / reasoning
}
// dans LLMProvider :
getLastUsage(): TokenUsage | null;
```

### Étape B — Extraction dans chaque provider
Chaque provider : `private lastUsage: TokenUsage | null = null;`, rempli à chaque appel depuis la réponse SDK (champs du tableau ci-dessus, chemins non-stream **et** stream), exposé via `getLastUsage()`.

### Étape C — Décorateur `TrackedLLMProvider.ts`
- Dans `trackUsage`, après `await fn()` : `const usage = this.wrapped.getLastUsage();` → `recordUsage(operation, durationMs, usage)`.
- Idem dans `generateCompletionStream` : pull **après** la fin de la boucle `for await`.
- `recordUsage` lit les tokens **depuis son paramètre**.
- Implémenter `getLastUsage()` sur le décorateur en déléguant à `this.wrapped`.

### Étape D — Nettoyage
Supprimer `setTokenCounts()` + champs `lastInputTokens/lastOutputTokens` du décorateur ; adapter les 2 tests concernés.

## Autres informations intéressantes à afficher

Les trois providers exposent plus que les tokens bruts. Ces métriques ont une **double valeur** : transparence pour l'auteur, et fondation UI du futur modèle de crédits.

1. **Tokens servis par le cache + ratio de cache** (`cache_read_input_tokens` / `cached_tokens` / `cachedContentTokenCount`).
   → Valide *et rend visible* le levier prompt caching (§1 de l'étude). Argument de transparence : « X % de vos tokens d'entrée servis depuis le cache ». Un token caché coûte ≈ 0,1× le plein tarif.
2. **Tokens de raisonnement / thinking** (`reasoning_tokens` / `thoughtsTokenCount` ; chez Anthropic comptés dans `output_tokens`).
   → Rend visible le coût caché des opérations « qui réfléchissent ».
3. **Coût estimé en € (par opération / par jour / total)** = tokens × prix du modèle servi.
   → **La métrique la plus utile** : transforme le cockpit en vrai tableau de bord de coût et fait le **pont naturel vers les crédits**. (Barème de prix dans `docs/monetisation.md` §6.)
4. **Coût / tokens par modèle** — pertinent car on route par tâche (Opus 4.8 vs Haiku 4.5, §6) : montrer la répartition par modèle.

### Extensions de schéma suggérées (`AIUsageRecord` + serializer + agrégation)
- Ajouter colonnes `cachedInputTokens`, `reasoningTokens` (nullable) — l'agrégation suit le même motif `$ifNull → 0`.
- Le **coût** peut être **dérivé à l'affichage** (table prix par modèle côté UI/action) plutôt que stocké, pour rester juste si les prix changent.

## Tests (TDD — red d'abord, règle du repo)
1. **Providers** (×3, non-stream + stream) : « après un appel, `getLastUsage()` renvoie les tokens lus de la réponse » (mock SDK avec `usage`/`usageMetadata`).
2. **Décorateur** : « le record sauvegardé contient les tokens remontés par le provider » ; adapter le test existant qui supposait `null`.
3. **Repository** : l'agrégation somme désormais des valeurs réelles (cas déjà couvert, étendre aux nouvelles colonnes si ajoutées).

## Vérification end-to-end
Lancer l'app → faire une réécriture → page « Utilisation IA » du cockpit : le bloc **Tokens** et le détail **entrée/sortie** affichent des valeurs **non nulles** ; `DailyUsageChart` trace la courbe tokens.

## Réserve : parallélisme
Le modèle « pull » est correct pour des appels **séquentiels**. Si plusieurs opérations IA tournent **en parallèle sur la même instance de provider** (`Promise.all`), le champ `lastUsage` peut être écrasé. Parades : instancier un provider **par appel** (le factory le permet), ou faire **retourner** l'usage par chaque méthode (change les types de retour de `LLMProvider` — plus lourd). À vérifier : les analyses du cockpit semblent séquentielles (`synthesis` agrège les précédentes) → probablement non concerné.

## Effort estimé
**Petit et cerné** : 1 interface, 3 providers (2 chemins chacun), 1 décorateur, ~6-8 tests. Schéma DB de base, agrégation `$ifNull` et UI tokens sont **déjà prêts**. Les extensions (cache, raisonnement, coût €) sont incrémentales.

## Sources (champs `usage`, à date)
- Anthropic : doc API (`usage.input_tokens`/`output_tokens`/`cache_read_input_tokens`/`cache_creation_input_tokens`) — réf. skill `claude-api` (prompt-caching).
- OpenAI : https://platform.openai.com/docs/guides/prompt-caching · https://developers.openai.com/api/reference/ruby/resources/completions
- Google : https://ai.google.dev/gemini-api/docs/tokens · https://docs.cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1/GenerateContentResponse
