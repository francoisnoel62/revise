# Issue — Adapter l'intégration IA au modèle paginé/sémantique

**Phase** 5 · **Dépend de** : `0007`, Spike J2 (`0003`) · **Label** : `done` · **Issue** : #135 · **Mergé** : 2026-06-30
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md) (« fonctions IA conservées, adaptées »).

## Contexte
L'intégration IA actuelle (bulle thésaurus, palette `Ctrl+K`, menu IA, propositions, autocomplétion inline) **est conservée** — Fanfan la trouve satisfaisante. Seul son **ancrage** doit s'adapter au nouveau modèle : contenu sémantique + pages avec sauts.

## Périmètre
**In** : insertion des propositions IA dans du contenu **sémantique** (pas de marques de présentation) ; sélection et positions stables **à travers les sauts de page** ; autocomplétion inline (texte fantôme) compatible avec la pagination vivante (re-pagination à la pause).
**Out** : refonte des fonctionnalités IA elles-mêmes (hors périmètre, elles ne changent pas).

## Critères d'acceptation
- [x] Réécrire/insérer une proposition fonctionne et produit du contenu sémantique correct.
- [x] Une sélection couvrant un saut de page est gérée sans bug de position.
- [x] L'autocomplétion inline reste fluide pendant la pagination vivante.
- [x] Aucune régression des entrées IA existantes.

## Ancre TDD
Tests : insertion de proposition → doc sémantique attendu ; sélection à cheval sur deux pages → positions correctes ; autocomplétion + re-pagination à la pause cohabitent sans casser le caret.
