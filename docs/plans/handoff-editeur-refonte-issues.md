# Handoff — Refonte éditeur Revise : établir les fichiers de plan → GitHub issues

> Copie persistée du handoff de session (original généré dans le dossier temp le 2026-06-26).
> Index opérationnel du découpage : voir [`0000-epic-refonte-editeur.md`](0000-epic-refonte-editeur.md).

**Repo** : `C:\Users\François\Desktop\dev\Revise` (branche `main`) · tracker GitHub `francoisnoel62/revise`
**Focus** : établir les fichiers de plan (`docs/plans/`) qui serviront à générer les GitHub issues de la refonte de l'éditeur. **Produire les fichiers, pas (encore) créer les issues.**

---

## 1. Contexte — tout est déjà écrit, ne pas redécouvrir

Design figé lors d'un `/grill-with-docs`. Lire ces artefacts AVANT, ne pas les dupliquer :

- **ADR (décision d'archi)** : `docs/adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md`.
- **Glossaire** : `CONTEXT.md` → section « Mise en page et publication ».
- **Plan détaillé du spike** : `docs/plans/0001-spike-editeur-apercu-kdp-parite-pixel.md`.
- **Mémoire durable** : `~/.claude/projects/.../memory/editor-publication-fidelity-vision.md`.

**Étoile polaire** : permettre au romancier de **publier sans friction** ; un export « KDP ready » accepté **du premier coup, zéro aller-retour**. **Rien n'est implémenté.**

## 2. Conventions repo

- **Tracker** : `gh` CLI (`gh issue create --title ... --body ...`, heredoc). Voir `docs/agents/issue-tracker.md`. Labels : `docs/agents/triage-labels.md` (`ready-for-agent`, `ready-for-human`, `needs-triage`, `needs-info`, `wontfix`).
- **TDD strict** : test rouge d'abord, toujours (mémoire `feedback-tdd-first`). Chaque issue porte son ancre TDD.
- **ABOUTME** en tête de chaque fichier code (hook `check-edit`).
- **Git** : commits fréquents ; jamais `git add .`/`-A` (hook `guard-bash`) ; brancher avant de committer sur `main` ; `npm run verify` avant commit de fin d'étape.
- Clean Architecture ; UI sans logique métier ; profils = value objects domaine. Dire **auteur** (pas « utilisateur/écrivain/user »).

## 3. Repères techniques (déjà investigués)

- Stack : Next 16 / React 19 / TipTap v3 / Tailwind v4 / Vercel. Tests : Vitest + Playwright (`@playwright/test` déjà en devDep).
- PDF actuel : `src/infrastructure/document/exporters/PdfExporter.ts` — figé A4 / Times via `pdf-lib` (à remplacer).
- KDP « ready » actuel = DOCX seul : `src/infrastructure/document/exporters/DocxExporter.ts` — source des constantes KDP 6×9.
- À ajouter pour le moteur : `pagedjs`, police EB Garamond (woff2/ttf) ; tests : `pdfjs-dist`/`pixelmatch`/`pngjs`.
- Éditeur : `src/app/editor/page.tsx`, `src/components/editor/TextEditor.tsx`, `FormattingToolbar.tsx`. CSS page : `src/app/globals.css` (`.editor-a4-page`, `.tiptap`).

## 4. Suggested skills

- **`request-refactor-plan`** — le plus adapté pour transformer un morceau en issue exécutable (petits commits, dépôt en issue).
- **`simple_create_plan_generic`** — plan d'implémentation détaillé d'une issue.
- **`domain-modeling`** — si nouveaux termes (maintenir `CONTEXT.md`).
- **`journal`** — consigner décisions de découpage.
- **`tdd-cycle`/`tdd`** — plus tard, à l'implémentation.

## 5. Pièges & garde-fous

- **Le spike (Phase 0) gate tout le reste.** Garder les issues post-spike *contingentes* à un spike vert ; ne pas sur-spécifier leur implémentation (dépend du verdict Paged.js : parité + budget vivant).
- Ne pas créer les issues sans validation de Fanfan (focus = les fichiers de plan).
- Ne pas redécrire l'ADR/glossaire/plan 0001 — *référencer* par chemin.
- Fanfan recadre souvent en cours de route : proposer, puis attendre validation.
