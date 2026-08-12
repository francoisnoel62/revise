# Licence propriétaire et usage serveur de Grammalecte

## Contexte

Revise reste un logiciel propriétaire, tous droits réservés. Le correcteur
grammatical envisagé utilise Grammalecte, distribué sous GPL-3.0 sans exception
de linking.

## Décision

Revise exécute Grammalecte exclusivement côté serveur dans le service web. Les
autrices et auteurs ne reçoivent pas le logiciel Grammalecte : ce mode de
fonctionnement est la position retenue pour l'exploitation actuelle de Revise.

## Garde-fou de packaging

Avant toute décision de build desktop, Electron, application installable ou
autre artefact remis à l'auteur, cette décision doit être réexaminée. Envoyer
Grammalecte avec un tel artefact constituerait une distribution et changerait
l'analyse de compatibilité avec la GPL-3.0. Cette révision exige un avis
juridique avant le début du packaging.
