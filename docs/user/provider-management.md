# Configurer un fournisseur IA

Revise utilise une clé API que vous apportez vous-même (BYOK). L'application prend en charge trois types de fournisseurs : **OpenAI**, **Anthropic** et **Google**. Vous choisissez le fournisseur et le nom exact du modèle pour chaque configuration.

## Avant de commencer

Vous devez disposer :

- d'un compte Revise approuvé ;
- d'une clé API créée auprès du fournisseur choisi ;
- d'une instance Revise configurée avec `ENCRYPTION_KEY`, nécessaire au chiffrement des clés enregistrées.

Revise ne fournit pas de fournisseur par défaut dans le chemin de production. Sans fournisseur configuré, les fonctions IA ne peuvent pas être exécutées ; l'écriture et la gestion des projets restent disponibles.

## Ajouter un fournisseur

1. Connectez-vous puis ouvrez le **tableau de bord**.
2. Ouvrez **Mes providers** depuis le menu utilisateur, ou utilisez l'invite affichée sur le tableau de bord lorsqu'aucun fournisseur n'est configuré.
3. Cliquez sur **Ajouter un fournisseur**.
4. Donnez-lui un nom, choisissez OpenAI, Anthropic ou Google, puis saisissez le nom exact du modèle et votre clé API.
5. Testez la connexion si vous le souhaitez, puis enregistrez.

Le champ du modèle est libre : Revise transmet le nom que vous saisissez au fournisseur. Vérifiez donc l'identifiant et la disponibilité du modèle dans la documentation du fournisseur avant de l'utiliser.

## Utiliser un fournisseur dans un projet

Un projet référence un fournisseur. Vous pouvez donc employer des configurations différentes selon vos projets et les modifier dans les réglages du projet. Les opérations IA suivantes utilisent la configuration du projet : autocomplétion, réécriture, génération, analyses et outils qui y sont associés.

Si le fournisseur ou le modèle refuse une demande, Revise renvoie l'erreur : il ne bascule pas automatiquement vers une clé d'environnement ou un autre fournisseur.

## Tester, modifier ou supprimer

- **Tester** vérifie qu'une requête minimale peut atteindre le fournisseur avec le modèle et la clé saisis. Un test réussi affiche `Connection successful`.
- **Modifier** permet de changer le nom, le modèle ou la clé. La clé est de nouveau chiffrée avant son stockage.
- **Supprimer** efface la configuration. La suppression est refusée tant qu'un ou plusieurs projets l'utilisent ; changez d'abord le fournisseur de ces projets.

Le statut mémorise le résultat du dernier test lorsqu'il existe. Un test reste facultatif : son échec ne transforme pas une clé en donnée publique et ne modifie pas votre manuscrit.

## Sécurité et coûts

Les clés API enregistrées sont chiffrées au repos en AES-256-GCM et l'interface n'affiche qu'une version masquée. Les appels aux fournisseurs passent par le serveur de Revise, jamais directement par le navigateur.

Votre fournisseur API peut facturer son utilisation selon votre compte et son modèle. Revise affiche les données d'usage et de coût qu'il peut déterminer dans le cockpit ; elles restent indicatives et ne remplacent pas le relevé du fournisseur. Consultez sa tarification et configurez ses limites de dépense de votre côté.

## Dépannage

| Situation | À vérifier |
| --- | --- |
| `Connection successful` n'apparaît pas | La clé, le nom exact du modèle, l'accès à ce modèle et l'état du fournisseur. |
| Le test est limité | Attendez avant de relancer ; les tests sont limités par utilisateur. |
| Une opération IA échoue après un test réussi | Les quotas, la disponibilité du modèle, la taille de la demande ou la politique du fournisseur. |
| Impossible de supprimer un fournisseur | Les projets qui le référencent ; attribuez-leur d'abord une autre configuration. |
| Impossible de déchiffrer une clé | La cohérence de `ENCRYPTION_KEY`. Modifier cette clé rend les clés déjà stockées illisibles : recréez alors les fournisseurs concernés. |

## Questions fréquentes

### Puis-je avoir plusieurs fournisseurs ?

Oui. Chaque compte peut enregistrer plusieurs configurations et chaque projet en choisit une.

### Puis-je écrire sans fournisseur IA ?

Oui. Créez, importez, organisez et exportez vos projets normalement ; seules les fonctions qui appellent une IA nécessitent une configuration.

### Ma clé est-elle envoyée au navigateur ?

Non. La clé n'est pas renvoyée en clair par les actions de gestion ; l'interface n'en montre qu'une version masquée.

### Puis-je partager un fournisseur avec un autre compte ?

Non. Les fournisseurs appartiennent au compte qui les a créés.
