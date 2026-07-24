# Handoff — Snapshots de projet

**Date :** 2026-07-24  
**État :** cadrage produit terminé et validé ; tickets GitHub créés, aucun code écrit.

## Objectif

Ajouter à Revise un historique de versions de projet fondé sur des snapshots immuables. Un auteur peut créer un snapshot manuellement ou activer une création automatique. L’historique permet la consultation, la comparaison avec l’état courant et la restauration complète d’une ancienne version sans détruire les versions récentes.

## Décisions produit validées

- Un snapshot capture le manuscrit complet : chapitres, contenu, titres, ordre, métadonnées éditoriales et références versionnées aux ressources associées. Il exclut préférences personnelles, métriques, activité, historique des corrections IA, état de publication et réglage d’automatisation.
- Les snapshots sont immuables. Leur titre et commentaire peuvent évoluer selon les droits, mais pas leur contenu. Chaque snapshot reçoit un numéro unique, séquentiel et jamais réutilisé, ainsi qu’un horodatage système immuable (UTC, affiché dans le fuseau local du lecteur).
- Les types sont : manuel, automatique, restauration et sécurité avant restauration. Les snapshots manuels, de restauration et de sécurité sont pérennes ; les automatiques suivent la rétention ci-dessous.
- L’état courant peut différer du dernier snapshot et affiche alors « modifications depuis la version N ». Les seuls objets numérotés sont les snapshots. Aucun snapshot initial n’est créé à la naissance d’un projet.
- Un snapshot manuel est possible même sans changement, pour poser un jalon éditorial. Il force d’abord la sauvegarde de l’état courant puis crée une copie atomique ; titre prérempli et commentaire facultatif.
- L’automatisation est désactivée par défaut, configurée par projet et uniquement par le propriétaire : 5 min, 15 min, 30 min ou 1 h. Elle utilise une horloge globale côté serveur, n’agit que lorsqu’au moins une session du projet est ouverte, et ne crée un snapshot qu’après une modification d’un élément capturé. Toute création de snapshot repousse la prochaine échéance ; modifier le réglage requiert une nouvelle modification puis l’attente du nouvel intervalle.
- Rétention automatique : garder les 20 derniers, puis le plus récent de chaque jour pendant 30 jours, puis le plus récent de chaque semaine pendant 6 mois, selon le fuseau du projet. L’élagage laisse une entrée d’activité agrégée.
- La restauration est transactionnelle et optimiste : si le projet a changé concurremment, demander de recharger ; sinon, tout réussit ou rien ne change. Si l’état courant a changé depuis le dernier snapshot, créer d’abord un snapshot pérenne « Sécurité avant restauration », puis la restauration. Sinon restaurer directement. Ex. : `v10` + changements non snapshotés, restauration de `v4` → `v11` sécurité, `v12` restaurée depuis `v4`.
- Restaurer remplace fidèlement la structure éditoriale courante, y compris la disparition de chapitres ajoutés plus tard. Publication et fréquence automatique restent toutefois inchangées. Tout snapshot non supprimé, y compris automatique et de sécurité, est restaurable.
- Droits : lecteurs consultent et prévisualisent ; éditeurs créent et restaurent ; propriétaire règle l’automatisation et supprime. Créateur et propriétaire peuvent modifier titre/commentaire selon les règles établies ; l’auteur historique reste visible même après perte d’accès ou changement de propriétaire.
- Supprimer un snapshot est définitif après confirmation, réservé au propriétaire. Le numéro n’est pas réutilisé : l’activité conserve un trou d’audit sans contenu restaurable. La provenance d’une restauration survit à la suppression de sa source (`restaurée depuis v4 supprimée`). Les snapshots suivent le cycle de vie du projet et sont définitivement supprimés avec lui.
- L’éditeur contient un panneau « Historique des versions » avec création manuelle. Les paramètres du projet portent la fréquence. La chronologie se charge progressivement, filtre par type, auteur et période, et montre date, auteur, type, commentaire et numéro.
- Une prévisualisation est strictement en lecture seule et permet de naviguer dans chapitres et métadonnées de la version ; un bandeau distingue clairement l’état passé du projet courant.
- La comparaison vise une version passée contre un état courant sauvegardé, figé et daté à l’ouverture. Elle liste d’abord les chapitres modifiés, puis affiche le texte côte à côte avec ajouts/suppressions ; les blocs riches sont signalés comme ajoutés, supprimés ou modifiés. Pas de restauration partielle, de comparaison entre deux snapshots passés, d’export direct, ni de duplication vers un autre projet dans la première version.
- Une restauration notifie les autres collaborateurs dans l’application (préférence individuelle activable/désactivable), jamais son auteur. Les autres créations n’envoient pas d’alerte mais restent dans l’activité.
- Un échec de snapshot automatique ne bloque jamais l’écriture : statut discret, journalisation et nouvelle tentative à la prochaine échéance. La création ou restauration ne doit laisser aucun état partiel ni numéro consommé.

## Faits techniques vérifiés

- Fonctionnalité greenfield : aucun modèle, action, UI ou test de snapshots de contenu n’existe actuellement.
- Le document Mongo `Project` embarque les `Chapter` avec contenu TipTap JSON. Une sauvegarde remplace le chapitre courant dans `projects` ; il n’existe ni numéro de révision, ni diff, ni collection d’historique.
- L’autosave client actuel déclenche une sauvegarde une seconde après la dernière modification dans `TextEditor` via `useAutosave`.
- Annuler/rétablir est assuré par TipTap et doit rester conceptuellement distinct des snapshots.
- `WordCountSnapshot` ne concerne que les compteurs journaliers de mots ; il ne stocke aucun contenu éditorial. L’historique de corrections IA est également distinct et non restaurable.

Fichiers d’accroche à réexaminer avant implémentation :

- `src/domain/entities/Project.ts`
- `src/domain/entities/Chapter.ts`
- `src/infrastructure/persistence/serialization/project-serializer.ts`
- `src/infrastructure/persistence/MongoDBProjectRepository.ts`
- `src/application/use-cases/UpdateChapterContentUseCase.ts`
- `src/store/projectStore.ts`
- `src/app/actions/chapter-actions.ts`
- `src/hooks/useAutosave.ts`
- `src/components/editor/TextEditor.tsx`
- `src/app/editor/page.tsx`

## Point de départ conseillé

Commencer par le ticket #169. Il établit la fondation dont dépendent restauration, automatisation et comparaison. Priorité à la persistance transactionnelle et aux invariants de restauration avant l’interface de comparaison.

## Tickets GitHub publiés

- #169 — [Créer et consulter l’historique manuel](https://github.com/francoisnoel62/revise/issues/169) — aucune dépendance.
- #170 — [Restaurer une version sans perdre l’état courant](https://github.com/francoisnoel62/revise/issues/170) — bloqué par #169.
- #171 — [Automatiser la création et la rétention](https://github.com/francoisnoel62/revise/issues/171) — bloqué par #169.
- #172 — [Prévisualiser et comparer une version passée](https://github.com/francoisnoel62/revise/issues/172) — bloqué par #169.
- #173 — [Gouverner l’historique collaboratif](https://github.com/francoisnoel62/revise/issues/173) — bloqué par #169, #170 et #171.

## Suggested skills pour la prochaine session

- `tdd` — écrire les invariants de création, rétention et restauration avant l’implémentation.
- `implement` — transformer ce cadrage en plan d’exécution puis en tranches verticales.
- `domain-modeling` — formaliser les entités Snapshot, provenance, politiques de rétention et droits si le modèle devient ambigu.
- `code-review` — vérifier les changements avant mise en production, en particulier atomicité, autorisation et non-régression de l’autosave.
- `diagnosing-bugs` — investiguer les conflits de concurrence ou les écarts entre autosave et snapshot.
