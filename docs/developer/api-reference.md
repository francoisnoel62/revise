# Référence des actions fournisseurs et publication

État vérifié le 13 août 2026. Cette référence couvre les deux surfaces dont elle porte le nom. Les autres actions sont dans `src/app/actions/` et les routes HTTP dans `src/app/api/`.

## Convention commune

Les fonctions ci-dessous sont des **Server Actions Next.js**, pas une API HTTP REST. Elles renvoient :

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; redirect?: string };
```

Une action qui exige une session renvoie en cas d'absence d'authentification une erreur avec `redirect: '/auth/signin'`. Les exceptions sont normalisées par `withErrorHandling` ; ne pas leur attribuer un statut HTTP qui n'est pas exposé par ce contrat.

## Fournisseurs IA

Implémentation : `src/app/actions/provider-actions.ts`.

```ts
type ProviderType = 'openai' | 'anthropic' | 'google';

interface SafeProvider {
  id: string;
  name: string;
  type: ProviderType;
  maskedApiKey: string;
  model: string;
  isValid: boolean;
  lastTested?: string;
  createdAt: string;
  updatedAt: string;
}
```

| Action | Signature | Effet |
| --- | --- | --- |
| Créer | `createProviderAction({ name, type, apiKey, model }, markAsValid?)` | Crée la configuration. `markAsValid` demande un test lors de la création. |
| Lister | `listProvidersAction()` | Retourne les fournisseurs du compte sous forme de `SafeProvider`. |
| Modifier | `updateProviderAction(providerId, { name?, apiKey?, model? }, markAsValid?)` | Modifie la configuration ; un nouveau `apiKey` est chiffré avant stockage. |
| Supprimer | `deleteProviderAction(providerId)` | Refuse la suppression si un projet utilise encore le fournisseur. |
| Tester | `testProviderConnectionAction({ type, apiKey, model })` | Retourne `{ valid, message }`; succès : `Connection successful`. |
| Valider enregistré | `validateProviderAction(providerId)` | Teste un fournisseur existant et met à jour `isValid`/`lastTested`. |

Les tests de connexion et validations sont limités à une tentative par utilisateur toutes les cinq secondes. Les clés ne sont jamais sérialisées en clair : l'interface reçoit uniquement `maskedApiKey`.

Exemple :

```ts
const result = await createProviderAction(
  { name: 'Mon fournisseur', type: 'openai', apiKey: '…', model: 'nom-du-modele' },
  true,
);

if (result.success) {
  console.log(result.data.isValid, result.data.maskedApiKey);
}
```

## Publication et lecture publique

Implémentation : `src/app/actions/publish-actions.ts`.

```ts
interface PublishResult {
  shareUrl: string;
  isPublished: boolean;
  publishedAt: string | null;
  publishedChapterIds: string[] | null;
}

interface PublicChapter {
  id: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
}

interface PublicProject {
  id: string;
  title: string;
  chapters: PublicChapter[];
  publishedAt: string | null;
  coverImageUrl?: string;
}
```

| Action | Signature | Effet |
| --- | --- | --- |
| Publier | `publishProjectAction(projectId, chapterIds?)` | Publie tous les chapitres ou la sélection et retourne `PublishResult`. |
| Dépublier | `unpublishProjectAction(projectId)` | Coupe la lecture publique et retourne `{ isPublished }`. |
| Charger publiquement | `loadPublishedProjectAction(projectId, shareToken)` | Ne requiert pas de session et retourne le contenu public sérialisé. |
| État | `getPublishStatusAction(projectId)` | Requiert une session et retourne publication, URL, date et identifiants des chapitres publiés. |

Le jeton de partage sert à l'autorisation de lecture mais n'est pas exposé dans `PublicProject`. Le contenu retourné est le sous-ensemble de chapitres choisi à la publication.

## Dépendances et sécurité

Les actions utilisent les ports obtenus par `src/app/actions/utils.ts`. L'infrastructure chiffre les clés API avec AES-256-GCM avant leur persistance ; cette opération ne relève pas des cas d'usage de création ou mise à jour eux-mêmes.

La référence des composants et parcours consommant ces actions se trouve dans [`src/app/README.md`](../../src/app/README.md). Les tests présents près de `provider-actions.ts` et `publish-actions.ts` sont la meilleure source pour les erreurs métier précises et les comportements limite.
