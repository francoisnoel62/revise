# Couche application

État vérifié le 13 août 2026. Cette couche orchestre les règles du domaine à partir de ports. Les Server Actions et routes API créent les cas d'usage et assurent ensuite la persistance ou la sérialisation adaptée à l'interface.

## Où commencer

1. Partir de `src/app/actions/` ou d'une route API active.
2. Identifier le cas d'usage appelé dans `src/application/use-cases/`.
3. Suivre ses ports de domaine jusqu'à l'adaptateur assemblé par `src/infrastructure/config/providers.ts`.

`src/application/index.ts` est un barrel historique partiel ; il ne reflète pas tout le catalogue actif.

## Cas d'usage par capacité

| Capacité | Cas d'usage et services concernés |
| --- | --- |
| Manuscrit | Création, chargement, liste, suppression, renommage de projet ; ajout, retrait, ordre, titre et contenu de chapitre. Les cas d'usage de chapitre transforment l'agrégat ; les actions assurent sa sauvegarde. |
| Import/export | `ImportProjectUseCase` détecte le parseur compatible et renvoie le projet créé ; l'import normalise le H1 de titre. `ExportProjectUseCase` délègue à l'exporteur sélectionné et accepte les modes tout/actif/sélection. |
| Publication | `PublishProjectUseCase` publie tout ou une sélection de chapitres et construit l'URL publique à partir de l'URL de base. Les chargements de projet et de projet publié lèvent une erreur lorsqu'ils sont absents, ils ne renvoient pas `null`. |
| Métadonnées | `GenerateMetadataUseCase<T>` applique l'une des sept configurations de métadonnées. Les actions appellent ce cas générique pour chaque type. |
| IA d'écriture | Réécriture, génération de chapitre, alternatives lexicales, fiche/chat personnage et complétion. Le cas `GenerateCompletionUseCase` est un chemin de base ; le flux SSE actif de l'éditeur construit directement son contexte et appelle le fournisseur. |
| Canon | `GenerateCanonFactsUseCase` réextrait seulement les chapitres modifiés, préserve les faits manuels et ceux qui sont inchangés, et peut découvrir les personnages lorsqu'il n'existe pas encore de fiches. |
| Correction | `CheckSpellingUseCase`, `CheckChapterGrammarUseCase`, `UpdatePersonalDictionaryUseCase`, `AnalyzeChapterUseCase`, `ApplyCorrectionUseCase` et `ApplyBatchCorrectionsUseCase`. L'analyse IA ne couvre que style et répétitions. |
| Historique | Historique de corrections, instantanés manuels/automatiques, comparaison cohérente et restauration protégée. |
| Cockpit | Recherches, annexes, personnages, tâches, objectifs, quotas, activité, métriques et usage IA. |
| Compte et contenu public | Inscription, approbation, mots de passe, suppression de compte, blog et lecture publique. Le formulaire de contact persiste directement depuis son action : il n'existe pas de `SubmitContactFormUseCase`. |

## Contexte IA

`AIContextBuilder` construit le contexte de réécriture, génération, suggestions et persona. Il utilise les métadonnées structurées tant que l'auteur ne les a pas modifiées, puis revient au contenu édité ; il peut projeter des documents de recherche selon leur portée.

L'autocomplétion en flux suit un autre chemin : `AutocompleteContextBuilder`, `ManuscriptContextBuilder`, `autocompleteIntents` et les directives de préférence sont utilisés par `src/app/api/completion/stream/route.ts`. Ce flux inclut le voisinage du curseur, les chapitres précédents et le canon filtré, mais pas les documents de recherche.

## Rendu et migrations

`WholeBookHtmlAssembler`, `BookPreviewCacheComputer`, `BookOffsetCalculator`, les utilitaires de notes et les services de surcharges de présentation forment le rendu de publication. Ils servent l'aperçu PDF de livre entier et l'export paginé, en conservant le contenu sémantique.

La migration sémantique est disponible au chargement de chapitre et par script. `ChapterTitleHeadingMigration` complète les titres H1 manquants. La migration des anciens profils de publication est un script ponctuel. `ContentDemigrator` n'est pas un rollback produit : il est non raccordé et avec perte.

## Règles de contribution

- Un cas d'usage dépend de ports, jamais directement de MongoDB, Next.js ou d'un SDK IA.
- Décrire les entrées, sorties et erreurs dans le fichier du cas d'usage lorsque son contrat évolue ; ne pas extrapoler un contrat depuis un appel UI.
- Distinguer une transformation d'agrégat d'une persistance : plusieurs cas d'usage de chapitre ne sauvegardent pas eux-mêmes.
- Maintenir les tests proches des cas d'usage, notamment ceux du contexte IA, de Grammalecte et du rendu de livre entier.
