<!-- ABOUTME: Décision produit/archi — l'autocomplétion littéraire devient la fonctionnalité IA centrale de Revise. -->
<!-- ABOUTME: Manuscrit-premier, génération longue et métadonnées déclassées ; amende strategie-ia-contexte.md §2.4. -->

# Décision — l'autocomplétion au centre de l'IA de Revise

> Statut : adoptée le 2026-06-14. Découle de [.claude/philosophie.md](../.claude/philosophie.md) (binding).
> **Amende** [strategie-ia-contexte.md](strategie-ia-contexte.md) §2.4 (positionnement de la génération).
> Ce document fixe le cap ; la mise en œuvre est séquencée dans [roadmap-autocompletion.md](roadmap-autocompletion.md).

## 1. Principe directeur

> **Revise ne finit pas votre chapitre. Il vous tend la prochaine phrase possible.**

L'autocomplétion littéraire — discrète, manuscrit-premier, contrôlable — devient la
**fonctionnalité IA centrale**. Tout le reste (génération de
chapitre, plans, analyses, métadonnées) est secondaire ou outil de diagnostic. La valeur n'est
pas dans la quantité de texte généré, mais dans la précision d'une aide qui arrive au bon
moment et reste sous le contrôle total de l'auteur.

## 2. Pourquoi (constat)

L'IA actuelle est dispersée vers des « fonctionnalités visibles » : début de chapitre, chapitre
complet, plan, métadonnées injectées partout. À l'usage réel, ces fonctions produisent du texte
*plausible mais peu nécessaire*, interrompent le geste d'écriture, et créent du travail de tri.
Deux racines :

- **Surcharge contextuelle.** Envoyer le manuscrit *plus* des métadonnées dérivées de ce même
  manuscrit transmet deux fois la même information : une fois vivante et précise, une fois
  compressée, interprétée et potentiellement périmée.
- **Fausse autorité des métadonnées.** Une analyse générée n'est qu'une interprétation du texte
  par un modèle à un instant donné. Si elle contredit le manuscrit ou l'intention actuelle de
  l'auteur, elle doit perdre.

## 3. Décisions actées

Chaque décision se rattache à un principe de [philosophie.md](../.claude/philosophie.md).

- **Manuscrit-premier.** Le texte réel est la source de vérité. Les métadonnées dérivées sont
  **déclassées, pas supprimées** : elles servent l'UI, la navigation, l'inspection et le
  diagnostic — **plus** de carburant par défaut des prompts d'écriture. *(Préserver la
  singularité ; transparence.)*
- **Toujours proposer.** Quand l'auteur sollicite la complétion (`Tab`), Revise propose une
  suite — il ne reste pas muet. La qualité se joue sur la pertinence et la longueur de la
  suggestion, pas sur le droit de se taire. *(L'IA suggère, l'auteur décide.)*
- **Déclenchement manuel par défaut.** `Tab` reste le geste. Un auto-déclenchement discret reste
  une option éventuelle, jamais le défaut — pour ne pas polluer l'écriture. *(Pas d'action sans
  décision de l'auteur.)*
- **Acceptation partielle.** L'auteur garde toute la suggestion, un seul mot, ou un fragment.
  *(Toujours offrir des choix ; contrôle.)*
- **Génération longue déclassée.** Chapitre complet / début / plan sortent du flux principal
  (cachés « expérimental »), et seront mesurés avant toute suppression. **Ceci amende §2.4 de
  `strategie-ia-contexte.md`**, qui faisait de la génération fidèle au plan le cœur de
  productivité. L'invariant de cette §2.4 reste vrai : *toute insertion est déclenchée par
  l'auteur, jamais automatique, et le texte reste éditable.* *(Ne pas écrire « à la place ».)*
- **Apprentissage = préférence d'assistance, jamais la voix.** Le système peut apprendre la
  longueur, la fréquence et l'audace de l'aide à partir des acceptations/rejets ; il n'apprend
  **pas** à écrire le style de l'auteur. *(Ne jamais standardiser la voix.)*

Le **contexte intentionnel** (research docs : ce que l'auteur *veut* écrire) reste légitime et
prioritaire sur le contexte dérivé — conformément à `strategie-ia-contexte.md`. Cette décision
ne le débranche pas ; elle déclasse seulement les **métadonnées dérivées** dans le chemin chaud.

## 4. Ce que la décision exclut (anti-produit)

- Tout **bloc long autonome** que l'auteur doit ensuite trier, corriger, désécrire.
- Tout **faux canon** : détails inventés par le modèle et présentés comme établis.
- Toute **insertion sans geste explicite** de l'auteur.
- Toute **barre de commande** qui transforme l'éditeur en chatbot et détourne du geste d'écriture
  (une transformation locale sur sélection, réfutable, reste tolérée).

## 5. Questions ouvertes — tranchées par la mesure, pas par opinion

Délibérément non décidées ici, car elles dépendent de données réelles :

- seuil de latence cible perçue (300 / 500 / 1000 ms au premier token) ;
- raccourcis exacts d'acceptation partielle (mot / fragment) ;
- profondeur d'apprentissage sans lissage de la voix ;
- hiérarchie fine du contexte (scène / paragraphe / chapitre / manuscrit / notes auteur).

C'est précisément pourquoi le **premier chantier est l'instrumentation** : sans mesure, on ne
saura pas si une nouvelle autocomplétion est *réellement* meilleure. Voir
[roadmap-autocompletion.md](roadmap-autocompletion.md).
