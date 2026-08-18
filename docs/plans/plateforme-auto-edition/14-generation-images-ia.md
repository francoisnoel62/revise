# 14 — Génération d'images par IA

**Dépend de** : 05, **et 10**. **Placement** : lot séparé, après le 10.
**ADR** : [0011](../../adr/0011-abonnement-et-credits.md),
[0007](../../adr/0007-perimetre-produit-et-revision-philosophie.md)

## Pourquoi ce chantier dépend de la monétisation

Les images se facturent **à l'image**, pas au token. Le grand livre de crédits doit donc
exister et accepter deux unités de consommation avant que cette fonctionnalité soit
livrable. C'est la seule raison pour laquelle elle n'arrive pas plus tôt.

## État vérifié

`LLMProvider` expose **dix-huit méthodes, toutes textuelles**. Aucune capacité image
nulle part. Et **Anthropic ne génère pas d'images du tout**.

## Ce qu'on fait

Une capacité image **séparée** de `LLMProvider` plutôt qu'ajoutée dedans : la moitié des
implémentations existantes ne pourraient pas l'honorer, et une interface que ses
implémentations ne peuvent pas satisfaire est une mauvaise interface.

```
ImageGenerationProvider
  generateImage(prompt, options) → image + métadonnées de coût
```

**Réservée aux clés Revise, jamais BYOK.** Motif : en BYOK, la fonctionnalité serait
indisponible pour les utilisateurs sous Anthropic sans raison compréhensible de leur
point de vue.

Les images produites sont stockées via `BlobStorage`, comme les images uploadées du
chantier 05, et suivent le même chemin d'insertion dans le manuscrit.

## L'avertissement, qui n'est pas optionnel

Fait confirmé : **Amazon exige une déclaration pour tout contenu AI-generated** — texte,
images, traductions — à chaque publication **et republication**. Cela inclut
explicitement la couverture et les illustrations intérieures. Le contenu *AI-assisted*
(l'IA qui édite, affine, corrige, ou sert au brainstorming) n'est pas déclarable.

Au moment de la génération, le produit affiche une ligne factuelle indiquant que l'image
produite entre dans la catégorie déclarable. Ce n'est pas un système de traçabilité —
cette décision est restée en suspens — c'est un avertissement.

Le motif est direct : un auteur qui ignore cette règle fait une fausse déclaration à
Amazon, et c'est son compte qui est exposé.

## Fichiers touchés

- `src/domain/interfaces/ImageGenerationProvider.ts` — nouveau
- `src/infrastructure/ai/` — une implémentation par fournisseur capable
- `src/infrastructure/config/providers.ts` — câblage, avec clés de plateforme
- `src/domain/entities/CreditTransaction.ts` — l'unité « image »
- `src/components/editor/` — l'appel depuis l'éditeur, et l'avertissement
- `docs/prompt/images/` — les prompts

## Tests à écrire d'abord

1. La génération est refusée à un utilisateur en BYOK, avec un message qui explique
   pourquoi.
2. La génération est refusée à solde de crédits nul, et **aucun appel au fournisseur
   n'est émis**.
3. Une génération réussie débite exactement une unité « image ».
4. Une génération échouée ne débite rien.
5. L'avertissement de déclaration Amazon est affiché avant l'insertion dans le
   manuscrit.
6. L'image générée suit le même chemin de stockage et de suppression que l'image
   uploadée.

## Critère de fin

Un auteur abonné génère une illustration, la voit apparaître dans son guide, voit son
solde décroître d'une unité, et sait qu'elle sera à déclarer.

## Risques

**Le coût.** Une génération ratée coûte autant qu'une réussie côté fournisseur. Le
comportement en cas d'échec — qui paie ? — doit être décidé avant la mise en production,
pas découvert sur la première facture.

**La qualité pour l'impression.** Les générateurs produisent souvent des images en
résolution insuffisante pour du 300 DPI à la taille imprimée. La prévalidation du
chantier 08 s'applique à ces images comme aux autres, sans exception.
