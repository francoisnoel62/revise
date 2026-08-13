# Licence propriétaire et usage serveur de Grammalecte

## Contexte

Revise reste un logiciel propriétaire, tous droits réservés. Le correcteur
grammatical envisagé utilise Grammalecte, distribué sous GPL-3.0 sans exception
de linking.

## Décision

Revise exécute Grammalecte exclusivement côté serveur dans le service web. Les
autrices et auteurs ne reçoivent pas le logiciel Grammalecte : ce mode de
fonctionnement est la position retenue pour l'exploitation actuelle de Revise.

## Statut au 13 août 2026

**Implémenté.** `GrammalecteGrammarChecker` est assemblé dans
`src/infrastructure/config/providers.ts` et est appelé par
`CheckChapterGrammarUseCase`. La vérification s'exécute côté serveur, sans
appel à un fournisseur IA. Le paquet `@francoisnoel62/grammalecte` reste un
artefact d'infrastructure : il n'est pas distribué au navigateur.

Ce statut atteste le chemin logiciel actuel ; il ne constitue pas un avis sur
la compatibilité juridique. Toute distribution cliente reste soumise au
garde-fou ci-dessous.

## Garde-fou de packaging

Avant toute décision de build desktop, Electron, application installable ou
autre artefact remis à l'auteur, cette décision doit être réexaminée. Envoyer
Grammalecte avec un tel artefact constituerait une distribution et changerait
l'analyse de compatibilité avec la GPL-3.0. Cette révision exige un avis
juridique avant le début du packaging.
