# MÉTAPLAN — Orchestration de la refonte de l'éditeur Revise

> **Public cible de ce document : un agent IA orchestrateur.**
> Ce fichier ne redécrit PAS le contenu des plans — il dit *dans quel ordre*, *sous quelles conditions* et *avec quels garde-fous* les exécuter. Il est la couche de pilotage au-dessus du backlog.
>
> **Sources de vérité (à lire, jamais à dupliquer) :**
> - Décision d'architecture : [`../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md`](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md)
> - Index du backlog : [`0000-epic-refonte-editeur.md`](0000-epic-refonte-editeur.md)
> - Plan détaillé du spike : [`0001-spike-editeur-apercu-kdp-parite-pixel.md`](0001-spike-editeur-apercu-kdp-parite-pixel.md)
> - Process pour agent frais : [`handoff-editeur-refonte-issues.md`](handoff-editeur-refonte-issues.md)
> - Glossaire : [`../../CONTEXT.md`](../../CONTEXT.md) § « Mise en page et publication »
> - Mémoire durable : `~/.claude/.../memory/editor-publication-fidelity-vision.md`

---

## Mapping tracker (LIVE — issues créées le 2026-06-27)

Les GitHub issues existent désormais (`francoisnoel62/revise`). **A et B ont été fusionnés en une seule issue spike (#122), mergée sur `main` le 2026-06-27.** Le backlog compte 14 issues.

| Nœud | Issue | Titre | Label | Bloqué par | État |
|---|---|---|---|---|---|
| SPIKE (ex-A+B) | **#122** | Spike — parité pixel + re-pagination vivante | `done` | — | ✅ **MERGÉ** |
| C | **#123** | Déploiement Chromium sur Vercel | `done` | #122 | ✅ **FERMÉ** (décision : @sparticuz/chromium, 2026-06-28) |
| D | **#124** | PublicationProfile + PagedRenderer | `done` | #122 | ✅ **MERGÉ** (2026-06-28) |
| E | **#125** | Remplacer l'export PDF pdf-lib | `done` | #122, #124 | ✅ **MERGÉ** (2026-06-28) |
| F | **#126** | Contenu sémantique + migration | `done` | #124 | ✅ **MERGÉ** (2026-06-28) |
| G | **#127** | Barre d'outils profil-adaptative | `done` | #126 | ✅ **MERGÉ** (2026-06-28) |
| H | **#128** | Surcharges de présentation | `done` | #126 | ✅ **MERGÉ** (2026-06-28) |
| I | **#129** | Sélecteur de profil + bascule à chaud | `done` | #124, #126 | ✅ **MERGÉ** (2026-06-28) |
| J | **#130** | Profils additionnels (A5, Word…) | `ready-for-agent` | #124, #129 | 🔜 **DÉBLOQUÉ** (D+I done) |
| K | **#131** | Marketplaces + preflight | `ready-for-human` | #124, #129 | 🔜 **DÉBLOQUÉ** (humain requis) |
| L | **#132** | Liminaires + TOC | `ready-for-agent` | #124, #125 | 🔜 **DÉBLOQUÉ** (D+E done) |
| M | **#133** | Numérotation livre-entier | `needs-triage` | #125, #132 | ⬜ |
| N | **#134** | Aperçu livre entier | `ready-for-agent` | #125, #133 | ⬜ |
| O | **#135** | IA adaptée au modèle paginé | `ready-for-agent` | #126, #122 | 🔜 **DÉBLOQUÉ** (F+B done) |

> `SPIKE_GREEN` = ✅ (J1 : pixel-diff < 1 % · J2 : 331 ms < 900 ms · Paged.js retenu). Phase 1 débloquée.
> Branche `feat/122-paged-renderer-spike` supprimée le 2026-06-28 (travail dans `main`).

## 0. Étoile polaire (critère de réussite global)

Permettre à l'auteur de **publier sans friction** : un export print-ready (PDF) accepté **du premier coup, zéro aller-retour** par la marketplace cible. Tout arbitrage d'orchestration se tranche en faveur de ce critère.

**État actuel : RIEN n'est implémenté.** Seuls les fichiers de plan et l'ADR existent. Les GitHub issues ne sont **pas encore créées** (attendre validation humaine — voir §6).

---

## 1. Invariants non négociables (valent pour TOUTE tâche)

Un agent qui exécute une issue DOIT respecter, sans exception :

1. **TDD strict** — test rouge écrit AVANT toute implémentation. Chaque issue porte son « Ancre TDD ». Ne jamais supprimer un test parce qu'il échoue ; ne jamais tester uniquement du mock ; pas de mock en E2E. (Mémoire `feedback-tdd-first`.)
2. **ABOUTME** — chaque fichier code commence par 2 lignes `// ABOUTME:` (hook `check-edit`).
3. **Clean Architecture** — Domaine ne dépend de rien ; Application → Domaine ; Infra/Interface → App+Domaine. `PublicationProfile` = value object domaine pur. UI sans logique métier. Repos filtrés par `ownerId`.
4. **Git discipline** — commits fréquents ; jamais `git add .` / `-A` (hook `guard-bash`, stager par nom) ; brancher avant de committer (ne pas committer direct sur `main`) ; jamais `--no-verify` ; `npm run verify` (lint → tests → build) avant tout commit de fin d'étape.
5. **Vocabulaire** — dire **auteur** (jamais « utilisateur/écrivain/user »).
6. **Philosophie produit** — l'IA suggère, l'auteur décide ; toujours offrir des choix ; préserver la voix ; l'auteur possède son texte. Rien qui écrive « à la place » de l'auteur.

---

## 2. Graphe de dépendances (machine-lisible)

Chaque nœud = une issue. `id` = lettre de l'épopée ; `file` = plan ; `deps` = prérequis durs ; `gate` = condition de déblocage ; `actor` = `agent` | `human` ; `phase`.

```yaml
nodes:
  - id: A
    file: 0002-issue-spike-jalon1-parite-statique.md
    title: Spike J1 — parité statique KDP 6×9 (pixel-diff)
    phase: 0
    deps: []
    actor: agent
    label: ready-for-agent
    gate: none            # point d'entrée — démarrer ICI
    exit_proof: pixel-diff éditeur↔PDF sous seuil ; pdf-lib intact ; coutures posées

  - id: B
    file: 0003-issue-spike-jalon2-repagination-vivante.md
    title: Spike J2 — re-pagination vivante (budget perf)
    phase: 0
    deps: [A]
    actor: agent
    label: ready-for-agent
    gate: A_green
    exit_proof: re-pagination à la pause < 900 ms sur ~4000 mots ; caret correct ; verdict consigné dans ADR 0005

  - id: C
    file: 0004-issue-chromium-vercel.md
    title: Déploiement Chromium sur Vercel
    phase: 1
    deps: [A]
    actor: human          # choix infra/coût/billing — préparer POC en agent, trancher en humain
    label: ready-for-human
    gate: SPIKE_GREEN
    exit_proof: PDF KDP généré en preview Vercel identique au spike ; cold start/limites documentés ; décision lib-vs-service consignée

  - id: D
    file: 0005-issue-publicationprofile-pagedrenderer.md
    title: PublicationProfile + PagedRenderer (durcir les coutures)
    phase: 1
    deps: [A]
    actor: agent
    label: needs-triage -> ready-for-agent   # promu au spike vert
    gate: SPIKE_GREEN
    exit_proof: PublicationProfile value object pur ; preset KDP 6×9 == spec DocxExporter ; aperçu+export partagent la même instance ; pixel-diff reste vert

  - id: E
    file: 0006-issue-remplacer-pdf-lib.md
    title: Remplacer l'export PDF pdf-lib (A4) par le moteur paginé
    phase: 1
    deps: [A, D]
    actor: agent
    label: needs-triage -> ready-for-agent
    gate: SPIKE_GREEN and D_done
    exit_proof: export PDF passe par PagedRenderer + profil actif ; parité vérifiée ; DOCX passerelle intact ; tests pdf-lib migrés proprement (jamais supprimés sèchement)

  - id: F
    file: 0007-issue-contenu-semantique-migration.md
    title: Modèle de contenu sémantique + migration
    phase: 2
    deps: [D]
    actor: human          # migration de données de prod = décision humaine sur la stratégie
    label: needs-triage
    gate: D_done and HUMAN_APPROVES_MIGRATION_STRATEGY
    exit_proof: schéma sémantique défini/documenté ; migration idempotente+réversible+testée sur cas réels ; rendu sans perte

  - id: G
    file: 0008-issue-toolbar-profil-adaptative.md
    title: Barre d'outils profil-adaptative
    phase: 2
    deps: [F]
    actor: agent
    label: needs-triage -> ready-for-agent
    gate: F_done
    exit_proof: print-ready = styles sémantiques seuls (pas de police/taille manuelle) ; passerelle réexpose les contrôles ; entrées IA préservées

  - id: H
    file: 0009-issue-surcharges-presentation.md
    title: Couche de surcharges de présentation (passerelle)
    phase: 2
    deps: [F]
    actor: agent
    label: needs-triage -> ready-for-agent
    gate: F_done
    exit_proof: aller-retour passerelle↔strict sans perte ; surcharges en couche séparée non destructive ; contenu sémantique invariant

  - id: I
    file: 0010-issue-selecteur-bascule-profil.md
    title: Sélecteur de profil + bascule à chaud sans perte
    phase: 3
    deps: [D, F]
    actor: agent
    label: needs-triage -> ready-for-agent
    gate: D_done and F_done
    exit_proof: bascule re-rend au bon trim sans perte ni reload ; barre s'adapte ; surcharges dormantes/restaurées ; profil persistant
    note: réutilise les invariants de H (recommandé : H avant I)

  - id: J
    file: 0011-issue-profils-additionnels.md
    title: Profils additionnels (A5, trims KDP, passerelle Word)
    phase: 3
    deps: [D, I]
    actor: agent
    label: ready-for-agent
    gate: D_done and I_done
    exit_proof: chaque profil = donnée déclarative ; parité conservée par profil ; passerelle Word A4 refluable

  - id: K
    file: 0012-issue-profils-marketplaces-preflight.md
    title: Profils marketplaces + preflight zéro-rejet
    phase: 3
    deps: [D, I]
    actor: human          # comptes marketplaces réels + soumissions de validation
    label: ready-for-human
    gate: D_done and I_done
    exit_proof: exigences par plateforme encodées ; preflight bloque/explique les non-conformités ; un export validé est réellement accepté

  - id: L
    file: 0013-issue-liminaires-toc.md
    title: Liminaires + TOC générés
    phase: 4
    deps: [D, E]
    actor: agent
    label: needs-triage -> ready-for-agent
    gate: D_done and E_done
    exit_proof: liminaires+TOC dans aperçu livre-entier et export, hors surface d'écriture ; contenu depuis annexes/métadonnées ; comptés dans la numérotation

  - id: M
    file: 0014-issue-numerotation-livre-entier.md
    title: Numérotation livre-entier (offsets cachés)
    phase: 4
    deps: [E, L]
    actor: agent
    label: needs-triage -> ready-for-agent
    gate: E_done and L_done
    exit_proof: 1ère page d'un chapitre = numéro réel ; cache invalidé au changement amont/profil ; numéro éditeur == numéro export ; perf bornée

  - id: N
    file: 0015-issue-apercu-livre-entier.md
    title: Aperçu « livre entier » continu
    phase: 4
    deps: [E, M]
    actor: agent
    label: ready-for-agent
    gate: E_done and M_done
    exit_proof: aperçu == export (parité) ; navigation fluide sur ~300-400 pages ; liminaires/TOC/numérotation corrects

  - id: O
    file: 0016-issue-ia-adaptee-pagination.md
    title: Adapter l'intégration IA au modèle paginé/sémantique
    phase: 5
    deps: [F, B]
    actor: agent
    label: ready-for-agent
    gate: F_done and B_green
    exit_proof: insertion IA → contenu sémantique ; sélection à travers sauts de page OK ; autocomplétion + re-pagination cohabitent ; aucune régression IA
```

---

## 3. Portes (gates) — sémantique des conditions

| Gate | Vrai quand… |
|---|---|
| `A_green` | l'issue A est mergée ET son test pixel-diff passe |
| `B_green` | l'issue B est mergée ET le budget < 900 ms est tenu (ou fallback décidé+consigné dans ADR 0005) |
| `SPIKE_GREEN` | `A_green` **ET** `B_green` — **macro-porte qui débloque toute la Phase 1+** |
| `X_done` | l'issue X est mergée, ses critères d'acceptation cochés, `npm run verify` vert |
| `HUMAN_APPROVES_MIGRATION_STRATEGY` | décision humaine in-place vs versionnée prise (issue F) |

> **⚠️ Règle d'or n°1 du séquencement :** tant que `SPIKE_GREEN` est faux, **aucune issue de Phase 1-5 ne passe en exécution**. Elles restent `needs-triage`, scope figé mais implémentation non détaillée. **Si le spike échoue (Paged.js ne tient pas), réviser D, E, et toute issue dépendant de la parité avant de continuer** (fallback paginateur ProseMirror custom → rouvre la question de parité d'export).

---

## 4. Plan d'exécution recommandé (ordre topologique)

Vagues parallélisables une fois la porte amont ouverte :

```
Vague 0 (séquentielle, bloquante) :  A → B          [PORTE: SPIKE_GREEN]
Vague 1 :                            D, puis E ; C en parallèle (humain)
Vague 2 :                            F (humain: stratégie) → puis G ∥ H
Vague 3 :                            I (après F) → puis J ∥ K(humain)
Vague 4 :                            L → M → N (séquentiel par dépendance)
Vague 5 :                            O (dès F_done et B_green — peut démarrer tôt)
```

**Notes de parallélisme pour l'orchestrateur :**
- `G` et `H` sont indépendants (tous deux deps=[F]) → parallélisables.
- `J` et `K` sont indépendants (deps=[D,I]) → parallélisables, mais K est `human`.
- `O` ne dépend que de `F` et `B` → peut être lancé dès la Phase 2, en parallèle des Phases 3-4, sans attendre 4.
- `L → M → N` est une **chaîne dure** (chacun dépend du précédent), non parallélisable entre eux.

---

## 5. Protocole d'exécution d'UNE issue (boucle agent)

Pour chaque nœud dont la `gate` est ouverte et `actor: agent` :

1. **Vérifier la porte** : confirmer que tous les `deps` sont `done` et la `gate` vraie. Sinon, ne pas démarrer.
2. **Lire les sources** : le plan de l'issue + l'ADR 0005 + CONTEXT.md (par chemin, ne pas redécouvrir).
3. **Brancher** : `git switch -c feat/<id>-<slug>` depuis `main` à jour.
4. **Skill** : envisager `simple_create_plan_generic` (plan d'implé) puis `tdd-cycle`/`tdd` (exécution). `domain-modeling` si nouveaux termes (maintenir CONTEXT.md).
5. **TDD** : écrire l'ancre TDD (test rouge) → vert → refactor. Commits fréquents, stager par nom.
6. **Vérifier** : `npm run verify` vert + tous les critères d'acceptation du plan cochés + `exit_proof` atteint.
7. **Non-régression transverse** : ré-exécuter le pixel-diff du spike pour toute issue touchant le rendu (D, E, J, L, M, N).
8. **PR** : ouvrir la PR ; ne PAS auto-merger une issue `actor: human` ni rien qui touche données de prod (F) ou comptes externes (C, K) sans validation de Fanfan.
9. **Mettre à jour l'état** : marquer `X_done`, recalculer les portes nouvellement ouvertes, passer à la vague suivante.

---

## 6. Frontières humaines (STOP — demander validation)

L'orchestrateur **ne franchit pas seul** ces points :

- **Création des GitHub issues** : le handoff dit explicitement « produire les fichiers, pas créer les issues ». Attendre le feu vert de Fanfan avant `gh issue create`.
- **C (Vercel)** : choix d'infra/coût/billing sur compte réel.
- **F (migration de données)** : stratégie in-place vs versionnée — risque sur données de prod.
- **K (marketplaces)** : soumissions réelles sur comptes Amazon/BoD/etc.
- **Décision de fallback du spike** : si Paged.js échoue au budget, la bascule vers un paginateur custom est une décision d'architecture à escalader (rouvre la parité).
- **Règle Fanfan** : « propose, puis attends validation » — Fanfan recadre souvent en cours de route. Ne pas sur-spécifier les issues post-spike avant le verdict.

---

## 7. Risques pilotés par l'orchestrateur

| Risque | Où | Parade d'orchestration |
|---|---|---|
| Paged.js trop lent (budget vivant) | B | Gate `B_green` bloque tout ; fallback documenté avant de continuer |
| Chromium serverless ne tient pas | C | Différé hors spike ; preview Vercel avant prod ; décision humaine |
| Flakiness pixel-diff (anti-aliasing) | A, et tout test parité | Même DPR des deux côtés + seuil de tolérance |
| Migration casse des données | F | Idempotente, réversible, testée sur cas réels ; validation humaine |
| Dérive de parité après refactor | D, E, J, L, M, N | Ré-exécuter le pixel-diff du spike en non-régression systématique |
| Sur-spécification prématurée | toutes post-spike | Garder `needs-triage` tant que `SPIKE_GREEN` faux |

---

## 8. Tableau de bord d'état (à tenir à jour par l'orchestrateur)

| Issue | Phase | Gate ouverte ? | Statut | exit_proof atteint ? |
|---|---|---|---|---|
| A (#122 J1) | 0 | ✅ (entrée) | ✅ **done** | ✅ pixel-diff < 1 % |
| B (#122 J2) | 0 | ✅ (A_green) | ✅ **done** | ✅ 331 ms < 900 ms |
| C (#123) | 1 | ✅ (SPIKE_GREEN) | ✅ **done** | ✅ décision @sparticuz/chromium consignée |
| D (#124) | 1 | ✅ (SPIKE_GREEN) | ✅ **done** | ✅ PublicationProfile + PagedRenderer mergés |
| E (#125) | 1 | ✅ (SPIKE_GREEN+D) | ✅ **done** | ✅ PagedPdfExporter mergé ; parité E2E verte ; DOCX intact ; tests pdf-lib conservés |
| F (#126) | 2 | ✅ (D+humain ✅) | ✅ **done** | ✅ schéma + migration + demigrator + script DB + banner ambiguïtés mergés (2026-06-28) |
| G (#127) | 2 | ✅ (F ✅) | ✅ **done** | ✅ barre print-ready/passerelle ; styles sémantiques ; entrées IA préservées |
| H (#128) | 2 | ✅ (F ✅) | ✅ **done** | ✅ couche séparée + API save/load/delete + 49 tests + isolation ownerId |
| I (#129) | 3 | ✅ (D+F ✅) | ✅ **done** | ✅ sélecteur UI + bascule à chaud + surcharges dormantes/restaurées + profil persistant |
| J (#130) | 3 | ✅ (D+I ✅) | 🔜 **DÉBLOQUÉ** | ⬜ |
| K (#131) | 3 | ✅ (D+I ✅) — humain requis | 🔜 **DÉBLOQUÉ** (humain) | ⬜ |
| L (#132) | 4 | ✅ (D+E) | 🔜 **DÉBLOQUÉ** | ⬜ |
| M (#133) | 4 | ⬜ (E+L) | ⬜ todo | ⬜ |
| N (#134) | 4 | ⬜ (E+M) | ⬜ todo | ⬜ |
| O (#135) | 5 | ✅ (F+B ✅) | 🔜 **DÉBLOQUÉ** | ⬜ |

**Prochain pas :** quatre fronts potentiels (I ✅ débloque J+K) :
- **J (#130)** — Profils additionnels A5, trims KDP, passerelle Word (gate ouverte : D+I done ✅ — `actor: agent`)
- **K (#131)** — Marketplaces + preflight zéro-rejet (gate ouverte : D+I done ✅ — `actor: human`, comptes marketplaces réels)
- **L (#132)** — Liminaires + TOC (gate ouverte : D+E done ✅ — débloque M → N)
- **O (#135)** — IA adaptée au modèle paginé (gate ouverte : F+B done ✅ — parallélisable avec J/K et L)
