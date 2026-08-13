# Couche infrastructure

État vérifié le 13 août 2026. Cette couche fournit les implémentations concrètes des ports du domaine et les fabrique dans `src/infrastructure/config/providers.ts`.

## Composition de production

`providers.ts` est la racine de composition. Elle fournit des singletons ou fabriques pour :

- les dépôts MongoDB et le cache PDF de livre entier dans GridFS ;
- Auth.js, Resend lorsqu'il est configuré, et le stockage de couvertures Vercel Blob ;
- les fournisseurs OpenAI, Anthropic et Google choisis à partir d'un `Provider` utilisateur ;
- les parseurs DOCX/Markdown, l'import de dossier Markdown, les exporteurs DOCX et PDF ;
- nspell, Grammalecte, le dictionnaire personnel compilé et le thésaurus ;
- les clients de prix OpenRouter et les caches de rendu de publication.

La production persiste les projets dans MongoDB. Le dépôt en mémoire de projet sert aux tests. Le fichier `config/env.ts` centralise les variables d'environnement et expose `validateConfig()`, mais cette validation n'est pas appelée automatiquement par un chemin de production actuel.

## Persistance et sécurité

Les dépôts MongoDB appliquent le périmètre de propriétaire attendu par leurs ports. `MongoDBProviderRepository` chiffre les clés API avant stockage avec AES-256-GCM et une clé dérivée par PBKDF2 ; les actions ne retournent qu'une clé masquée.

Le journal détaillé d'échanges IA est distinct : `MongoDBExchangeRepository` chiffre ses champs de contenu avec `FieldEncryption`, également AES-256-GCM avec un domaine de dérivation séparé. L'enregistrement est facultatif. Si ce chiffrement n'est pas disponible, le suivi détaillé est ignoré sans empêcher l'appel IA.

Les couvertures sont placées dans Vercel Blob, dont les URL sont destinées à l'affichage public de l'image. Ne pas présenter ce stockage comme un coffre chiffré applicatif.

## IA et tarification

`OpenAIProvider`, `AnthropicProvider` et `GoogleProvider` implémentent le port `LLMProvider`. Le fournisseur est construit à partir de la configuration du compte, jamais comme valeur par défaut globale dans le flux produit.

`TrackedLLMProvider` ajoute les données d'usage et de coût estimé à l'appel. Les tarifs sont stockés dans MongoDB et peuvent être synchronisés via `OpenRouterPricingClient`. Ils aident à l'observabilité ; le relevé du fournisseur reste la source de facturation.

Les prompts runtime sont chargés depuis `docs/prompt/` par `FilePromptRepository`. Modifier un prompt dans ce dossier modifie le comportement ; ce ne sont pas de simples notes de conception.

## Documents et publication

| Besoin | Adaptateur actif |
| --- | --- |
| Import `.docx` | Parser basé sur Mammoth. |
| Import `.md` | Parser Markdown ; import de dossier par `MarkdownFolderParser`. |
| Export DOCX | `DocxExporter`, avec notes Word natives. |
| Export PDF | `PagedPdfExporter`, via Chromium/Paged.js. |
| Aperçu de livre entier | `BookPreviewCacheComputer` + `WholeBookHtmlAssembler`, cache MongoDB/GridFS. |

`PdfExporter` est un exporteur historique non sélectionné par la fabrique active. Il ne doit pas servir de point de départ à une évolution PDF. `TipTapContentService` est actif, mais est instancié directement par certaines actions de génération ; son getter historique dans la racine de composition n'est pas une indication de liveness.

## Correction locale

L'orthographe passe par `NspellSpellChecker` et le dictionnaire fr-FR. La grammaire et la ponctuation passent par `GrammalecteGrammarChecker`, emballé dans `@francoisnoel62/grammalecte` et exécuté côté serveur. Ces deux chemins ne consomment pas de jetons IA.

`GrammalecteDictionaryCompiler` compile les entrées déclarées du dictionnaire personnel. Le moteur Grammalecte est partagé par processus et mémorise de la morphologie ; l'adaptateur remplace le dictionnaire et vide ce cache dans la même section synchrone afin d'éviter qu'un projet voie le vocabulaire d'un autre.

Les corpus de régression vivent dans `src/infrastructure/grammar/fixtures/`. Toute modification de règle, d'adaptateur ou de profil par défaut doit les exécuter avec les tests Grammalecte.

## Opérations et points d'attention

- hCaptcha est optionnel selon `HCAPTCHA_SECRET_KEY` ; la limitation d'inscription est actuellement en mémoire de processus.
- La limitation de l'autocomplétion s'appuie sur un dépôt MongoDB partagé.
- Le PDF de livre entier est cacheable et peut requérir Chromium ; vérifier les contraintes de l'environnement de déploiement lors d'un changement de moteur.
- `getDocxParser()` et `getContentConverter()` sont des accesseurs historiques non utilisés. Distinguer ces fonctions des classes actives avant de supprimer ou documenter un élément.
