<!-- ABOUTME: Feuille de route séquencée pour recentrer l'IA de Revise sur l'autocomplétion littéraire. -->
<!-- ABOUTME: Découle de strategie-autocompletion.md ; la Phase 1 (instrumentation) est détaillée et prête à exécuter. -->

# Roadmap — autocomplétion littéraire

> Découle de [strategie-autocompletion.md](strategie-autocompletion.md) (cap) et de
> [.claude/philosophie.md](../.claude/philosophie.md) (binding).
> **Stratégie : ne pas tout refondre d'un coup.** Construire d'abord une autocomplétion
> *mesurable*, puis déplacer progressivement le centre de gravité IA vers cette interaction.
> Chaque chantier se fait en TDD (skill `tdd-cycle`), avec des tests qui verrouillent les
> invariants produit — pas seulement le câblage.

## Ordre des chantiers

L'ordre suit la priorité réaliste : instrumenter avant de refondre, puis améliorer le cœur,
puis seulement déclasser l'ancien.

### 1. Instrumentation *(chantier en cours — détaillé plus bas)*
Mesurer l'autocomplétion actuelle avant toute modification lourde.

### 2. Nouveau contrat de prompt
Réécrire [docs/prompt/autocompletion.md](prompt/autocompletion.md) : demander la **suite
minimale nécessaire** (pas une suite « créative »), **autoriser le retour vide**, interdire
d'exposer / résumer / résoudre la scène / introduire du canon / changer de point de vue /
forcer une belle phrase ; adapter la forme au contexte (mot, phrase, réplique, paragraphe
court). Retirer la mention `[MÉTADONNÉES]`. Ajouter des tests contractuels de prompt.

### 3. Provider policy basse latence
Corriger l'héritage *reasoning* d'OpenAI : `OpenAIProvider.getTokenLimitParam()` gonfle le
budget de complétion (`max_completion_tokens` ≈ 16k pour les modèles de raisonnement).
Harmoniser « no-thinking + sortie stricte » avec Anthropic (`thinkingBudget: 0`) et Google
(`ThinkingLevel.MINIMAL`). Cible à terme : une `AIOperationPolicy` centrale
(`operation: 'autocomplete'`, `latencyClass: 'realtime'`, `reasoning: 'off'`,
`outputBudget: 'tiny'`, `temperature` basse), pilotant les providers au lieu d'être dupliquée.
Fichiers : `src/infrastructure/ai/{OpenAI,Anthropic,Google}Provider.ts`.

### 4. Acceptation partielle
`src/components/editor/extensions/Autocomplete.ts` : `Tab` = accepter tout, `Ctrl+→` = mot
suivant, `Alt+→` = fragment suivant, `Esc` = rejet, frappe normale = ignore. C'est le plus
gros gain produit perçu — aujourd'hui l'acceptation est tout-ou-rien.

### 5. Contexte dédié à l'autocomplétion
Créer un `AutocompleteContextBuilder` manuscrit-premier, distinct du `projectContext`
générique. Hiérarchie : texte immédiat → paragraphe/scène → chapitre courant → passages
pertinents du manuscrit → docs auteur liés au chapitre → métadonnées **seulement si
explicitement activées**. Sortir les métadonnées dérivées du `buildCompletionContext()` par
défaut. Fichiers : nouveau builder + `src/app/api/completion/stream/route.ts` +
`src/application/services/AIContextBuilder.ts`.

### 6. Silence autorisé de bout en bout
Une chaîne vide doit traverser prompt → providers → route SSE → UI sans être traitée comme
une erreur, et sans rien afficher. Mesurer le taux de silence.

### 7. Variantes discrètes
`AutocompleteIntent = 'natural' | 'shorter' | 'tenser' | 'more_concrete' | 'dialogue'` exposé
comme **action secondaire** quand une suggestion existe — pas de gros menu, l'interface reste
`Tab` en surface.

### 8. Déclassement de la génération de chapitre
Sortir du flux principal `FloatingGenerationMenu.tsx`, `AIMenuDropdown.tsx`,
`CommandPalette.tsx`. Conserver routes et use cases (`GenerateChapterUseCase`,
`chapter-generation-actions.ts`) derrière « expérimental ». Transformer « début de chapitre »
en « continuer depuis le curseur ». Mesurer l'usage réel avant toute suppression.

### 9. Métadonnées hors du chemin chaud
Confirmer que le builder dédié (chantier 5) est prioritaire pour la complétion ;
`AIContextBuilder.buildCompletionContext()` n'est plus le contexte principal d'écriture. Les
métadonnées restent pour cockpit, diagnostic, recherche/navigation, et si éditées/validées par
l'auteur.

### (12) Expérimentation A/B — finition
Comparer : **A** = comportement actuel ; **B** = manuscrit-premier sans métadonnées ;
**C** = B + research docs locaux. Critères : accepté tel quel / partiellement / rejeté /
supprimé après insertion / jugé générique / incohérent / trop long / latence perçue. Les
signaux de la Phase 1 fournissent la base factuelle de cette décision.

---

## Détail — Phase 1 : Instrumentation

**But.** Capturer le cycle de vie réel de chaque suggestion pour pouvoir comparer A/B plus
tard. **Contrainte absolue : aucune modification de l'UX d'écriture.** La télémétrie est
*fire-and-forget* et ne doit jamais bloquer ni ralentir la frappe.

### Signaux à capturer

Chaque suggestion porte un `suggestionId` généré au déclenchement, qui corrèle les events :

| Signal | Origine | Détail |
|---|---|---|
| `triggered` | client | `Tab` pressé, horodatage `t0` |
| `firstTokenMs` | client | t(premier chunk SSE) − t0 — **latence perçue**, ce qui compte pour l'UX |
| `completed` | client | durée totale du stream + longueur finale (mots / caractères) |
| `empty` | client | le modèle n'a rien renvoyé (silence) |
| `accepted_full` | client | 2ᵉ `Tab` (insertion complète) |
| `rejected_escape` | client | `Escape` |
| `superseded_typing` | client | l'auteur tape autre chose → suggestion abandonnée |
| `inserted_then_deleted` | client | texte inséré puis retiré sous N s (p.ex. 30 s) — surveillance post-insertion |
| provider / model | serveur | déjà connus via la couche de suivi |

> Note : l'acceptation **partielle** (mot/fragment) n'existe pas encore (chantier 4). Prévoir
> le schéma d'event pour l'accueillir (`accepted_partial` avec longueur acceptée) sans avoir à
> tout migrer plus tard.

### Où

- **Client** — `src/components/editor/extensions/Autocomplete.ts` : extraire la logique de
  cycle de vie dans un petit émetteur **testable** (pur, sans dépendance ProseMirror), qui
  émet un event à chaque transition. Envoi en lot, non bloquant (pas d'`await` sur le chemin
  de frappe).
- **Persistance** — nouvelle entité domaine `AutocompleteEvent` + repository MongoDB **filtré
  par `ownerId`** (isolation multi-tenant obligatoire), sur le modèle de `AIUsageRecord` /
  `TrackedLLMProvider`. Exposée par une action serveur légère ou un endpoint
  `POST /api/completion/telemetry`.
- **Gain serveur facile** — si peu coûteux, enrichir le suivi existant
  (`TrackedLLMProvider` / `AIUsageRecord`) d'un `firstTokenMs` côté serveur ; sinon, s'en
  tenir à la mesure client (latence perçue, suffisante).

### Ce que ça débloque

Un tableau **p50 / p95** de latence, et les taux d'**acceptation / acceptation partielle (à
venir) / rejet / silence / suppression-après-insertion**. C'est la base factuelle de la
décision A/B (Phase 12), et l'arbitre des questions ouvertes de
[strategie-autocompletion.md](strategie-autocompletion.md) §5.

### TDD

- tests entité + repository (notamment l'**isolation `ownerId`**) ;
- tests de l'endpoint / action de télémétrie ;
- test unitaire de l'émetteur de cycle de vie (transitions correctes : triggered → completed →
  accepted/rejected/superseded, et la fenêtre `inserted_then_deleted`) ;
- pas de mocks en E2E.
