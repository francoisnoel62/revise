# Étude de monétisation de Revise (axée usage de l'IA)

> Livrable : **étude stratégique** (pas de plan d'implémentation technique détaillé à ce stade).
> Cible retenue : **mixte / large** (freemium → pro). Arbitrage demandé : **modèle géré vs zéro-risque**, chiffré.

---

## Context

Fanfan veut monétiser Revise mais n'a pas encore de modèle. Deux pistes envisagées :
1. **Forfait tout compris** → Revise gère l'IA en interne (avance les coûts d'API, facture par-dessus).
2. **Statu quo BYOK** → l'utilisateur saisit ses propres clés API. Simple pour Revise, mais friction et **barrière à l'entrée** face aux concurrents.

Objectif : une monétisation **simple, claire, transparente, facile à implémenter**, et des idées non encore envisagées.

### Ce que change l'état réel du code (découvertes d'exploration)

Deux faits techniques rebattent les cartes :

- **Le BYOK est déjà entièrement construit.** Entité `Provider` (`src/domain/entities/Provider.ts`), chiffrement AES‑256‑GCM par utilisateur (`src/infrastructure/encryption/crypto.ts`), test de connexion, stockage MongoDB isolé par `ownerId` (`MongoDBProviderRepository.ts`). L'option « clés perso » **est déjà l'état actuel**.
- **Le metering d'usage IA est déjà construit — et même déjà affiché, mais purement descriptif.** `TrackedLLMProvider` (`src/infrastructure/ai/TrackedLLMProvider.ts`) enregistre, par utilisateur **et** par projet, les **tokens entrée/sortie**, la durée et le **type d'opération** (`AIUsageRecord.ts`, `MongoDBUsageRepository.ts`). Ces données sont **déjà lues et montrées à l'auteur** : page « Utilisation IA » du cockpit (`src/app/project/[projectId]/cockpit/usage/page.tsx`), composants `UsageStatsCard.tsx` / `UsageByOperationChart.tsx` / `DailyUsageChart.tsx`, via `src/app/actions/usage-actions.ts`. **Mais aucune logique ne s'en sert pour agir** : pas de crédits, pas de quota, pas de plafond, pas de blocage. C'est un **compteur sans disjoncteur** — un tableau de bord en lecture seule, jamais un mécanisme d'enforcement.

**Conséquence majeure :** la couche de **mesure** qui rend « le modèle géré » réputé *difficile* **existe déjà** (les tokens sont comptés, agrégés, affichés). La difficulté technique perçue par Fanfan est en grande partie levée. Ce qui manque pour monétiser n'est ni la mesure ni le BYOK, mais la couche d'**enforcement** branchée dessus : un **champ de plan/crédits sur le `User`**, une **passerelle de paiement** (Stripe), le **décompte d'un solde** à chaque `AIUsageRecord` écrit, et un **garde-fou pré-appel** (refus si solde nul). L'app est aujourd'hui gratuite, en **bêta fermée** (auth email+password avec `isApproved`).

---

## 1. L'arbitrage central, chiffré : géré vs zéro-risque

### Le seul vrai risque du modèle géré = la marge sur les gros consommateurs

En modèle géré, Revise paie l'API et facture un forfait fixe. Le danger : un auteur très actif sur un modèle cher consomme plus que son forfait. Chiffrons (ordres de grandeur, à revalider — prix API ~ début 2026, en $/million de tokens) :

| Modèle | Entrée | Sortie | Profil de coût |
|---|---|---|---|
| Gemini Flash | ~0,10–0,30 | ~0,40 | **Très bon marché** |
| Claude Haiku 4.5 | ~1 | ~5 | Bon marché |
| GPT‑4o | ~2,5 | ~10 | Moyen |
| Claude Sonnet 4.5 | ~3 | ~15 | Moyen-haut |
| Claude Opus | ~15 | ~75 | Cher |

**Coût par opération (estimations, modèle moyen type Sonnet) :**
- Réécriture (3 propositions) : entrée ~2k / sortie ~0,5k → **~0,01 €**
- Analyse de chapitre (ADN stylistique, narratif, perso…) : entrée ~15k / sortie ~3k → **~0,09 €**
- Autocomplétion : ~0,004 € l'unité, mais **fréquente**

**Coût mensuel par auteur (Sonnet) :**
- Auteur modéré (50 réécritures, 20 analyses, 300 complétions) → **~4–8 €**
- Gros auteur → **~20–40 €**

Avec **Gemini Flash** par défaut, divise ces montants par ~10–20 (auteur modéré ≈ 0,5–1 €). Avec **Opus**, multiplie par ~5.

**Trois leviers qui rendent le modèle géré viable (à exploiter sur l'infra existante) :**
1. **Routage par modèle** : modèle bon marché par défaut (Gemini Flash/Haiku), modèles premium réservés aux paliers payants. La différenciation produit devient *la qualité du modèle*.
2. **Prompt caching** : les analyses renvoient sans cesse le **même contexte de projet** en entrée (gros volume). Le cache (supporté côté Anthropic/Google) coupe l'entrée de ~90 % sur ces opérations → c'est le poste de coût n°1, donc le plus gros gain de marge.
3. **Crédits plafonnés** plutôt que « illimité » : on borne mécaniquement l'exposition.

### Tableau d'arbitrage

| Critère | **Modèle géré** (forfait/crédits) | **Zéro-risque** (BYOK / pass-through) |
|---|---|---|
| Friction utilisateur | **Aucune** (on s'inscrit, on écrit) | Élevée : créer un compte API, payer un tiers, copier une clé |
| Barrière à l'entrée vs concurrents | **Faible** (avantage compétitif) | **Élevée** (le frein cité par Fanfan) |
| Risque financier pour Revise | Réel mais **bornable** (crédits + routage + cache) | **Nul** |
| Trésorerie à avancer | Oui | Non |
| Transparence pour l'auteur | Bonne si exprimée en « unités auteur » | Bonne mais coût « ailleurs » (chez le provider) |
| Revenu récurrent / valorisation | **Fort** (SaaS classique, MRR) | Faible (on ne facture que l'outil, pas l'IA) |
| Effort technique restant | Stripe + champ plan + garde-fou (metering déjà là) | Quasi nul (déjà en place) |
| Conformité philosophie.md | OK (on monétise l'outil, pas le texte) | OK |

**Verdict de l'arbitrage : ce n'est pas « l'un OU l'autre ».** Le piège est de choisir un seul axe. Le BYOK gratuit règle *à lui seul* le risque de marge (les gros consommateurs branchent leur clé → coût nul pour Revise), et le modèle géré règle *à lui seul* la barrière à l'entrée. **Les combiner annule les deux faiblesses.** D'où la recommandation ci-dessous.

---

## 2. Idées non encore envisagées

1. **BYOK comme « échappatoire Pro », pas comme modèle principal.** Géré par crédits pour les 95 % qui veulent la simplicité ; BYOK proposé en option *illimitée* pour les power users — et **ça ne coûte rien à Revise**. Neutralise simultanément la barrière à l'entrée ET le risque de marge.
2. **Vendre des crédits, pas de « l'illimité ».** « Vous payez X → N crédits IA. » Intuitif, transparent, et **plafonne l'exposition**. Le metering existant (`AIUsageRecord`) alimente directement le décompte.
3. **Prix en « unités auteur », jamais en tokens.** Personne n'écrit en tokens. On facture par *analyse de chapitre*, *session de réécriture*, *1000 mots générés*. On traduit le metering technique en langage d'auteur.
4. **Le paywall = la qualité du modèle.** Gratuit sur modèle économique ; payant débloque Sonnet/GPT‑4o puis Opus. La marge suit naturellement (gratuit = peu cher à servir).
5. **« On paie l'écriture, pas l'IA ».** L'IA devient une fonctionnalité du SaaS d'écriture (au même titre que le cockpit, les quotas d'écriture `WritingQuota`), pas un compteur anxiogène. Réduit la peur de la facture.
6. **Pool de crédits inclus + dépassement sans mur.** L'abonnement inclut un pool mensuel ; une fois épuisé → soit recharge (top-up), soit on branche sa propre clé. **Jamais de blocage sec.**
7. **Offre « Auteur Fondateur » pour la cohorte bêta déjà approuvée.** Convertir la bonne volonté de la bêta fermée (tarif à vie / annuel avantageux).
8. **Garde-fous de coût comme fonctionnalité produit.** Modèle par défaut économique + plafond de contexte + prompt caching. Transformable en argument de transparence (« on optimise vos coûts »).

---

## 3. Recommandation : freemium « crédits + échappatoire BYOK »

Adapté à la cible **mixte/large**. Un seul mécanisme à comprendre (**les crédits**) + des paliers.

| Palier | Prix indicatif | Modèles | IA incluse | Cible |
|---|---|---|---|---|
| **Découverte** (gratuit) | 0 € | Économique uniquement (Flash/Haiku) | Petit pool mensuel de crédits | Tester sans barrière |
| **Auteur** | ~9–12 €/mois | + Sonnet / GPT‑4o | Pool généreux | Cœur de cible |
| **Pro** | ~19–29 €/mois | + Opus, analyses avancées, export | Grand pool + priorité | Semi-pro & pro |
| **BYOK** (option, +0 €) | gratuit sur tout palier | Tous (sa clé) | **Illimité, à son coût** | Power users |
| **Recharges** | packs à l'unité | — | Crédits supplémentaires | Pics ponctuels |

**Principe directeur, aligné `philosophie.md` :** on **ne metère que le calcul IA**. L'éditeur, le texte de l'auteur, l'écriture et la sauvegarde restent **gratuits et illimités** à tous les paliers. On ne met jamais les mots de l'auteur derrière un paywall, on ne pousse jamais à « plus d'IA » au détriment de la voix, on n'entraîne jamais sur les écrits. Le pricing monétise **l'outillage et le choix**, jamais le texte.

**Pourquoi ce modèle coche tous les critères de Fanfan :**
- **Simple** : un concept (crédits) + des paliers lisibles.
- **Transparent** : crédits affichés en unités auteur ; la page « Utilisation IA » du cockpit existe déjà pour les montrer.
- **Facile techniquement** : la mesure et le BYOK sont déjà là (et l'usage est même déjà affiché) ; il reste à brancher l'enforcement — Stripe + champ `plan/credits` sur `User` + décompte de solde + garde-fou. (Détail volontairement hors scope de cette étude.)
- **Faible risque** : crédits plafonnent l'exposition ; le BYOK offload les gros consommateurs ; routage + caching protègent la marge.
- **Compétitif** : zéro barrière à l'entrée pour les nouveaux, tout en gardant le BYOK pour les exigeants.

---

## 4. Risques & parades

| Risque | Parade |
|---|---|
| Marge érodée par gros consommateurs | Crédits plafonnés + routage modèle + **prompt caching** sur le contexte de projet + BYOK comme exutoire |
| Prix API qui montent | Crédits réindexables ; coûts adossés au modèle servi, pas à un illimité |
| Anxiété du compteur | Affichage en unités auteur, jamais de blocage sec, écriture toujours gratuite |
| Conflit avec la philosophie | Ne metérer que le calcul IA ; texte de l'auteur jamais payant ni utilisé pour l'entraînement |
| Friction BYOK (déjà identifiée) | BYOK devient *optionnel*, plus le chemin par défaut |

---

## 5. Faisabilité technique (résumé, non détaillé ici)

**Distinction clé : la *mesure* existe (et est même déjà affichée), mais l'*enforcement* n'existe pas.** Le compteur tourne et est montré à l'auteur ; rien n'est branché dessus pour limiter ou facturer. C'est un compteur sans disjoncteur.

Briques **déjà présentes** à réutiliser le jour de l'implémentation :
- Mesure (écriture) → `src/infrastructure/ai/TrackedLLMProvider.ts`, `src/domain/entities/AIUsageRecord.ts`, `src/infrastructure/persistence/MongoDBUsageRepository.ts`
- Lecture / affichage (déjà en place, en lecture seule) → `src/app/actions/usage-actions.ts`, page `src/app/project/[projectId]/cockpit/usage/page.tsx`, composants `UsageStatsCard.tsx` / `UsageByOperationChart.tsx` / `DailyUsageChart.tsx`
- BYOK / clés chiffrées → `src/domain/entities/Provider.ts`, `src/infrastructure/encryption/crypto.ts`, `MongoDBProviderRepository.ts`
- Sélection de provider/modèle → `src/infrastructure/ai/LLMProviderFactoryImpl.ts`, `src/infrastructure/config/providers.ts`
- Porteur du plan → ajouter `plan`/`credits` sur `src/domain/entities/User.ts`

Briques **à ajouter** (l'enforcement — hors scope de cette étude, à planifier séparément) : intégration paiement (Stripe), notion de solde de crédits + décrément à chaque `AIUsageRecord` écrit, **garde-fou pré-appel** (refus si solde nul + proposition recharge/BYOK), mapping opération → coût en crédits, UI de plan et de solde. Aujourd'hui, **aucune** de ces briques d'enforcement n'existe.

---

## Verification (de l'étude, pas du code)

Cette étude est validée si elle permet à Fanfan de **trancher**, en répondant à :
1. Le modèle recommandé (freemium crédits + échappatoire BYOK) lève-t-il bien **les deux** faiblesses (barrière à l'entrée *et* risque de marge) ? → Oui, démontré §1 et §3.
2. Les hypothèses de coût (§1) sont-elles assez crédibles pour fixer des prix ? → Ordres de grandeur ; **à revalider** sur les prix API du jour et les vrais profils d'usage (les données `AIUsageRecord` de la bêta permettent de calibrer réellement avant lancement).
3. Le pricing respecte-t-il `philosophie.md` ? → Oui : on ne metère que le calcul IA, jamais le texte.

**Prochaine étape possible (si Fanfan le souhaite plus tard) :** un plan d'implémentation technique dédié du palier recommandé, calibré sur les données d'usage réelles de la bêta.
