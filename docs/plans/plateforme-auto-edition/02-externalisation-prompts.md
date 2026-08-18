# 02 — Externaliser les prompts des trois providers

**Dépend de** : rien. **Bloque** : 03, 11, et tout prompt qui varie selon le type de projet.

## Le problème

Les prompts sont codés en dur et dupliqués dans les trois implémentations de
`LLMProvider` :

| Fichier | Lignes |
|---|---|
| `src/infrastructure/ai/AnthropicProvider.ts` | 1816 |
| `src/infrastructure/ai/OpenAIProvider.ts` | 1831 |
| `src/infrastructure/ai/GoogleProvider.ts` | 1697 |

Une partie seulement est externalisée dans `docs/prompt/` via `FilePromptRepository`
(autocomplétion, génération de chapitre, métadonnées).

Conséquence directe : **chaque prompt qui doit varier selon le `ProjectKind` coûte trois
fois son écriture**, et les trois copies divergent à la première correction faite dans
une seule.

## Ce qu'on fait

Étendre le mécanisme qui existe déjà — `FilePromptRepository` lisant `docs/prompt/` —
aux prompts restés inline. C'est un refactor sans changement de comportement : les
prompts sortent des providers, les providers les reçoivent.

Le découpage de `docs/prompt/` prévoit dès maintenant la variation par type de projet,
sans l'utiliser encore :

```
docs/prompt/
  <famille>/
    <prompt>.md            # commun
    <prompt>.fiction.md    # surcharge, si nécessaire
    <prompt>.non-fiction.md
```

La résolution retombe sur le fichier commun quand la surcharge n'existe pas.

## Fichiers touchés

- `src/infrastructure/ai/AnthropicProvider.ts`, `OpenAIProvider.ts`, `GoogleProvider.ts`
  — retirer les gabarits inline
- `src/infrastructure/prompts/FilePromptRepository.ts` — résolution par famille et par
  type de projet
- `src/domain/interfaces/` — le contrat de lecture des prompts si le repository n'en a
  pas encore
- `docs/prompt/**` — les fichiers extraits
- `src/infrastructure/config/providers.ts` — câblage

## Tests à écrire d'abord

1. Chaque prompt extrait est lu depuis son fichier et non depuis le code.
2. La résolution retombe sur le prompt commun quand aucune surcharge de type n'existe.
3. Une surcharge de type, quand elle existe, l'emporte sur le commun.
4. Un fichier de prompt manquant produit une erreur explicite, jamais un prompt vide.
5. **Test de non-régression** : les prompts assemblés par chaque provider sont
   inchangés avant et après extraction. C'est le filet qui rend ce refactor sûr.

## Critère de fin

Aucun gabarit de prompt ne subsiste dans les trois providers. La suite de tests
existante passe sans modification de ses assertions.

## Risques

Les tests d'intégration qui appellent les vraies API (`npm run test:integration`)
touchent ces chemins ; les lancer avant et après.

Les prompts contiennent des accolades et des marqueurs d'interpolation. Extraire sans
convention d'interpolation stricte introduirait des bugs silencieux — définir la
convention avant d'extraire le premier fichier.
