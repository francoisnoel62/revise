# Nouveaux use cases et parcours E2E

> Inventaire prévisionnel. Rien n'est implémenté. Chaque entrée est rattachée à son
> chantier ; la liste sert de contrôle de couverture, pas de spécification détaillée —
> celle-ci vit dans le fichier de chantier.

Conventions du dépôt respectées : les use cases vivent dans
`src/application/use-cases/` et se nomment `VerbeNomUseCase`. Les tests E2E vivent dans
`e2e/<domaine>/<sujet>.spec.ts`.

## Use cases par chantier

### 03 — `ProjectKind`

| Use case | Rôle |
|---|---|
| `CreateProjectUseCase` *(modifié)* | le type devient une entrée requise |
| `LoadProjectUseCase` *(modifié)* | expose le type ; repli sur `fiction` |

Les use cases de fiction — `GenerateCanonFactsUseCase`, `ChatWithCharacterUseCase`,
`AnalyzeChapterUseCase`, `GenerateCharacterSheetUseCase` — reçoivent une garde de type
et refusent l'exécution sur un projet non-fiction.

### 04 — `Edition`

| Use case | Rôle |
|---|---|
| `CreateEditionUseCase` | créer une édition d'un manuscrit |
| `ListEditionsUseCase` | lister les éditions d'un projet |
| `LoadEditionUseCase` | charger une édition et ses réglages |
| `UpdateEditionUseCase` | modifier format, ISBN, sommaire, typographie |
| `DeleteEditionUseCase` | supprimer une édition, jamais la dernière |
| `UpdateProjectSettingsUseCase` *(amputé)* | perd les champs migrés |

### 05 — Images

| Use case | Rôle |
|---|---|
| `UploadManuscriptImageUseCase` | stocker et référencer une image |
| `DeleteManuscriptImageUseCase` | retirer l'image et son blob |
| `CheckImageResolutionUseCase` | DPI effectif à la taille imprimée |

### 06 — EPUB

| Use case | Rôle |
|---|---|
| `ExportEpubUseCase` | produire le master |
| `ValidateEpubUseCase` | passer EPUBCheck et rendre le rapport |

### 07 — Dos et couverture

| Use case | Rôle |
|---|---|
| `CalculateSpineWidthUseCase` | largeur du dos depuis la pagination et le papier |
| `GenerateCoverTemplateUseCase` | gabarit PNG et PDF |

### 08 — Prévalidation

| Use case | Rôle |
|---|---|
| `PrevalidateEditionUseCase` | rapport conforme / non conforme / non vérifié |

### 09 — Fiche produit

| Use case | Rôle |
|---|---|
| `CreateListingUseCase` | fiche canonique d'une édition |
| `UpdateListingUseCase` | édition manuelle, qui l'emporte sur la génération |
| `GenerateListingProposalsUseCase` | propositions de description, mots-clés, catégories |
| `ResolvePlatformListingUseCase` | dériver le listing d'une plateforme |

### 10 — Abonnement et crédits

| Use case | Rôle |
|---|---|
| `GetCreditBalanceUseCase` | solde courant |
| `DebitCreditsUseCase` | débit idempotent avant appel IA |
| `CreditPurchaseUseCase` | créditer après paiement confirmé |
| `HandleStripeWebhookUseCase` | traitement idempotent des événements |
| `GrantFreeTierUseCase` | palier gratuit, une seule fois par compte |

### 11 — Consistency Checker

| Use case | Rôle |
|---|---|
| `ExtractKnowledgeFactsUseCase` | extraction incrémentale non-fiction |
| `DetectInconsistenciesUseCase` | contradictions entre affirmations |

### 12 — Low content

| Use case | Rôle |
|---|---|
| `CreateLowContentBookUseCase` | gabarit, pagination, format |
| `GenerateLowContentInteriorUseCase` | produire le HTML de l'intérieur |
| `ListPageTemplatesUseCase` | gabarits disponibles |

### 13 — Tableaux

| Use case | Rôle |
|---|---|
| `GenerateTableUseCase` | propositions de tableau depuis du texte |

### 14 — Génération d'images

| Use case | Rôle |
|---|---|
| `GenerateImageUseCase` | génération, débit d'une unité image, avertissement |

## Parcours E2E

Chaque parcours est un fichier. **Aucun mock** : c'est la règle du dépôt.

| Fichier | Parcours |
|---|---|
| `e2e/editor/toc-parity.spec.ts` | le sommaire de l'aperçu et celui du PDF exporté coïncident *(01)* |
| `e2e/project/create-by-kind.spec.ts` | créer un projet de chaque type ; le type n'est plus modifiable ensuite *(03)* |
| `e2e/project/non-fiction-hides-story.spec.ts` | un projet non-fiction n'expose aucune fonctionnalité de fiction *(03)* |
| `e2e/project/fiction-unchanged.spec.ts` | **non-régression** : un projet fiction se comporte comme avant *(03)* |
| `e2e/editions/multiple-editions.spec.ts` | deux éditions d'un manuscrit, formats et ISBN distincts, manuscrit unique *(04)* |
| `e2e/editions/edition-title-override.spec.ts` | une édition surcharge le titre sans modifier le projet *(04)* |
| `e2e/editor/images.spec.ts` | insérer une image avec légende, la voir dans l'aperçu paginé *(05)* |
| `e2e/editor/image-page-break.spec.ts` | une figure n'est pas coupée par un saut de page *(05)* |
| `e2e/export/epub-validity.spec.ts` | l'EPUB exporté passe EPUBCheck sans erreur *(06)* |
| `e2e/export/epub-toc-parity.spec.ts` | sommaires EPUB, PDF et aperçu de même structure *(06)* |
| `e2e/publish/spine-and-cover.spec.ts` | télécharger un gabarit aux dimensions attendues *(07)* |
| `e2e/publish/prevalidation.spec.ts` | le rapport signale les non-conformités et marque la gouttière « non vérifiée » *(08)* |
| `e2e/publish/listing.spec.ts` | remplir la fiche produit, générer des propositions, éditer sans écrasement *(09)* |
| `e2e/billing/credits-lifecycle.spec.ts` | acheter, consommer, être bloqué à zéro *(10)* |
| `e2e/billing/webhook-idempotence.spec.ts` | un événement rejoué ne crédite qu'une fois *(10)* |
| `e2e/knowledge/consistency.spec.ts` | une contradiction est signalée, un texte cohérent ne l'est pas *(11)* |
| `e2e/low-content/notebook.spec.ts` | un carnet de 120 pages produit 120 pages au bon format *(12)* |
| `e2e/editor/tables.spec.ts` | un tableau long se coupe en répétant son en-tête *(13)* |
| `e2e/editor/ai-image.spec.ts` | génération, débit d'une unité, avertissement affiché *(14)* |

## Tests de performance

Dans `tests/performance/`, exécutés par `vitest.performance.config.ts` :

| Budget | Chantier |
|---|---|
| Rendu d'un manuscrit contenant plusieurs dizaines d'images | 05 |
| Génération et rendu d'un carnet de 200 pages | 12 |

Les deux budgets sont à **établir par mesure**, pas à postuler. Le dépôt pose déjà la
règle : une assertion de durée n'a de valeur que si son échec signifie que le code a
ralenti.
