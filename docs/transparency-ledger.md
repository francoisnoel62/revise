# Plan : Journal de transparence IA (table de données interactive)

> **✅ IMPLÉMENTÉ — PR [#96](https://github.com/francoisnoel62/revise/pull/96)** (« Add AI transparency ledger with encrypted exchange content capture »), branche `claude/grill-me-feature-idea-fvofas`. **Ouverte, basée sur `main`, pas encore mergée** (la branche `claude/ai-app-monetization-4qtag` ne la contient pas). Ce document reste comme **référence de conception** ; voir ci-dessous les **écarts entre le plan et l'implémentation livrée**.

> Issu de l'étude de monétisation (`docs/monetisation.md`) et lié au correctif de capture (`docs/fix-token-tracking.md`). Objectif : donner à l'auteur un accès clair, opération par opération, à **ce qui a été envoyé à l'IA et ce qui a été reçu**.

## Écarts plan → implémentation livrée (PR #96)

L'implémentation suit fidèlement le plan, avec quelques décisions affinées en cours de route :

| Sujet | Plan d'origine | Livré dans la PR #96 |
|---|---|---|
| **Activation** | « Activé par défaut » | **Opt-in (désactivé par défaut)** — `aiExchangeLoggingEnabled: false`. Choix plus prudent côté vie privée. |
| **Rétention** | Liée au **palier** (7/30/90 j) | **Réglage par utilisateur** (`aiExchangeRetentionDays`, 7–365 j, défaut 30). Pas encore branché sur les paliers de `monetisation.md` — le levier de monétisation reste à câbler. |
| **Chiffrement** | Réutiliser `crypto.ts` | **`FieldEncryption.ts` dédié** (AES-256-GCM, IV aléatoire par champ) + **troncature à 50 Ko/champ** (`exchange-truncation.ts`) — répond directement à la réserve de perf du plan. |
| **Emplacement** | Sous-page des paramètres | **Page dédiée `/historique-ia`** ; les paramètres hébergent la carte `AIExchangeLoggingCard` (toggle + rétention + purge). |
| **RGPD** | Suppression (art. 17) | Suppression à la suppression de compte (art. 17) **+ export des données** (art. 20, `user-actions.ts`). |
| **Métriques en table** | Métadonnées (modèle, coût…) | **Snapshot dénormalisé** sur `AIExchange` (`inputTokens`, `outputTokens`, `cachedInputTokens`, `costEur`, `durationMs`) → table et détail sans jointure ; `aiUsage` reste la source de vérité agrégée. |
| **Capture providers** | Les 3 providers | Anthropic d'abord, puis **OpenAI + Google** (+ streaming) ajoutés dans des commits suivants de la même PR. |

Fidèles au plan : entité `AIExchange` séparée d'`AIUsageRecord`, isolation par `ownerId`, **résumés métadonnées sans déchiffrement** (`findByOwner` → `AIExchangeSummary`) avec déchiffrement **uniquement au détail** (`findById`), index **TTL** sur `expiresAt`, modèle « pull » via `getLastExchange()`, vue table + détail.

> Le reste de ce document décrit le **plan d'origine** (conservé comme référence de conception).

## Pourquoi

- **Principe fondateur.** Incarnation littérale de la transparence et de « l'IA propose, **l'auteur décide** » (`philosophie.md`) : on ne peut pas vraiment décider sans voir ce que l'IA a reçu et renvoyé.
- **Différenciateur stratégique.** Là où LocalProse mise sur « rien ne quitte votre disque », Revise mise sur la **transparence radicale** — « voyez exactement ce qui est envoyé et reçu ». Angle de confiance complémentaire (voir le comparatif Revise/LocalProse).
- **Utilité concrète.** Débogage pour l'auteur (« pourquoi cette suggestion ? ») et complément du tableau de bord de coût.

## Le manque actuel

`AIUsageRecord` (`src/domain/entities/AIUsageRecord.ts`) ne stocke que des **métadonnées** : opération, provider, modèle, tokens, durée, date. Le serializer (`ai-usage-serializer.ts`) le confirme : **ni le prompt, ni le texte envoyé, ni la réponse de l'IA ne sont persistés**. Cette feature ajoute donc une **brique de capture + stockage de contenu**, distincte du correctif tokens.

## La fonctionnalité : « Journal de transparence IA »

**Emplacement** : paramètres utilisateur. Table **globale, inter-projets**, interactive (tri, filtres par projet / opération / date / modèle, recherche sur métadonnées).

### Vue table (lecture rapide) — une ligne par opération
| Quand | Action (en clair) | Projet | Modèle | Coût | |
|---|---|---|---|---|---|
| 8 juin, 14:32 | Réécriture d'un passage | *Mon roman* | Opus 4.8 | ~0,02 € | ▸ détail |

### Vue détail (au clic) — pensée pour un novice de l'IA
Trois blocs en **langage clair**, jargon masqué par défaut :
1. **« Ce que vous avez envoyé »** → votre extrait de texte + le contexte transmis (personnages, univers…).
2. **« Ce que Revise a demandé à l'IA »** → résumé lisible de la consigne (pas le prompt système brut).
3. **« Ce que l'IA a répondu »** → la sortie brute.

+ encart discret : modèle, tokens, coût, durée.
+ bouton **« Voir le détail technique »** → révèle le prompt système complet / le JSON (masqué par défaut).

## Modèle de données

Nouvelle entité/collection **`AIExchange`** (séparée d'`AIUsageRecord` pour isoler le contenu volumineux et permettre une rétention/purge indépendante) :

| Champ | Notes |
|---|---|
| `id`, `userId`, `projectId` | isolation multi-tenant par `ownerId` (règle du repo) |
| `usageRecordId` | lien vers l'`AIUsageRecord` correspondant |
| `operation`, `model`, `provider` | dénormalisés pour l'affichage/filtre |
| `systemPrompt` | **chiffré** — la consigne envoyée |
| `input` | **chiffré** — texte + contexte réellement transmis |
| `output` | **chiffré** — réponse brute de l'IA |
| `createdAt`, `expiresAt` | `expiresAt` pilote la purge (rétention) |

> Les filtres/tri/recherche portent sur les **métadonnées** (en clair). La recherche plein-texte sur le contenu chiffré est volontairement hors scope (le contenu est déchiffré seulement à l'ouverture d'une ligne).

## Capture (cohérente avec le correctif tokens)

On étend le modèle « pull » de `docs/fix-token-tracking.md` : au point provider (qui assemble le prompt final ET reçoit la réponse brute), exposer en plus de `getLastUsage()` :
```ts
getLastExchange(): { systemPrompt: string; input: string; output: string } | null;
```
`TrackedLLMProvider` tire cette valeur après l'appel et la persiste via un `AIExchangeRepository` (chiffrement au passage). Même réserve de **parallélisme** que pour les tokens (cf. le doc dédié).

## Rétention & monétisation

La durée de conservation devient un **levier de différenciation par fonctionnalité** (pas par qualité IA — cohérent avec `docs/monetisation.md` §6) :

| Palier | Rétention du journal |
|---|---|
| **Découverte** (gratuit) | **7 jours** |
| **Auteur** | 30 jours |
| **Pro** | 90 jours (ou 1 an) |
| Option à la carte | extension de rétention payante |

- **Purge automatique** : job qui supprime les `AIExchange` dont `expiresAt` est dépassé (index TTL MongoDB sur `expiresAt` = implémentation la plus simple).
- `expiresAt` calculé à la création selon le palier de l'utilisateur au moment de l'appel.

## Vie privée, RGPD & sécurité

- **Activé par défaut** (argument de confiance), avec **interrupteur** dans les paramètres pour le **couper** (et purger l'historique).
- **Chiffré au repos** via `src/infrastructure/encryption/crypto.ts` (AES-256-GCM, déjà utilisé pour les clés API). Note : contenu plus volumineux que les clés → valider les perfs.
- **Suppression** : l'auteur peut supprimer **une ligne** ou **tout le journal** ; inclus dans la **suppression de compte** (`DeleteUserAccountUseCase` — étendre, comme il le fait déjà pour les usages, RGPD art. 17).
- **Jamais utilisé pour l'entraînement** (principe `philosophie.md`).

## Tests (TDD — red d'abord, règle du repo)
1. **Entité `AIExchange`** : validation, invariants.
2. **Repository** : `save` chiffre, `findByUser`/`findByProject` filtrent par `ownerId`, `deleteById`/`deleteAllByOwner`, purge par `expiresAt`.
3. **Capture** : provider expose `getLastExchange()` ; `TrackedLLMProvider` persiste l'échange (mock repo).
4. **Action/UI** : l'action renvoie les lignes déchiffrées du seul propriétaire ; respect du paramètre d'activation.
5. **Rétention** : `expiresAt` calculé selon le palier ; purge supprime les expirés.

## Vérification end-to-end
Faire une réécriture → paramètres → « Journal de transparence IA » : la ligne apparaît ; au clic, les 3 blocs (envoyé / consigne / réponse) sont lisibles ; le détail technique est masqué par défaut ; couper l'option purge l'historique ; une ligne hors rétention disparaît après purge.

## Effort estimé
Plus gros que le correctif tokens (persistance de contenu + UI paramètres + RGPD + rétention), mais bien cadré : 1 entité + repo (+ chiffrement), extension capture provider/décorateur, 1 action + 1 page paramètres (patron : `usage-actions.ts` + composants cockpit), 1 job de purge (index TTL), extension suppression de compte. Fort impact produit/confiance.

## Liens
- Capture des tokens (prérequis technique partagé) : `docs/fix-token-tracking.md`
- Modèle de monétisation et paliers (rétention payante) : `docs/monetisation.md` (§3, §6)
