<!-- ABOUTME: Philosophie produit de Revise — le périmètre et les principes que chaque fonctionnalité doit respecter. -->
<!-- ABOUTME: À lire avant de rechercher, planifier ou implémenter ; définit le « pourquoi » derrière les règles de CLAUDE.md. -->

# Philosophie — Revise

**Revise** est un outil d'écriture et de publication augmenté par l'IA, destiné aux
auteurs qui publient — au premier rang desquels les auteurs auto-publiés
professionnels.

**Promesse** : de la page blanche au livre publié.

## Ce que fait Revise

Revise couvre la chaîne complète, de l'écriture au fichier prêt à déposer :

1. **Écrire** — manuscrit structuré, réécriture, autocomplétion, génération, correction
   orthographique et grammaticale locale.
2. **Structurer** — chapitres, rôles sémantiques, images, tableaux, notes, analyses
   (Story Intelligence en fiction, Knowledge Intelligence en non-fiction).
3. **Publier** — profils de publication, éditions multiples, export PDF, DOCX et EPUB,
   gabarit de couverture, prévalidation avant dépôt, fiche produit.

Le cœur de la valeur est le **non-fiction commercial** — essais, manuels, guides. La
fiction reste un mode complet, en maintenance : rien n'y est retiré, l'effort neuf va
ailleurs.

## Principes fondateurs

- **Propriété.** Les écrits appartiennent à l'auteur. Ils ne servent **jamais** à
  l'entraînement d'un modèle. Quand le manuscrit d'un client est son gagne-pain, c'est
  la promesse la plus importante que nous lui faisons.
- **Transparence.** L'auteur sait ce que fait l'IA, ce qu'elle coûte, et ce qui quitte
  Revise vers un fournisseur externe.
- **L'auteur est responsable de son œuvre.** L'IA est un outil. Revise ne restreint pas
  ce que l'auteur peut en faire — il lui donne le contrôle et l'information nécessaires
  pour décider.
- **Honnêteté technique.** Revise ne promet pas ce qu'il ne peut pas tenir. Quand une
  règle de marketplace n'est pas vérifiable, il le dit plutôt que de laisser croire
  qu'elle l'est.

## Ce qui n'a PAS sa place dans Revise

- **Toute connexion automatique au compte d'une plateforme de publication.** Il n'existe
  pas d'API publique KDP ; s'y connecter à la place de l'auteur exposerait son compte,
  donc son revenu. Aucune version future ne rouvre cette porte.
- **Toute opacité sur ce que l'IA produit ou coûte.** L'auteur doit pouvoir savoir ce
  qui a été généré, notamment parce que certaines plateformes exigent une déclaration
  du contenu généré par IA et que d'autres le refusent.
- **Toute fonctionnalité qui fait passer l'auteur pour conforme quand il ne l'est pas.**
  Une prévalidation incomplète doit s'annoncer incomplète.

## Historique

Revise s'adressait initialement aux auteurs de fiction, avec des principes centrés sur
la préservation de la voix de l'auteur : « l'IA suggère, l'auteur décide », « toujours
offrir des choix », « ne jamais standardiser la voix ». Ces principes ont été retirés
avec le déplacement du public cible — voir
[ADR 0007](../docs/adr/0007-perimetre-produit-et-revision-philosophie.md) pour la
décision et son motif.

Les comportements qu'ils inspiraient restent largement en place — trois variations
stylistiques, préservation de la langue, l'édition de l'auteur qui l'emporte sur la
génération — mais comme des choix de conception, non comme des contraintes absolues.

> Chaque décision produit ou technique se mesure à l'aune de ces principes.
