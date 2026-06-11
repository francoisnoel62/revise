# Journal de transparence IA (`AIExchange`)

## L'idée en une phrase

Donner à l'auteur un accès clair, **opération par opération**, à exactement **ce qui a
été envoyé à l'IA et ce qu'elle a répondu** — pas juste des statistiques de
consommation, mais le contenu réel de chaque échange.

## Pourquoi

1. **Incarnation d'un principe fondateur.** `philosophie.md` dit « l'IA propose,
   l'auteur décide ». On ne peut décider en connaissance de cause sans voir ce que
   l'IA a reçu et renvoyé. Le journal rend ce principe tangible.
2. **Différenciateur face à LocalProse.** Là où LocalProse mise sur « rien ne quitte
   le disque », Revise prend l'angle complémentaire : la **transparence radicale**.
3. **Utilité concrète.** Débogage pour l'auteur (« pourquoi l'IA m'a-t-elle suggéré
   ça ? ») et complément naturel du tableau de bord de coût.

## Tension assumée et garde-fous

Stocker le contenu va à l'encontre du minimalisme privacy d'origine (`AIUsageRecord`
ne stocke que des métadonnées). On la neutralise par :

- **Opt-in, désactivé par défaut** (`User.aiExchangeLoggingEnabled`).
- **Chiffrement au repos** des trois champs de contenu (`FieldEncryption`, AES-256-GCM).
- **Rétention configurable + purge automatique** via un index TTL MongoDB sur `expiresAt`.
- **Intégration RGPD** : le contenu est inclus dans l'export (Art. 20) et supprimé à
  la suppression de compte (Art. 17) et via un bouton « tout effacer ».
- **Plafond + troncature** : chaque champ est tronqué à 50 Ko avant chiffrement, pour
  que les opérations d'analyse (qui envoient le manuscrit entier) ne fassent pas
  exploser la base.

## Modèle de données

Entité/collection `AIExchange` **distincte** d'`AIUsageRecord`, pour isoler le contenu
volumineux et permettre une rétention/purge indépendante.

| Champ | Notes |
|---|---|
| `id`, `userId`, `projectId` | isolation multi-tenant par `ownerId` |
| `usageRecordId` | lien vers l'`AIUsageRecord` correspondant |
| `operation`, `provider`, `model` | dénormalisés pour l'affichage/filtre |
| `systemPrompt`, `input`, `output` | **chiffrés** (contenu) |
| `inputTokens`, `outputTokens`, `cachedInputTokens`, `costEur`, `durationMs` | snapshot de métriques dénormalisé (affichage sans jointure) |
| `createdAt`, `expiresAt` | `expiresAt` pilote la purge TTL |

Collection : `aiExchanges`. Index : `{userId, createdAt}`, `{userId, projectId, createdAt}`,
`{userId, operation}`, et l'index TTL `{expiresAt}` (`expireAfterSeconds: 0`).

Les filtres, le tri et la recherche portent **uniquement sur les métadonnées** (en
clair). Le contenu chiffré n'est déchiffré qu'à l'ouverture d'une ligne — `findByOwner`
renvoie des résumés sans contenu, `findById` déchiffre.

## Capture (modèle « pull », cohérent avec le suivi des tokens)

Les prompts sont assemblés *dans* chaque provider, donc on capture au niveau provider,
exactement comme `getLastTokenUsage()` :

```ts
getLastExchange(): { systemPrompt: string; input: string; output: string } | null;
```

`TrackedLLMProvider`, après un appel réussi, tire `getLastExchange()`, tronque,
**chiffre** et persiste via `AIExchangeRepository` — uniquement si l'utilisateur a
activé l'option. La même réserve de parallélisme que pour les tokens s'applique : un
champ `lastExchange` partagé pourrait être écrasé par des appels concurrents, ce qui
est neutralisé par une **instance de `TrackedLLMProvider` par requête** (voir
`getTrackedLLMProviderForProject`). La capture n'a lieu que sur succès, donc un appel
échoué ne journalise jamais un contenu obsolète.

## Chiffrement

`FieldEncryption` (AES-256-GCM) dérive une clé de 32 octets depuis `ENCRYPTION_KEY`
(déjà utilisé pour le chiffrement des clés API) via PBKDF2, avec un **sel distinct**
(`revise-exchange-salt`) pour la séparation de domaine. Aucune nouvelle variable
d'environnement n'est requise : là où le chiffrement des fournisseurs fonctionne, le
journal fonctionne. Format stocké : `base64(iv):base64(authTag):base64(ciphertext)`.

## Interface

- **Emplacement** : route authentifiée par utilisateur `/historique-ia`, filtrée par
  `ownerId` (chaque auteur voit ses propres échanges). Lien depuis les paramètres.
- **Vue table** : une ligne par opération — Quand / Action (en clair) / Projet /
  Modèle / Coût. Filtres par projet et par opération.
- **Vue détail** (au clic, langage clair) :
  1. « Ce que vous avez envoyé » → l'`input` transmis.
  2. « Ce que l'IA a répondu » → l'`output` brut.
  - Encart discret : modèle, tokens, coût, durée.
  - Bouton « Voir le détail technique » → révèle la **consigne système brute**
    (`systemPrompt`). Conformément à la décision produit, on montre le prompt brut, sans
    résumé reformulé.

## Couverture par fournisseur

La capture est implémentée pour les **trois fournisseurs** via un point d'entrée privé
unique par provider, qui capture uniformément `systemPrompt`/`input`/`output` :

- **Anthropic** : `createMessage` (le fournisseur par défaut ; modèle des maquettes Opus 4.8).
- **OpenAI** : `createChatCompletion` (11 opérations non-streaming routées par ce point).
- **Google** : `generateContentTracked` (idem).

Le **streaming** est également couvert : `generateCompletionStream` (autocomplétion) et
`chatStream` (chat personnage) accumulent la sortie et fixent `lastExchange` en fin de
flux ; `TrackedLLMProvider` appelle `captureWrappedExchange()` après ces flux pour
persister l'échange.

`getLastExchange()` reste optionnel sur l'interface `LLMProvider` : un fournisseur qui ne
le capture pas dégrade proprement (le suivi tokens/coût continue, sans contenu).

## Fichiers clés

- Domaine : `src/domain/entities/AIExchange.ts`, `src/domain/interfaces/AIExchangeRepository.ts`
- Chiffrement : `src/infrastructure/security/FieldEncryption.ts`
- Persistance : `src/infrastructure/persistence/MongoDBExchangeRepository.ts`, `ai-exchange-serializer.ts`
- Capture : `src/infrastructure/ai/AnthropicProvider.ts` (`getLastExchange`), `TrackedLLMProvider.ts`, `exchange-truncation.ts`
- Actions : `src/app/actions/exchange-actions.ts` (+ intégration RGPD dans `user-actions.ts` et `auth-actions.ts`)
- UI : `src/app/historique-ia/page.tsx`, `src/components/transparency/AIExchangeLedger.tsx`, `src/components/settings/AIExchangeLoggingCard.tsx`
