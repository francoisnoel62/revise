# Issue — Déploiement Chromium sur Vercel

**Phase** 1 · **Dépend de** : Spike J1 (`0002`) · **Label** : `ready-for-human` · **Contingent au spike vert**
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md) (« Différé — risque #1 de prod »).

## Contexte
Le moteur unique génère le PDF via un Chromium headless rendant le même HTML/CSS+Paged.js. En local/CI on utilise Playwright. **En production Vercel (serverless), Chromium ne tient pas tel quel** (taille de fonction, binaire). C'est le risque #1 de mise en production.

## Périmètre
**In** : choisir et mettre en place la stratégie de rendu PDF en prod (`@sparticuz/chromium` + `puppeteer-core` dans une fonction, OU service de rendu dédié, OU Vercel-friendly alternative) ; mesurer cold start, taille, coût, limites.
**Out** : le moteur de pagination lui-même (déjà prouvé au spike).

## Critères d'acceptation
- [ ] Un PDF KDP 6×9 d'un chapitre réel est généré **en environnement de prod** (preview Vercel), identique au rendu du spike.
- [ ] Cold start et limites de taille documentés et acceptables.
- [ ] Décision (lib vs service) tranchée et consignée (ADR ou journal).

## Ancre TDD
Test d'intégration : appeler la voie de génération PDF de prod sur une fixture et asserter un buffer PDF valide + parité (réutiliser le pixel-diff du spike contre le rendu prod).

## Pourquoi `ready-for-human`
Choix d'infra/coût/billing et tests sur compte Vercel réel — décision humaine. Un agent peut préparer le POC, l'humain tranche.
