# Abonnement de plateforme et crédits d'usage IA

Revise est aujourd'hui en bêta gratuite, sans aucun prestataire de paiement installé, et
chaque auteur apporte sa propre clé d'API (BYOK). Ce modèle convient à des adoptants
techniques ; il est un frein pour un professionnel de l'auto-édition, qui ne veut pas
ouvrir un compte chez un fournisseur d'IA ni gérer une clé.

Nous adoptons un modèle en deux parties : **un abonnement à la plateforme** et **des
crédits d'usage IA achetés dans l'application**.

## Règles

- **Unité** : les crédits sont exprimés en unités abstraites indexées sur un coût de
  référence, pas en euros. Cela découple le prix affiché des variations tarifaires des
  fournisseurs.
- **Marge** : appliquée sur le coût réel.
- **Palier gratuit** à l'inscription, pour permettre d'essayer sans payer.
- **Blocage dur à solde nul** : aucune dette, aucun découvert.
- **Pas d'expiration** des crédits — c'est un irritant majeur et un terrain juridique
  glissant en France.
- **BYOK conservé** en option avancée. Le code existe et fonctionne ; le retirer
  coûterait plus que le garder.

## Une exception : la génération d'images

Elle passe **exclusivement par les clés Revise, jamais en BYOK**. Motif technique :
`LLMProvider` expose dix-huit méthodes, toutes textuelles, et **Anthropic ne génère pas
d'images**. En BYOK, la fonctionnalité serait indisponible pour une partie des
utilisateurs sans raison compréhensible de leur point de vue.

Conséquence sur le compteur : les images se facturent **à l'image**, pas au token. Le
grand livre de crédits doit donc accepter deux unités de consommation distinctes dès sa
conception.

## Ce qui existe déjà

Le compteur est en grande partie construit : `AIUsageRecord` enregistre l'usage, et la
tarification est synchronisée depuis OpenRouter avec conversion en euros par token. Il
manque le solde, le débit et le grand livre.

## Prestataire

**Stripe**, qui couvre l'abonnement récurrent et l'achat ponctuel de crédits dans le
même produit. Rien n'est installé aujourd'hui. L'intégration se fera en collaboration
pas à pas, étape par étape — elle touche à des secrets et à des webhooks, et ne doit pas
être livrée d'un bloc.

## Conséquence sur les documents contractuels

Les conditions générales de vente affirment aujourd'hui qu'« il n'existe actuellement
aucun tarif Revise, renouvellement automatique, paiement par abonnement ». Elles devront
être refaites avant toute mise en vente. Ce point est hors périmètre technique mais
bloquant commercialement.

## Considered Options

**Abonnement seul, IA incluse dans un quota.** Rejeté au profit du modèle retenu, qui
sépare le coût fixe de la plateforme du coût variable de l'IA — plus lisible pour un
professionnel qui pilote sa marge.

**Rester en BYOK intégral.** Rejeté : c'est exactement la friction que le marché visé
refuse.

**Supprimer BYOK.** Rejeté : coût de retrait supérieur au coût de maintien, et l'option
reste utile aux utilisateurs techniques.

## Liens

- PRD : [plateforme-auto-edition/PRD.md](../plans/plateforme-auto-edition/PRD.md)
- ADR lié : [0007](0007-perimetre-produit-et-revision-philosophie.md)
- Chantiers : [10](../plans/plateforme-auto-edition/10-abonnement-et-credits.md),
  [14](../plans/plateforme-auto-edition/14-generation-images-ia.md)
