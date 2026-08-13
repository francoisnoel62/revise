# Couche domaine

État vérifié le 13 août 2026. Cette couche contient les règles métier, entités, value objects et ports ; elle ne dépend pas de Next.js, MongoDB, React ni d'un fournisseur IA concret.

## Noyau métier

| Élément | Responsabilité |
| --- | --- |
| `Project` | Agrégat de manuscrit : propriétaire, chapitres, publication, fournisseur IA et ordre narratif. |
| `Chapter` | Chapitre TipTap, titre, ordre et métadonnées de comptage. Les nouveaux chapitres reçoivent un H1 sémantique `titre-de-chapitre`. |
| `ProjectSettings` | Réglages éditoriaux, couverture, collaborateurs, préférences d'autocomplétion, dictionnaires, règles de grammaire, publication et annexes liées. |
| `Provider` | Configuration utilisateur d'un fournisseur IA : type OpenAI/Anthropic/Google, modèle, clé et état du dernier test. Le chiffrement de la clé appartient à l'infrastructure. |
| `ProjectMetadata` | Document de métadonnées, son hash, ses données structurées et sa provenance ; une édition de l'auteur prévaut sur la donnée générée. |
| `Character` et `CharacterConversation` | Fiche de personnage et conversations ordonnées avec sa persona. |
| `CanonFact` | Fait narratif temporel, source `derived` ou `author`, classé objectif/connaissance/croyance/croyance sur autrui/relation. |
| `CorrectionHistory` et `Snapshot` | Respectivement trace d'une réécriture IA et version immuable d'un projet. |
| `ProjectTask`, `WritingGoal`, `WritingQuota`, `WordCountSnapshot` | Pilotage de l'écriture et métriques de progression. |
| `AIUsageRecord` et `AIExchange` | Métadonnées de coût/usage et, sur opt-in, contenu d'un échange IA avec durée d'expiration. |
| `CustomAnnex` et `BookPreviewCacheEntry` | Annexes de publication et métriques/cache du PDF de livre entier. |

Les entités et leurs fabriques restent la référence précise des champs, validations et erreurs. Éviter de dupliquer ici des signatures exhaustives qui vieillissent plus vite que le code.

## Contenu sémantique et publication

Le contenu TipTap emploie les rôles `corps`, `titre-de-chapitre`, `sous-titre`, `citation`, `epigraphe` et `separateur-de-scene`. Les profils de publication disponibles sont `kdp-6x9`, `a5` et `passerelle`.

- KDP 6×9 et A5 servent au rendu PDF paginé.
- Passerelle porte des surcharges de police, taille et alignement séparées du contenu sémantique ; elles ne doivent pas contaminer un export imprimable.
- Les `LevelStyleSet`, préférences de sommaire, notes de fin et annexes constituent la configuration de rendu, pas le manuscrit lui-même.

`ContentDemigrator` existe mais n'est raccordé à aucun flux produit ou script et perd de la présentation : il ne représente pas une migration inverse sûre.

## Correction linguistique et analyse

L'orthographe, la grammaire et l'analyse IA sont trois domaines distincts :

- `TextIssue`, `GrammarError`, `GrammarRuleProfile`, `PersonalDictionaryEntry` et `IgnoredGrammarIssue` portent la correction locale ;
- `AnalysisCategory` vaut exclusivement `repetition` ou `style` ;
- `StyleRigor` vaut `permissive`, `moderate` ou `strict` ;
- `ChapterAnalysis` représente un résultat d'analyse IA en mémoire, sans dépôt dédié.

Le dictionnaire personnel peut décrire la nature, le genre et le pluriel d'un mot ; ces informations permettent au compilateur de produire les flexions utilisées par la grammaire. Une entrée simple reste valable pour l'orthographe.

## Ports

Les contrats vivent dans `src/domain/interfaces/`. Les principaux groupes sont :

- persistance : projets, paramètres, fournisseurs, métadonnées, personnages, canon, tâches, objectifs, quotas, instantanés, usage, échanges et blog ;
- IA : `LLMProvider`, `LLMProviderFactory`, `PromptRepository`, `PricingClient` ;
- documents : `DocumentParser`, `FolderParser`, `DocumentExporter`, `BlobStorage` ;
- langue : `SpellChecker`, `GrammarChecker`, `GrammarDictionaryCompiler`, `Thesaurus`, `Morphology` ;
- identité et sécurité : `AuthProvider`, `EmailService`, `CaptchaVerifier`, `RateLimiter`, générateurs d'identifiants/tokens.

Un port exprime le contrat dont dépend le domaine ou l'application. Une classe MongoDB, Auth.js, Paged.js, nspell ou Grammalecte relève de l'infrastructure, même lorsqu'elle porte un nom très proche.

## Règles de contribution

- Préserver l'immuabilité observable des entités et value objects.
- Ajouter un invariant métier au domaine avec son test avant de le faire respecter dans une action ou un composant.
- Ne pas faire porter à `ChapterAnalysis` de l'orthographe ou de la grammaire : ces vérifications sont locales et passent par leurs propres contrats.
- Lorsqu'un nouveau stockage est nécessaire, définir ou faire évoluer le port avant l'adaptateur MongoDB.
- Vérifier les exportations de `src/domain/index.ts` seulement comme commodité ; les fichiers de domaine sont la référence complète.
