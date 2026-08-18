# 10 — Abonnement Stripe et crédits d'usage IA

**Dépend de** : rien techniquement. **Bloque** : 14.
**ADR** : [0011](../../adr/0011-abonnement-et-credits.md)

> **Ce chantier se conduit en collaboration pas à pas.** Il touche à des secrets, à des
> webhooks et à de l'argent réel. Il ne doit pas être livré d'un bloc, et chaque étape
> se valide avant la suivante.

## État vérifié

Aucun prestataire de paiement n'est installé — ni Stripe, ni autre. Le modèle actuel est
BYOK plus bêta gratuite, et les CGV affirment explicitement qu'« il n'existe actuellement
aucun tarif Revise ».

Ce qui existe déjà, et qui est précieux : `AIUsageRecord` enregistre l'usage, et
`OpenRouterPricingClient` synchronise la tarification avec conversion en euros par token.
**Le compteur est construit ; il manque le solde, le débit et le grand livre.**

## Le modèle

Abonnement de plateforme **plus** crédits d'usage achetés dans l'application.

- Crédits en **unités abstraites** indexées sur un coût de référence, pas en euros
- **Marge** appliquée sur le coût réel
- **Palier gratuit** à l'inscription
- **Blocage dur** à solde nul — aucune dette, aucun découvert
- **Pas d'expiration** des crédits
- **BYOK conservé** en option avancée
- **Deux unités de consommation** dès la conception : le token et l'image. La génération
  d'images se facture à l'image (chantier 14), et rétrofiter une seconde unité dans un
  grand livre conçu pour une seule est coûteux.

## Les étapes, à valider une par une

1. **Le grand livre de crédits** — entité, solde, écritures, idempotence. Aucun paiement
   encore, seulement le débit sur l'usage IA existant.
2. **Le blocage à solde nul** — avant tout appel IA, sur le chemin serveur uniquement.
3. **Stripe en mode test** — produits, abonnement, achat ponctuel. Clés en variables
   d'environnement, jamais en base ni dans le dépôt.
4. **Les webhooks** — vérification de signature, **traitement idempotent**, file de
   reprise. C'est ici que se produisent les doubles crédits et les paiements perdus.
5. **Le passage en production** — après validation manuelle de bout en bout.

## Fichiers touchés

- `src/domain/entities/CreditLedger.ts` et `CreditTransaction.ts` — nouveaux
- `src/domain/interfaces/PaymentProvider.ts` — le contrat, pour que Stripe reste
  remplaçable
- `src/infrastructure/payment/StripePaymentProvider.ts` — nouveau
- `src/app/api/webhooks/stripe/route.ts` — nouveau
- `src/infrastructure/ai/TrackedLLMProvider.ts` — le débit s'y greffe, il enregistre déjà
- `src/app/settings/` — solde, historique, achat
- `.env.local.example` et `.env.production.example` — les variables, sans valeurs
- `src/app/conditions-generales-vente/page.tsx` — **devient faux**, à refaire

## Tests à écrire d'abord

1. Un débit supérieur au solde est refusé, et l'appel IA n'a pas lieu.
2. Le solde ne devient jamais négatif, y compris sur deux débits concurrents.
3. Un webhook reçu deux fois ne crédite qu'une fois.
4. Un webhook à signature invalide est rejeté.
5. Les crédits n'expirent pas : un crédit acheté reste utilisable après une longue
   période simulée.
6. Le palier gratuit est attribué une seule fois par compte.
7. Un utilisateur en BYOK n'est pas débité de crédits pour ses appels texte.
8. Le grand livre accepte les deux unités, token et image, sans changement de schéma.

## Critère de fin

Un compte s'abonne, achète des crédits, consomme de l'IA, voit son solde décroître, et
est bloqué proprement à zéro. Aucun webhook rejoué ne fausse le solde.

## Risques

**Les secrets.** Les clés Stripe ne vont ni en base, ni dans le dépôt, ni dans un
composant client. Le chiffrement existant (`src/infrastructure/encryption/`) sert aux
clés BYOK des utilisateurs, pas aux secrets de la plateforme.

**L'idempotence.** C'est le seul endroit du produit où un bug se traduit directement en
euros perdus ou en clients facturés deux fois. Les tests 3 et 4 ne sont pas optionnels.

**Le juridique.** Les CGV, la facturation, la TVA et le droit de rétractation dépassent
ce plan technique et bloquent la mise en vente.
