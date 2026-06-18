# Guide des Skills Claude Code — Revise

> Généré le 2026-06-18. Mise à jour : relancer `/setup-matt-pocock-skills` ou éditer manuellement.

---

## 1. Deux familles de commandes

Dans Claude Code, tu as deux sources de commandes `/` qui coexistent :

**`.claude/commands/`** — commandes projet, spécifiques à Revise, commitées dans le repo. Elles connaissent ta stack (Next.js/MongoDB, TipTap, hooks ABOUTME). Exemples : `/verify`, `/debug`, `/commit`, `/review`.

**`.agents/skills/`** — 34+ skills génériques de mattpocock. Ils s'adaptent à tout projet TypeScript en lisant ton `CLAUDE.md` et en explorant le codebase. Invocation identique : `/nom-du-skill`.

**Règle de priorité** : si un skill et une commande projet ont le même nom (ex: `/review`, `/tdd-cycle`), la commande projet gagne.

| Critère | `.claude/commands/` | `.agents/skills/` |
|---|---|---|
| Portée | Spécifique à Revise | Générique, s'adapte |
| Contexte | Connaît ta stack | Explore au démarrage |
| Mise à jour | Tu les maintiens | `npx skills@latest add mattpocock/skills` |
| Priorité | **Gagne** si même nom | Utilisé sinon |

---

## 2. Skills par catégorie

### Engineering

| Skill | But | Exemple Revise |
|---|---|---|
| `/tdd-cycle` | Test rouge en premier, toujours — boucle minimale | Ajouter `chapter.isLocked` → écrire le test dans `ChapterRepository` d'abord |
| `/tdd` | Feature entière behavior par behavior | Implémenter l'autocomplétion littéraire comportement par comportement |
| `/systematic-debugging` | Cause racine, pas le symptôme | Doublons MongoDB pricing → 3 hypothèses testées une par une |
| `/diagnosing-bugs` | Bug difficile : feedback loop en 6 phases d'abord | TipTap freeze sur 50k mots → cas de reproduction minimal avant de théoriser |
| `/review` | Review sur deux axes : standards + conformité spec | Vérifier les `// ABOUTME:`, isolation des layers, conformité à l'issue |
| `/codebase-design` | Vocabulaire pour modules profonds et seams | `ContextBuilder` : module profond ou shallow ? Où placer la couture Application/Infrastructure ? |
| `/design-an-interface` | Générer 3+ designs radicalement différents en parallèle | `LiteraryAutocompletion` : objet vs fonction pure vs hook React |
| `/improve-codebase-architecture` | Rapport HTML des modules trop couplés | GeminiProvider qui leak dans l'Application layer |
| `/resolving-merge-conflicts` | Fusionner en préservant les deux intentions | Merge de `ChapterRepository` modifié des deux côtés |
| `/migrate-to-shoehorn` | Remplacer `as Type` dans les tests par `fromPartial()` | `as Character` → `fromPartial<Character>({...})` |
| `/triage` | Machine à états pour les issues GitHub | needs-triage → needs-info → ready-for-agent → ready-for-human → wontfix |
| `/setup-pre-commit` | Installer Husky + lint-staged + typecheck hooks | S'ajoute aux hooks Claude Code existants dans `.claude/hooks/` |
| `/scaffold-exercises` | Créer des structures d'exercices de cours | Documenter comment étendre Revise avec un nouveau LLMProvider |

### Planning

| Skill | But | Exemple Revise |
|---|---|---|
| `/grilling` | Interview relentless une question à la fois | \"Suggestions inline ou panneau latéral ?\" — stress-teste l'idée avant de coder |
| `/grill-me` | Alias de `/grilling` | Identique |
| `/grill-with-docs` | Grilling + ADRs écrits en direct | Discussion pricing sync → `docs/adr/ADR-042-pricing-sync-strategy.md` produit automatiquement |
| `/to-prd` | Synthèse de la conversation → issue GitHub PRD | Après grilling autocomplétion → issue GitHub avec seams de test identifiés |
| `/to-issues` | PRD → issues indépendantes et verticales | Issue #42 (PRD) → 5 issues atomiques avec dépendances |
| `/request-refactor-plan` | Plan commit-par-commit → issue GitHub | Extraire `PricingQuarantine` → plan de 6 commits atomiques |
| `/decision-mapping` | Idée floue → tickets d'investigation séquencés | \"Graphe de connaissances personnages\" → 3 tickets recherche/prototype/décision |
| `/qa` | Bugs en langage naturel → issues GitHub structurées | \"Les guillemets Word deviennent bizarres\" → Claude pose 2 questions puis crée l'issue |

### Domain

| Skill | But | Exemple Revise |
|---|---|---|
| `/domain-modeling` | Construire et affiner le glossaire ubiquitaire + ADRs | `Chapter` vs `Scene` vs `Section` — qui est quoi dans Revise ? |
| `/ubiquitous-language` | Scanner le codebase → `UBIQUITOUS_LANGUAGE.md` | Ambiguïté `Draft` (chapitre non publié vs suggestion IA) → signalée et résolue |

### Writing

| Skill | But | Exemple Revise |
|---|---|---|
| `/writing-fragments` | Interview → matière brute accumulée dans un `.md` | Article \"pourquoi Revise ne remplace pas la voix\" → fragments bruts |
| `/writing-shape` | Notes brutes → article publié paragraphe par paragraphe | `fragments.md` → article, tu valides chaque paragraphe avant de continuer |
| `/writing-beats` | Article narratif beat par beat, choose-your-own-adventure | Après chaque paragraphe, 3 beats proposés — tu choisis la direction |
| `/edit-article` | Réécrire un brouillon section par section | Améliorer `.claude/philosophie.md`, paragraphes de 240 chars max |

### Meta

| Skill | But | Exemple Revise |
|---|---|---|
| `/ask-matt` | Routeur — je ne sais pas quel skill utiliser | \"Tu debugges, planifies, implémentes ?\" → orienté vers le bon workflow |
| `/handoff` | Compacter la session pour reprendre plus tard | Session à mi-chemin → fichier handoff, agent frais reprend exactement là |
| `/journal` | Insights et décisions datés dans `docs/journal/` | \"Gemini compte les tokens par octet, Claude par caractère Unicode\" |
| `/teach` | Tutoring progressif sur plusieurs sessions avec leçons HTML | \"Apprends-moi la Clean Architecture en TypeScript\" avec exemples Revise |
| `/prototype` | Prototype jetable pour tester une idée rapidement | Machine à états TipTap : tester les transitions avant de coder |
| `/git-guardrails-claude-code` | Bloquer `git push --force`, `reset --hard`, `branch -D` | Hook PreToolUse qui intercepte avant exécution |
| `/obsidian-vault` | Créer et organiser des notes dans ton vault Obsidian | `[[Revise - Philosophie]]` lié à `[[Voice Preservation]]` |
| `/writing-great-skills` | Guide pour écrire de bons skills | Écrire un skill custom `/revise-voice-check` |
| `/setup-matt-pocock-skills` | Configuration initiale (une seule fois) | Déjà fait — issue tracker, labels, domain doc configurés |

---

## 3. Workflows complets

### Workflow A — Bug découvert en prod

**Scénario** : des utilisateurs signalent que l'éditeur TipTap perd le curseur après une suggestion IA.

```
1. Décrire le bug en une phrase dans Claude Code

2. /systematic-debugging
   → Claude construit le feedback loop minimal (ouvrir, déclencher, observer console)
   → Émet 3-5 hypothèses dans l'ordre de probabilité
   → Teste une hypothèse à la fois avec des logs ciblés
   → Trouve la cause racine

3. /tdd-cycle
   → Écrire le test de régression qui reproduit le bug (rouge)
   → Fix minimal (vert)
   → Refactor si nécessaire

4. /journal
   → Capturer l'insight pour les sessions futures

5. commit : fix: <description de la cause racine, pas du symptôme>
```

---

### Workflow B — Nouvelle feature de A à Z

**Scénario** : implémenter l'autocomplétion littéraire (3 suggestions dans le style de l'auteur).

```
1. /grilling
   → \"Suggestions inline ou panneau latéral ?\"
   → \"Comment mesures-tu que le style est préservé ?\"
   → Continuer jusqu'à ce que toutes les hypothèses soient résolues

2. /to-prd
   → Synthèse de la conversation → issue GitHub avec Problem Statement,
     User Stories, Implementation Decisions, Testing Decisions, Out of Scope

3. /to-issues #<numéro du PRD>
   → PRD → 5-6 issues indépendantes avec dépendances correctes

4. Pour chaque issue :
   /tdd-cycle
   → test rouge → implémentation minimale → vert → refactor → commit

5. /review HEAD~N
   → Vérifier les ABOUTME:, l'isolation des layers, la conformité à la spec

6. PR + merge
```

---

### Workflow C — Ticket vague

**Scénario** : ta to-do dit \"améliorer les métadonnées des personnages\". C'est tout.

```
1. /decision-mapping
   → Ticket 1 : \"Que propose le modèle actuel ? Que manque-t-il ?\" (Research)
   → Ticket 2 : \"Tester un formulaire avec 5 nouveaux champs\" (Prototype)
   → Ticket 3 : \"Décider du schéma MongoDB pour les métadonnées extensibles\" (Decision)

2. Résoudre les tickets de recherche un par un
   → Claude explore src/domain/, lit les ADRs existants

3. /grill-with-docs
   → \"Est-ce que la `voice` d'un personnage peut influencer les suggestions IA dans ses dialogues ?\"
   → Les décisions cristallisent en ADRs écrits en direct

4. /to-prd → /to-issues → /tdd-cycle
   → Le ticket vague est maintenant un ensemble d'issues claires
```

---

### Workflow D — Refactor propre

**Scénario** : la logique de quarantaine des clés pricing est éparpillée et difficile à tester.

```
1. /improve-codebase-architecture
   → Rapport HTML des modules superficiels et dépendances problématiques
   → Identifier le module à refactorer

2. /request-refactor-plan
   → Interview : \"Quelle est l'interface idéale ? Qu'est-ce qui reste en place ?\"
   → Plan publié comme issue GitHub :
     commit 1 : tests de caractérisation sur le comportement actuel
     commit 2 : extraire l'interface PricingQuarantine
     commit 3 : déplacer la logique dans PricingQuarantineService
     commit 4 : supprimer le code dupliqué
     commit 5 : fix du bug maintenant visible
     commit 6 : tests sur les cas limites

3. Pour chaque commit planifié :
   /tdd-cycle
   → tous les tests verts à chaque commit, sans exception

4. /review HEAD~6
   → Vérifier que l'interface est profonde, les layers respectés, les ABOUTME: présents

5. Si merge conflicts :
   /resolving-merge-conflicts
```

---

### Workflow E — Vision long terme du domaine

**Scénario** : formaliser le langage et les invariants de Revise pour guider les prochains mois.

```
1. /ubiquitous-language
   → Scanner src/domain/, les types TypeScript, les commentaires ABOUTME:
   → Produire UBIQUITOUS_LANGUAGE.md
   → Signaler les ambiguïtés (ex: \"Draft\" utilisé dans deux sens)

2. /domain-modeling
   → Challenger chaque terme flou
   → \"Un Project peut-il avoir plusieurs Voice ?\"
   → \"Une Suggestion appartient à un Chapter ou à une CursorPosition ?\"
   → CONTEXT.md mis à jour au fur et à mesure

3. /grill-with-docs
   → \"Que se passe-t-il si l'auteur modifie rétrospectivement un événement canon ?\"
   → \"Est-ce que l'IA peut changer le Canon sans que l'auteur le réalise ?\"
   → ADRs écrits en direct : ADR-001-voice-immutability.md, etc.

4. /decision-mapping
   → Roadmap de recherche pour les prochaines features IA

5. /journal
   → Capturer les invariants clés découverts dans la session
```

---

## 4. Mémo rapide

```
ENGINEERING
───────────────────────────────────────────────────────────────
/tdd-cycle           Test rouge en premier, toujours
/tdd                 Feature complète behavior par behavior
/systematic-debugging Cause racine, pas le symptôme
/diagnosing-bugs     Bug difficile : feedback loop d'abord
/review              Standards + conformité spec, en parallèle
/codebase-design     Vocabulaire modules profonds / seams
/design-an-interface 3+ designs différents en parallèle
/improve-codebase-architecture Rapport HTML des modules couplés
/resolving-merge-conflicts Préserver les deux intentions
/migrate-to-shoehorn as Type → fromPartial() dans les tests
/triage              needs-triage → ready-for-agent → wontfix

PLANNING
───────────────────────────────────────────────────────────────
/grilling            Interview relentless une question à la fois
/grill-me            Alias de /grilling
/grill-with-docs     Grilling + ADRs produits en direct
/to-prd              Conversation → issue GitHub PRD structuré
/to-issues           PRD → issues indépendantes verticales
/request-refactor-plan Plan commit-par-commit → issue GitHub
/decision-mapping    Idée floue → tickets séquencés
/qa                  Bugs en langage naturel → issues GitHub

DOMAIN
───────────────────────────────────────────────────────────────
/domain-modeling     Glossaire ubiquitaire + ADRs
/ubiquitous-language Extraire termes → UBIQUITOUS_LANGUAGE.md

WRITING
───────────────────────────────────────────────────────────────
/writing-fragments   Interview → matière brute dans un .md
/writing-shape       Notes → article paragraphe par paragraphe
/writing-beats       Article narratif beat par beat
/edit-article        Réécrire un brouillon section par section

META
───────────────────────────────────────────────────────────────
/ask-matt            Routeur : quel skill utiliser ?
/handoff             Compacter la session pour reprendre
/journal             Insights/décisions dans docs/journal/
/teach               Tutoring progressif avec leçons HTML
/prototype           Prototype jetable pour tester une idée
/git-guardrails-claude-code Bloquer les commandes git dangereuses
/obsidian-vault      Notes dans ton vault Obsidian
/writing-great-skills Guide pour écrire de bons skills

RÈGLES D'OR
───────────────────────────────────────────────────────────────
1. TOUJOURS test rouge avant le code
2. JAMAIS fixer un symptôme sans trouver la cause racine
3. /grilling avant de coder quoi que ce soit de non-trivial
4. /handoff si la session se termine à mi-chemin
5. /journal quand tu apprends quelque chose d'important

CHAÎNAGES FRÉQUENTS
───────────────────────────────────────────────────────────────
Bug prod     → /systematic-debugging → /tdd-cycle → /journal
Nouvelle feature → /grilling → /to-prd → /to-issues → /tdd-cycle → /review
Ticket vague → /decision-mapping → /grill-with-docs → /to-prd → /tdd-cycle
Refactor     → /improve-codebase-architecture → /request-refactor-plan → /tdd-cycle → /review
Vision domaine → /ubiquitous-language → /domain-modeling → /grill-with-docs → /journal
```
