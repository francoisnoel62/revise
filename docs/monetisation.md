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
- **Le metering d'usage IA est partiellement construit — affiché, mais la mesure des tokens est un stub.** `TrackedLLMProvider` (`src/infrastructure/ai/TrackedLLMProvider.ts`) enregistre, par utilisateur **et** par projet, un `AIUsageRecord` (`AIUsageRecord.ts`, `MongoDBUsageRepository.ts`) avec le **type d'opération**, la **durée**… et des champs **tokens entrée/sortie qui valent toujours `null`**. En effet, le hook `setTokenCounts()` n'est **jamais appelé en production** (uniquement défini + testé), et **aucun provider n'extrait son `usage`** de la réponse API. Le cockpit (page « Utilisation IA », `UsageStatsCard.tsx` / `UsageByOperationChart.tsx` / `DailyUsageChart.tsx`, via `usage-actions.ts`) **affiche donc 0 token** : l'agrégation neutralise les `null` (`$ifNull → 0`). Seuls le **nombre d'opérations** (comptage de lignes) et la **durée** (mesurée via `Date.now()`) sont réels. **Et aucune logique ne s'en sert pour agir** : pas de crédits, pas de quota, pas de blocage. C'est un **compteur sans disjoncteur — dont le cadran « tokens » n'est même pas branché**.

**Conséquence majeure :** la couche de **mesure** existe en *structure* (schéma DB, agrégation, UI tous prêts), mais la **valeur des tokens n'est pas capturée** — il faut d'abord brancher ce câble (chaque provider doit remonter son `usage`). La difficulté reste faible. Ce qui manque pour monétiser : (1) **capturer les tokens** (correctif petit et cerné), puis la couche d'**enforcement** — **champ de plan/crédits sur le `User`**, **passerelle de paiement** (Stripe), **décompte d'un solde** à chaque `AIUsageRecord`, et **garde-fou pré-appel** (refus si solde nul). L'app est aujourd'hui gratuite, en **bêta fermée** (auth email+password avec `isApproved`).

---

## 1. L'arbitrage central, chiffré : géré vs zéro-risque

### Le seul vrai risque du modèle géré = la marge sur les gros consommateurs

En modèle géré, Revise paie l'API et facture un forfait fixe. Le danger : un auteur très actif consomme plus que son forfait. Prix API réels (juin 2026, en $/million de tokens) :

| Provider | Modèle | Entrée | Sortie | Profil |
|---|---|---|---|---|
| Anthropic | **Opus 4.8** | 5 | 25 | Meilleure prose/voix, raisonnement, contexte 1M |
| Anthropic | Sonnet 4.6 | 3 | 15 | Équilibré |
| Anthropic | **Haiku 4.5** | 1 | 5 | Rapide/éco (contexte 200K) |
| Google | Gemini 3 Pro | 2 | 12 | Gros contexte, analyse structurée |
| Google | Gemini 3 Flash | 0,50 | 3 | Le plus rapide + le moins cher |
| OpenAI | GPT‑5.5 | 5 | 30 | Top OpenAI, cher |

> **Correction d'une hypothèse antérieure :** Opus était estimé à 15 $/75 $ ; le prix réel d'**Opus 4.8 est 5 $/25 $**. « Le meilleur modèle pour tous » est donc bien plus abordable que craint — voir §6 (Routage par tâche).

**Coût par opération (avec le routage retenu en §6) :**
- Réécriture (3 propositions, Opus) : entrée ~2k / sortie ~0,5k → **~0,02 €**
- Analyse de manuscrit (Opus, avec prompt caching du contexte partagé) : **~0,10–0,15 €**
- Autocomplétion (Haiku) : **~0,0015 €** l'unité, mais **très fréquente**

**Coût mensuel par auteur (stack Claude retenu) :**
- Auteur modéré (50 réécritures, 1 suite d'analyses, 300 complétions) → **~3–3,5 €**
- Gros auteur → **~10–18 €**

**Trois leviers qui protègent la marge (à exploiter sur l'infra existante) :**
1. **Prompt caching** : les analyses renvoient sans cesse le **même contexte de manuscrit** en entrée (gros volume). Le cache coupe l'entrée de ~90 % sur ces opérations → c'est le poste de coût n°1, donc le plus gros gain de marge.
2. **Batch API pour les analyses** : les 6 analyses de manuscrit + les résumés ne sont **pas temps réel** → en mode asynchrone (Batch API, supporté par Anthropic/OpenAI/Google), **−50 % sur tous les tokens**, sans dégrader l'expérience. Détail ci-dessous.
3. **Crédits plafonnés** plutôt que « illimité » : on borne mécaniquement l'exposition. (Le routage par *qualité de modèle entre paliers* est volontairement écarté — voir §6 : tous les auteurs accèdent aux meilleurs modèles.)

#### Levier 2 en détail — Batch API

Le Batch API traite des requêtes **en asynchrone** contre **−50 % sur le prix des tokens** (entrée et sortie). Chez Anthropic : `POST /v1/messages/batches`, lots jusqu'à 100 000 requêtes, la plupart finis en **< 1 h** (max **24 h**), toutes les fonctions du Messages API supportées. SDK : `client.messages.batches.create(...)` → poll `retrieve()` jusqu'à `processing_status === "ended"` → itérer `results()`.

**Contrepartie : la latence.** Le batch n'est pas temps réel (minutes, parfois heures) → réservé aux opérations où **l'auteur peut attendre**.

| Opération | Batch ? | Pourquoi |
|---|---|---|
| Autocomplétion, Réécriture | ❌ synchrone | l'auteur attend devant l'écran |
| Génération de chapitre | ⚠️ au choix | sauf si vendu en « génère pendant la nuit » |
| **6 analyses + résumés** | ✅ **batch** | poste de coût le plus lourd, pas urgent |

**Seul changement d'UX** : remplacer le spinner bloquant par « Analyse lancée — on vous prévient » + notification. L'auteur continue d'écrire pendant ce temps.

**Deux nuances :**
- **La synthèse dépend des 5 autres analyses** → batcher les 5 indépendantes, puis lancer la synthèse (2ᵉ lot ou synchrone).
- **Batch et caching ne s'additionnent pas naïvement** : dans un lot, les requêtes tournent en parallèle → le cache n'est pas « chaud » pour les premières. Ne pas compter −95 % cumulés. Pour des analyses lancées d'un coup, **le batch est le levier le plus fiable** ; le caching brille surtout sur les analyses relancées dans la même session.

→ Effet net : les analyses pesant l'essentiel du coût Opus, le batch **divise ce poste par deux**, sans toucher à la qualité ni à l'écriture en direct. Seul coût : un peu d'orchestration asynchrone + notification.

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
4. **Le meilleur modèle pour tous — la différenciation se fait au volume, jamais à la qualité IA.** Décision produit : un petit forfait et un gros forfait accèdent **aux mêmes meilleurs modèles à jour**. On ne dégrade jamais l'IA des moins fortunés. La différenciation passe par le **volume de crédits** et les **fonctionnalités non-IA** (export, projets, priorité). Voir §6 pour le routage par tâche. *(Aligné `philosophie.md` : la qualité de la suggestion ne dépend pas du budget.)*
5. **« On paie l'écriture, pas l'IA ».** L'IA devient une fonctionnalité du SaaS d'écriture (au même titre que le cockpit, les quotas d'écriture `WritingQuota`), pas un compteur anxiogène. Réduit la peur de la facture.
6. **Pool de crédits inclus + dépassement sans mur.** L'abonnement inclut un pool mensuel ; une fois épuisé → soit recharge (top-up), soit on branche sa propre clé. **Jamais de blocage sec.**
7. **Offre « Auteur Fondateur » pour la cohorte bêta déjà approuvée.** Convertir la bonne volonté de la bêta fermée (tarif à vie / annuel avantageux).
8. **Garde-fous de coût comme fonctionnalité produit.** Modèle par défaut économique + plafond de contexte + prompt caching. Transformable en argument de transparence (« on optimise vos coûts »).

---

## 3. Recommandation : freemium « crédits + échappatoire BYOK »

Adapté à la cible **mixte/large**. Un seul mécanisme à comprendre (**les crédits**) + des paliers.

**Tous les paliers accèdent aux mêmes meilleurs modèles** (routage par tâche, §6). La différenciation est le **volume de crédits** + les fonctionnalités.

| Palier | Prix/mois | Crédits inclus/mois | Différenciation (PAS le modèle) | Cible |
|---|---|---|---|---|
| **Découverte** (gratuit) | 0 € | **20** | Pour goûter | Tester sans barrière |
| **Auteur** | **12 €** | **150** | Toutes fonctions | Cœur de cible |
| **Pro** | **24 €** | **350** | Export/analyses avancées + priorité | Semi-pro & pro |
| **BYOK** (option, +0 €) | gratuit | illimité (sa clé) | À son coût | Power users |
| **Recharge** | à l'achat | **+100 = 9 €** | Crédits supplémentaires | Pics ponctuels |

*Annuel : −20 % (2 mois offerts). Tarifs indicatifs, à calibrer sur les données de bêta (`AIUsageRecord`).*

**Barème de crédits (unités auteur, pas des tokens).** On ne metère que les actes IA délibérés ; l'autocomplétion et les résumés sont **inclus** (coût négligeable, et metérer la frappe = anxiété).

| Acte IA | Crédits |
|---|---|
| Autocomplétion | **inclus (0)** |
| Résumés de chapitres | **inclus (0)** |
| Réécriture (3 propositions) | **1** |
| Génération de chapitre | **3** |
| Analyse (par type, ex. ADN stylistique) | **3** |
| Analyse complète (les 6 types) | **12** *(remise vs 18)* |

**Vérification de marge** (1 crédit ≈ 0,08 € de prix de vente ; coût réel sous-jacent ≤ 0,04 €/crédit) : un palier Auteur (150 cr à 12 €) consommé **entièrement en analyses** (le pire cas) coûte ~6,5 € → **marge ~46 %** ; au mix typique (surtout réécritures + autocomplétion incluse) → **marge 60–75 %**. Les crédits **plafonnent** mécaniquement le pire cas, et le BYOK absorbe les power users.

**Principe directeur, aligné `philosophie.md` :** on **ne metère que le calcul IA**. L'éditeur, le texte de l'auteur, l'écriture et la sauvegarde restent **gratuits et illimités** à tous les paliers. On ne met jamais les mots de l'auteur derrière un paywall, on ne pousse jamais à « plus d'IA » au détriment de la voix, on n'entraîne jamais sur les écrits. Le pricing monétise **l'outillage et le choix**, jamais le texte.

**Pourquoi ce modèle coche tous les critères de Fanfan :**
- **Simple** : un concept (crédits) + des paliers lisibles.
- **Transparent** : crédits affichés en unités auteur ; la page « Utilisation IA » du cockpit existe déjà pour les montrer.
- **Facile techniquement** : la mesure et le BYOK sont déjà là (et l'usage est même déjà affiché) ; il reste à brancher l'enforcement — Stripe + champ `plan/credits` sur `User` + décompte de solde + garde-fou. (Détail volontairement hors scope de cette étude.)
- **Faible risque** : crédits plafonnent l'exposition ; le BYOK offload les gros consommateurs ; prompt caching + routage par tâche (§6) protègent la marge.
- **Compétitif** : zéro barrière à l'entrée pour les nouveaux, tout en gardant le BYOK pour les exigeants.

---

## 4. Risques & parades

| Risque | Parade |
|---|---|
| Marge érodée par gros consommateurs | Crédits plafonnés + routage par tâche (§6) + **prompt caching** sur le contexte de manuscrit + BYOK comme exutoire |
| Prix API qui montent | Crédits réindexables ; coûts adossés au modèle servi, pas à un illimité |
| Anxiété du compteur | Affichage en unités auteur, jamais de blocage sec, écriture toujours gratuite |
| Conflit avec la philosophie | Ne metérer que le calcul IA ; texte de l'auteur jamais payant ni utilisé pour l'entraînement |
| Friction BYOK (déjà identifiée) | BYOK devient *optionnel*, plus le chemin par défaut |

---

## 5. Faisabilité technique (résumé, non détaillé ici)

**Distinction clé : la *mesure* existe (et est même déjà affichée), mais l'*enforcement* n'existe pas.** Le compteur tourne et est montré à l'auteur ; rien n'est branché dessus pour limiter ou facturer. C'est un compteur sans disjoncteur.

Briques **déjà présentes** à réutiliser le jour de l'implémentation :
- Mesure (écriture) → `src/infrastructure/ai/TrackedLLMProvider.ts`, `src/domain/entities/AIUsageRecord.ts`, `src/infrastructure/persistence/MongoDBUsageRepository.ts` — **structure prête, mais tokens non capturés** (voir §0 : `setTokenCounts()` jamais appelé, providers ne lisent pas leur `usage`). À brancher avant toute facturation au token.
- Lecture / affichage (déjà en place, en lecture seule) → `src/app/actions/usage-actions.ts`, page `src/app/project/[projectId]/cockpit/usage/page.tsx`, composants `UsageStatsCard.tsx` / `UsageByOperationChart.tsx` / `DailyUsageChart.tsx`
- BYOK / clés chiffrées → `src/domain/entities/Provider.ts`, `src/infrastructure/encryption/crypto.ts`, `MongoDBProviderRepository.ts`
- Sélection de provider/modèle → `src/infrastructure/ai/LLMProviderFactoryImpl.ts`, `src/infrastructure/config/providers.ts`
- Porteur du plan → ajouter `plan`/`credits` sur `src/domain/entities/User.ts`

Briques **à ajouter** (l'enforcement — hors scope de cette étude, à planifier séparément) : intégration paiement (Stripe), notion de solde de crédits + décrément à chaque `AIUsageRecord` écrit, **garde-fou pré-appel** (refus si solde nul + proposition recharge/BYOK), mapping opération → coût en crédits, UI de plan et de solde. Aujourd'hui, **aucune** de ces briques d'enforcement n'existe.

---

## 6. Routage par tâche : le meilleur modèle pour chaque tâche, identique pour tous

**Décision produit :** pas de différenciation de qualité IA entre paliers. On sert **le meilleur modèle adapté à chaque tâche** — pas le meilleur modèle pour *toutes* les tâches. L'autocomplétion et la génération de chapitre ne demandent pas le même travail, donc pas le même modèle. Le routage est **identique pour tous les utilisateurs** (un petit forfait et un gros forfait ont la même qualité).

Prix de référence (juin 2026) : Opus 4.8 = 5 $/25 $ · Haiku 4.5 = 1 $/5 $ (par M de tokens). Stack retenu : **Claude, deux modèles**.

| Tâche Revise (`AIOperationType`) | Modèle | Pourquoi |
|---|---|---|
| Réécriture (`rewrite`) | **Opus 4.8** | Voix : cœur du produit, meilleure prose |
| Génération de chapitre (`chapter_generation`) | **Opus 4.8** | Écriture longue dans la voix de l'auteur |
| ADN stylistique (`stylistic_dna`) | **Opus 4.8** | Analyse littéraire fine |
| Analyse narrative (`narrative_analysis`) | **Opus 4.8** | Narratologie + contexte 1M |
| Synthèse (`synthesis`) | **Opus 4.8** | Méta-jugement éditorial |
| Personnages (`characters`) | **Opus 4.8** | Choix puriste : qualité max |
| Intrigue (`plot`) | **Opus 4.8** | Idem |
| Univers (`worldbuilding`) | **Opus 4.8** | Idem |
| Résumés de chapitres (`chapter_summaries`) | **Haiku 4.5** | Résumé en vrac = tâche facile, éco |
| Autocomplétion (`completion`) | **Haiku 4.5** | Très fréquent, latence prioritaire |

**Principe :** Opus 4.8 pour tout ce qui touche **la voix ou le jugement littéraire** ; Haiku 4.5 pour le **haut-volume / basse-latence**. Un seul provider → ops simples, voix cohérente, prompt caching efficace.

**Notes :**
- Haiku 4.5 plafonne à **200K de contexte** (vs 1M pour Opus). OK pour l'autocomplétion ; pour les résumés d'un manuscrit très long → traiter chapitre par chapitre (déjà le cas) ou repli Opus.
- Le routage doit rester **à jour** : `LLMProviderFactoryImpl.ts` / `providers.ts` rendent le changement de modèle par défaut quasi gratuit à chaque nouvelle version.
- **Valider par A/B aveugle** sur de vrais manuscrits avant de figer : `AIUsageRecord` logue déjà le modèle par opération, donc on mesure la préférence réelle plutôt que de se fier aux réputations.

---

## 7. Pistes complémentaires

Idées au-delà du socle (crédits, routage, mode local, journal de transparence). ⭐ = priorités.

### Confiance / différenciation (alignées philosophie)
1. **⭐ Rapport de divulgation IA + « attestation de paternité ».** De plus en plus d'éditeurs, concours et plateformes exigent de **déclarer l'usage de l'IA**. Générer en un clic un rapport (« voici ce que l'IA a fait sur ce manuscrit ») + un indicateur **« % écrit de votre main vs assisté »**. Réutilise le metering + le journal de transparence (`docs/transparency-ledger.md`). Timing parfait, on-brand, peu de concurrents.
2. **Indicateur d'intégrité de la voix.** Sur la base de `stylistic_dna`, signaler quand une suggestion s'écarte de *votre* voix — pour la préserver, pas la standardiser.

### Fonctionnalités payantes (différencient les paliers, sans toucher la qualité IA)
3. **Export pro** (EPUB, format manuscrit édition, mise en page soignée) — palier Pro.
4. **Partage bêta-lecteurs / éditeur** (commentaires sur un chapitre) — collaboratif, « collant ».
5. **Historique de versions** du manuscrit — rassurant et premium.
6. **Profil de voix persistant** — capitaliser sur `authorProfile` (déjà paramètre de `generateRewrites`) pour une cohérence de voix sur tout le livre. Approfondit le moat.

### Mécanismes de monétisation (au-delà de l'abonnement)
7. **Pack manuscrit one-shot** : analyse complète d'un manuscrit fini, **sans abonnement**. Capte la longue traîne anti-récurrent.
8. **Plans ateliers d'écriture / collectifs (B2B2C)** : sièges groupés pour ateliers, écoles, associations d'auteurs — marché francophone réel.
9. **Parrainage** : crédits pour inviter un autre auteur. Viral, peu coûteux.
10. **Offre « Auteur Fondateur »** pour la cohorte bêta approuvée (annuel/à vie avantageux).

### Levier de marge (concret, sans impact UX)
11. **⭐ Batch API pour les analyses** → traité en détail au **§1, Levier 2** (−50 % sur les analyses, en asynchrone).

**Top 3 si arbitrage :** (1) Rapport de divulgation IA / attestation, (2) Batch API pour les analyses, (3) Export pro + partage bêta-lecteurs.

---

## Verification (de l'étude, pas du code)

Cette étude est validée si elle permet à Fanfan de **trancher**, en répondant à :
1. Le modèle recommandé (freemium crédits + échappatoire BYOK) lève-t-il bien **les deux** faiblesses (barrière à l'entrée *et* risque de marge) ? → Oui, démontré §1 et §3.
2. Les hypothèses de coût (§1) sont-elles assez crédibles pour fixer des prix ? → Ordres de grandeur ; **à revalider** sur les prix API du jour et les vrais profils d'usage (les données `AIUsageRecord` de la bêta permettent de calibrer réellement avant lancement).
3. Le pricing respecte-t-il `philosophie.md` ? → Oui : on ne metère que le calcul IA, jamais le texte.

**Prochaine étape possible (si Fanfan le souhaite plus tard) :** un plan d'implémentation technique dédié du palier recommandé, calibré sur les données d'usage réelles de la bêta.
