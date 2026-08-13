# Couche interface

État vérifié le 13 août 2026. `src/app/` contient les pages App Router, les Server Actions et les routes HTTP ; `src/components/` porte l'interface React ; `src/hooks/` coordonne les interactions client.

## Parcours et pages

| Chemin | Responsabilité |
| --- | --- |
| `/` | Accueil et formulaire de contact. |
| `/dashboard` | Création, import et liste des projets ; invitation et dialogue de fournisseurs. |
| `/editor?project=…` | Éditeur TipTap du manuscrit. |
| `/project/[projectId]/cockpit/*` | Cockpit : vue d'ensemble, objectifs, tâches, recherches, annexes, personnages, canon, réglages, usage et métadonnées. |
| `/project/[projectId]/metadata/*` | Deuxième arbre actif de métadonnées, sur les mêmes actions que le cockpit. |
| `/book-preview?project=…` | Aperçu PDF paginé du livre entier pour KDP 6×9 et A5. |
| `/read/[projectId]/[token]` | Lecteur public d'un projet publié. |
| `/settings`, `/historique-ia` | Compte (export/suppression) et journal IA de l'utilisateur. |
| `/auth/*`, `/blog`, `/guide/*`, pages légales | Authentification, contenu public et documentation utilisateur. |

Les deux routes de métadonnées sont actuellement actives. Ne pas supposer qu'une route est morte simplement parce qu'une autre UI semble plus récente ; toute consolidation devra être une décision de produit séparée.

## Éditeur

`editor/page.tsx` coordonne :

- `TextEditor`, barre de formatage, navigation de chapitres, recherche/remplacement et sauvegarde ;
- autocomplétion SSE, réécriture, génération de chapitre, thésaurus, fiches et chat de personnages ;
- orthographe, grammaire, historique de corrections, instantanés et analyse de chapitre ;
- publication, notes de fin, sélection de profil, styles de niveaux et aperçu de publication.

`TextEditor` utilise `TextIssueExtension` et `TextIssuePalette` pour afficher orthographe et grammaire. Les anciens noms `SpellCheckExtension` et `SpellCheckPalette` ne correspondent pas au chemin actif. L'éditeur n'est pas une page A4 paginée : le rendu de publication est un aperçu séparé.

## Server Actions

Les fichiers de `src/app/actions/` constituent les adaptateurs serveur de la plupart des fonctionnalités. Ils authentifient l'auteur, obtiennent les ports via `utils.ts`, instancient les cas d'usage et renvoient généralement :

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; redirect?: string };
```

Les familles actives couvrent : projets et chapitres, import/export, publication, fournisseurs, métadonnées, personnages, canon, correction/orthographe/grammaire, thésaurus, génération, snapshots, objectifs/quotas/tâches, recherches/annexes/réglages, blog/contact, comptes, tarifs et usage IA.

`utils.ts` est l'adaptateur de composition commun. Les appels IA qui doivent être comptabilisés y obtiennent un `TrackedLLMProvider` ; un fournisseur doit être configuré et valide pour le projet. Il n'y a pas de repli de production sur une clé `OPENAI_*` d'environnement.

## Routes HTTP

| Route | Rôle |
| --- | --- |
| `api/auth/[...nextauth]` | Handlers Auth.js. |
| `api/completion/stream` | Flux SSE d'autocomplétion. |
| `api/completion/telemetry` et `telemetry/stats` | Événements et agrégats d'autocomplétion. |
| `api/character-chat/stream` | Flux SSE de chat personnage. |
| `api/approve` | Approbation de compte. |
| `api/book-preview/pdf` | Lecture du PDF mis en cache. |
| `api/cron/sync-pricing` | Synchronisation planifiée des tarifs. |

`editor/paged-spike` et `api/paged-spike/export` sont une expérimentation explicitement exclue de l'UX de production.

## Principes d'interface

- Un composant ne choisit pas directement un adaptateur MongoDB ou un SDK IA.
- Une action peut contenir l'adaptation propre à l'interface ; `contact-actions.ts`, par exemple, persiste le formulaire sans cas d'usage dédié.
- Ne pas exporter ni documenter les composants non reliés (`DocumentControls`, `RewriteButton`, `ProposalsPanel`) comme s'ils formaient l'expérience produit.
- Pour modifier un flux IA, vérifier séparément les actions classiques et les routes SSE : elles n'assemblent pas toujours le même contexte.
