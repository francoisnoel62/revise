# Architecture de Revise

> État vérifié sur la base de code le 13 août 2026. Ce document décrit les chemins actifs ; l'historique des livraisons reste dans le [CHANGELOG](../CHANGELOG.md).

## Carte du dépôt

| Couche | Répertoire | Rôle |
| --- | --- | --- |
| Domaine | `src/domain/` | Entités, value objects et ports sans dépendance à Next.js ou MongoDB. |
| Application | `src/application/` | Cas d'usage, services de contexte, rendu de livre et migrations. |
| Infrastructure | `src/infrastructure/` | MongoDB, Auth.js, fournisseurs IA, exporteurs, chiffrement et moteurs linguistiques. |
| Adaptateurs techniques partagés | `src/adapters/` | Intégrations concrètes partagées par plusieurs couches externes, sans dépendance vers l'interface. |
| Interface | `src/app/`, `src/components/`, `src/hooks/` | Pages App Router, Server Actions, routes API, composants React et hooks. |

Les Server Actions sont l'entrée habituelle du produit. Les exceptions HTTP nécessaires sont les routes Auth.js, les flux SSE d'autocomplétion et de chat personnage, l'approbation, le PDF d'aperçu et le cron de tarification.

```text
Composant ou page
        ↓
Server Action / route API
        ↓
Cas d'usage ou service d'application
        ↓
Port du domaine
        ↓
Adaptateur d'infrastructure
        ↓
MongoDB, fournisseur IA, Paged.js, nspell, Grammalecte, Vercel Blob…
```

## Composition et dépendances

`src/infrastructure/config/providers.ts` est la racine de composition de production. Elle assemble les dépôts MongoDB, les fournisseurs OpenAI/Anthropic/Google configurés par l'utilisateur, les moteurs de correction, les exporteurs et les caches. Les fonctions de `src/app/actions/utils.ts` adaptent cette composition aux Server Actions, ajoutent l'authentification et enveloppent les appels IA suivis dans `TrackedLLMProvider`.

L'éditeur assemble séparément ses adaptateurs de rendu paginé dans `src/app/editor/paged-rendering.ts`. Les composants d'aperçu ne connaissent que les interfaces applicatives `PagedRenderer` et `TipTapToHtmlConverter`. Les extensions TipTap, concrètes mais partagées par l'éditeur et les conversions serveur, vivent dans `src/adapters/tiptap/`.

En production, le stockage applicatif est MongoDB. Les clés API sont chiffrées avant persistance ; l'éventuel journal détaillé des échanges IA est chiffré séparément. Les images de couverture utilisent Vercel Blob. Le remplacement du dépôt de projet par une implémentation en mémoire est réservé aux tests.

`src/application/index.ts` est un ancien barrel partiel : ce n'est pas un catalogue exhaustif des cas d'usage. Pour retrouver une opération, partir d'une Server Action ou d'une route active puis suivre ses imports.

## Domaine fonctionnel

Le cœur est l'agrégat `Project`, ses `Chapter` TipTap et `ProjectSettings`. Un projet porte notamment son propriétaire, son fournisseur IA, ses préférences éditoriales, son profil de publication et les paramètres de correction/autocomplétion.

Les groupes importants sont :

- manuscrit : projets, chapitres, import DOCX/Markdown, export, partage public ;
- accompagnement d'écriture : métadonnées, personnages, chat personnage, thésaurus, complétion, réécriture, génération de chapitre ;
- continuité : faits de canon avec validité temporelle et source `derived` ou `author` ;
- cockpit : recherches, annexes, tâches, objectifs, quotas, activité et usage IA ;
- historique : corrections, instantanés manuels/automatiques et aperçu de livre mis en cache ;
- publication : profils `kdp-6x9`, `a5` et `passerelle`, styles par niveau, sommaire, annexes et notes de fin.

Les sept types de métadonnées sont `narrative-analysis`, `stylistic-dna`, `characters`, `plot`, `worldbuilding`, `synthesis` et `chapter-summaries`. Ils sont des configurations de `GenerateMetadataUseCase<T>`, non sept classes spécialisées.

## Écriture, correction et analyse

`TextEditor` est l'éditeur TipTap actif. Il sauvegarde le contenu sémantique du chapitre et coordonne autocomplétion, recherches/remplacements, thésaurus, correction, historique et aperçu de publication.

### Deux familles de vérification distinctes

| Besoin | Chemin actif | Réseau / jetons IA |
| --- | --- | --- |
| Orthographe | `CheckSpellingUseCase` → `NspellSpellChecker` avec dictionnaire fr-FR | Aucun |
| Grammaire et ponctuation | `CheckChapterGrammarUseCase` → `GrammalecteGrammarChecker` | Aucun fournisseur IA |
| Style et répétitions | `AnalyzeChapterUseCase` → stratégies `style` et `repetition` | IA configurée pour le projet |

`AnalysisCategory` ne contient donc que `style` et `repetition`. `StyleRigor` vaut `permissive`, `moderate` ou `strict`. Un `ChapterAnalysis` est un résultat en mémoire : il n'existe pas de dépôt, de cache ni d'historique persistant d'analyse de chapitre.

La grammaire fonctionne bloc par bloc, convertit les positions de Grammalecte en positions ProseMirror et applique le profil de règles et le dictionnaire personnel du projet. Les remarques déclinées sont identifiées par famille de règle et texte signalé, pas par position. La palette unique `TextIssuePalette` et `TextIssueExtension` arbitre les recouvrements entre orthographe et grammaire ; l'orthographe est prioritaire sur une zone qui se chevauche.

Le dictionnaire personnel est compilé au moment de son écriture par `UpdatePersonalDictionaryUseCase`. Le correcteur reçoit l'automate déjà construit lors de la vérification. Cette séparation évite de reconstruire le dictionnaire à chaque chapitre et préserve l'isolation entre projets malgré le cache de morphologie du moteur.

## IA, contexte et traçabilité

Les fournisseurs actifs sont OpenAI, Anthropic et Google. Ils sont sélectionnés à partir de la configuration persistée du compte et du projet ; il n'y a pas de fournisseur OpenAI d'environnement utilisé comme repli de production.

Deux constructions de contexte coexistent :

- `AIContextBuilder` sert les opérations de génération, réécriture, suggestions et persona. Il applique la règle « l'édition de l'auteur l'emporte » aux métadonnées et peut intégrer des documents de recherche selon leur portée.
- la route SSE `src/app/api/completion/stream/route.ts` construit le contexte actif d'autocomplétion : texte autour du curseur, chapitres antérieurs et faits de canon pertinents. Les documents de recherche ne sont pas injectés dans ce flux.

`ManuscriptContextBuilder` transmet tous les chapitres antérieurs lorsque le manuscrit ne dépasse pas 40 000 mots ; au-delà, il garde les cinq derniers. Le contexte local autour du curseur et les directives d'intention/longueur/audace sont assemblés par `AutocompleteContextBuilder` et les services associés. Les cinq intentions sont `natural`, `shorter`, `tenser`, `more_concrete` et `dialogue`.

`GenerateCanonFactsUseCase` traite incrémentalement les chapitres non vides dont le hash a changé, préserve les faits manuels et les faits inchangés, puis met à jour l'état d'extraction. Il n'impose pas de cooldown. Les faits de canon injectés dans l'autocomplétion sont limités et filtrés par validité temporelle.

`TrackedLLMProvider` enregistre l'usage et le coût estimé. Le journal détaillé des échanges est facultatif : lorsqu'il est activé, le contenu est chiffré avec `FieldEncryption` avant stockage dans `MongoDBExchangeRepository`. Si le chiffrement ou le dépôt n'est pas disponible, l'opération IA reste exécutable sans journal détaillé.

## Publication et export

Le contenu du manuscrit reste sémantique. `PresentationOverrideService` isole les surcharges de police, taille et alignement du profil `passerelle` ; les profils imprimables les ignorent et les exportations les retirent.

- `DocxExporter` produit le DOCX et les notes de bas de page Word natives.
- `PagedPdfExporter` est l'exporteur PDF actif : Chromium et Paged.js rendent le livre à partir du contenu sémantique.
- `PdfExporter` est un ancien exporteur non sélectionné par la composition de production ; ne pas l'utiliser pour décrire la fonction PDF.

L'aperçu du livre entier passe par `BookPreviewCacheComputer`, `WholeBookHtmlAssembler` et le même sous-système de rendu paginé. Le PDF et ses métriques sont mis en cache dans GridFS, par projet, profil et propriétaire. L'empreinte comprend le contenu et l'ordre des chapitres, les liminaires/annexes, les styles de niveaux, les préférences de sommaire, les notes, l'option de lignes blanches et la révision du moteur. Le profil est une clé distincte du cache. `passerelle` ne propose pas cet aperçu paginé de livre entier.

`ContentMigrator` est utilisé pour moderniser le contenu ancien ; son inverse `ContentDemigrator` est un helper non relié à un flux produit ou script, et perd des informations de présentation. Il ne faut pas le présenter comme une restauration opérationnelle.

## Entrées de l'interface

### Pages produit

- `/` : page d'accueil et formulaire de contact ;
- `/dashboard` : création, import, liste des projets et accès au dialogue de fournisseurs ;
- `/editor?project=…` : édition ;
- `/project/[projectId]/cockpit/*` : cockpit (vue d'ensemble, objectifs, tâches, recherches, annexes, personnages, canon, réglages, usage IA et métadonnées) ;
- `/project/[projectId]/metadata/*` et `/project/[projectId]/cockpit/metadata/*` : les deux arbres actifs d'édition des mêmes métadonnées ;
- `/book-preview?project=…` : aperçu paginé du livre entier ;
- `/read/[projectId]/[token]` : lecture publique d'un projet publié ;
- `/settings`, `/historique-ia`, les pages d'authentification, blog, guide et pages légales.

### Routes API

- `api/auth/[...nextauth]` : Auth.js ;
- `api/completion/stream` et `api/completion/telemetry/*` : autocomplétion SSE et métriques ;
- `api/character-chat/stream` : chat personnage SSE ;
- `api/approve` : approbation de compte ;
- `api/book-preview/pdf` : diffusion du PDF mis en cache ;
- `api/cron/sync-pricing` : synchronisation de tarifs ;
- `editor/paged-spike` et `api/paged-spike/export` : expérimentation gardée hors UX de production.

Les Server Actions sont regroupées par capacité dans `src/app/actions/`. Elles ne suivent pas toutes strictement le même patron : par exemple `contact-actions.ts` persiste le message directement, sans `SubmitContactFormUseCase`.

## Migrations et code historique

- `useSemanticMigration` s'exécute au chargement d'un chapitre dans l'éditeur ; `scripts/migrate-semantic-content.ts` permet une exécution ponctuelle sur les projets existants.
- `ensureChapterTitleHeading` est employé lors de l'import et par `scripts/migrate-chapter-title-headings.ts`.
- `scripts/migrate-removed-publication-profiles.ts` convertit les anciens profils KDP supprimés vers `kdp-6x9`.
- `DocumentControls`, `RewriteButton`, `ProposalsPanel` et l'ancien `PdfExporter` ne sont pas des chemins produit actifs. Ne pas les citer comme fonctionnalités livrées.

## Tests et évolution documentaire

Les tests unitaires couvrent le domaine et l'application ; les tests d'intégration et E2E vérifient l'infrastructure et les parcours. Les corpus Grammalecte sont dans `src/infrastructure/grammar/fixtures/`. Les prompts exécutés sont des ressources runtime dans `docs/prompt/`.

`npm run architecture:check` vérifie les dépendances de production : le domaine et l'application restent indépendants des couches externes, l'infrastructure ne remonte pas vers les composants, et les composants, hooks, stores et utilitaires ne sélectionnent pas directement l'infrastructure. `src/app` est la couche de composition autorisée à assembler ces dépendances. Lancer ce contrôle avec les tests, le typage et le lint avant toute livraison.

Lors d'un changement de capacité, mettre à jour dans le même lot le guide utilisateur concerné, ce document, le README de la couche touchée et toute page légale qui décrit un flux de données. Les ADR restent historiques : compléter leur statut plutôt que de réécrire leur décision d'origine.
