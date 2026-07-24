# Handoff — Notes de fin (endnotes) pour Revise

**Date :** 2026-07-24
**Repo :** `revise` — branch `main`
**État :** cadrage terminé, tickets créés, **aucun code écrit**.

## Ce qui a été fait

1. Cadrage complet de la fonctionnalité « notes de fin » via `/batch-grill-me` (4 rounds de questions).
2. Spec sauvegardée en mémoire projet.
3. Découpage en 4 tickets vertical-slice (`/to-tickets`), publiés sur GitHub.

## Artefacts existants — NE PAS reproduire, s'y référer

- **Spec complète (source de vérité)** : mémoire projet `footnotes-endnotes-spec.md` (dans `~/.claude/projects/<projet>/memory/`, indexée dans `MEMORY.md`). Contient toutes les décisions figées + les fichiers repérés à toucher.
- **Contexte lié** : mémoires `[[editor-publication-fidelity-vision]]`, `[[reference-pagedjs-counter-quirks]]`, `[[feedback-tdd-first]]`.
- **Tickets GitHub** (repo `francoisnoel62/revise`, label `ready-for-agent`) :
  - #164 — Nœud « note » + insertion éditeur — https://github.com/francoisnoel62/revise/issues/164
  - #165 — Bulle au survol en lecture — https://github.com/francoisnoel62/revise/issues/165
  - #166 — Compilation endnotes export PDF paginé — https://github.com/francoisnoel62/revise/issues/166
  - #167 — Notes de fin natives export DOCX — https://github.com/francoisnoel62/revise/issues/167

## Graphe de dépendances

```
        ┌─→ #165 (bulle lecture)
  #164 ─┤
        └─→ #166 (endnotes PDF) ─→ #167 (endnotes DOCX)
```

## Point de départ pour la prochaine session

**Frontier = #164** (seul ticket débloqué). Commencer par lui.

- Contrainte non négociable du repo : **TDD, test rouge d'abord** (voir `[[feedback-tdd-first]]` et CLAUDE.md).
- Isolation recommandée avant de coder : `git worktree add ../revise-footnotes -b feature/footnotes` puis lancer une session Claude Code dedans (une session par worktree).
- Le détail des critères d'acceptation est dans chaque issue — ne pas le recopier ici.

## Rappels de faits techniques (vérifiés au moment du cadrage, à re-vérifier avant d'affirmer)

- Fonctionnalité **greenfield** : aucun support de note n'existe dans le repo au moment du cadrage.
- Note stockée **inline dans le JSON TipTap** du chapitre (nœud avec `attrs`), pas de nouvelle collection MongoDB.
- Raccourci retenu : **`Ctrl+Alt+N`**. Combinaisons déjà prises à éviter : `Mod-i` (italique), `Mod-k`, `Tab`, `Mod-1..9`, `Mod-Enter`.
- Exportateurs existants : `PagedPdfExporter` (paged.js, cible des endnotes), `DocxExporter` (notes de fin Word natives, #167), `PdfExporter` (hors périmètre).
- Fichiers d'accroche précis listés dans la spec en mémoire (section « Fichiers à toucher »).

## Suggested skills pour la prochaine session

- **`tdd-cycle`** (ou `/tdd`) — obligatoire dès qu'on écrit du code de #164 : test rouge d'abord.
- **`journal`** — chercher le contexte passé avant d'attaquer, et consigner décisions/impasses en cours de route.
- **`simple_create_plan_generic`** ou **`/simple_implement_plan`** — si on veut un plan d'implémentation détaillé de #164 avant de coder.
- **`code-review`** (`/code-review`) — après implémentation d'un ticket, avant PR.
- **`verify`** (`/verify`) — lint → tests → build avant commit.
- **`systematic-debugging`** (`/debug`) — si un comportement casse (une hypothèse à la fois, root cause).
- **`worktree-done`** — pour clôturer proprement la worktree une fois le ticket mergé.
