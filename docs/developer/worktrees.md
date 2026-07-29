# Workflow des worktrees

Un worktree est une tâche de code isolée, pas une seconde copie permanente du projet.

## Règles de travail

- `main` est la voie d'intégration et conserve le port `3000` pour la vérification manuelle.
- Un worktree correspond à une tâche ou une PR. Ne lancez en parallèle que des tâches qui ne modifient pas les mêmes zones de code.
- Toute nouvelle branche part de `origin/main`, jamais du `HEAD` potentiellement ancien du dépôt principal.
- Les secrets restent dans `.env.local` et ne sont jamais versionnés. Le lanceur les copie puis isole la base MongoDB, le port et l'URL locale.
- Rebasez sur `origin/main` juste avant une PR. Supprimez le worktree seulement après le merge ou l'abandon explicite de la tâche.

## Créer une session

Depuis le dépôt principal :

```powershell
.\scripts\new-session.ps1 193-endnotes-panel -BranchType feature
```

Quand le profil PowerShell global est installé, la même commande est disponible sous une forme interactive :

```powershell
cn
```

`cn` choisit le type et le nom de branche, puis délègue au script ci-dessus. Il ne contient aucune logique de création de worktree.

Le lanceur met à jour `origin/main`, crée `feature/193-endnotes-panel`, un dossier frère `Revise-193-endnotes-panel`, puis prépare :

- `.env.local` avec une base MongoDB et un port propres à la tâche ;
- `.worktree.json`, le contrat local qui mémorise ces valeurs ;
- une jonction vers `node_modules` pour éviter une installation complète.

Il lance Claude à la fin. Ajoutez `-NoLaunch` pour préparer seulement le worktree et `-DryRun` pour afficher les valeurs qui seraient choisies sans rien modifier.

## Travailler dans le worktree

```powershell
npm run dev:worktree
npm run worktree -- status
npm run worktree -- finish
```

`dev:worktree` est le seul moyen recommandé de démarrer Next.js dans un worktree : il utilise le port attribué plutôt que `3000`. MongoDB reste un unique conteneur local ; seule la base est isolée.

## Intégrer proprement

```powershell
git fetch origin main
git rebase origin/main
npm run lint
npm test
git push -u origin feature/193-endnotes-panel
```

Ouvrez ensuite la PR. Après merge, utilisez la commande de nettoyage de worktree ; elle ne doit jamais être lancée avant que le travail soit intégrable.
