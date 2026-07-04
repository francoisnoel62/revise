# Issue — Typographie par niveau de texte (réglable par l'auteur, par profil)

**Phase** 6 · **Dépend de** : `0007` (rôles sémantiques), `0017` (titres depuis le corps, profils figés) · **Interagit avec** : `0019` (invalidation du cache aperçu) · **Label** : `ready-for-agent`
Réfs : [ADR 0005](../adr/0005-editeur-apercu-fidele-moteur-pagine-unique.md), [CONTEXT.md](../../CONTEXT.md).

> **Statut (grillé le 2026-07-04).** Fiche arbitrée en session. Partie « sommaire » scindée dans [`0021`](0021-issue-sommaire-configurable.md). Ici : **uniquement la typographie par niveau**.

## Contexte

La typographie des niveaux de titre est **câblée en dur** dans `BookCssBuilder.ts` (`h1` = 14pt ; `h2` = 12pt depuis le palliatif du 2026-07-04). L'auteur ne peut rien régler. Deux briques rendent la personnalisation **naturelle** :

- **`ProjectSettings`** (`src/domain/entities/ProjectSettings.ts`) est l'entité **par projet, possédée par l'auteur**, qui range déjà le `publicationProfileId` et de nombreuses préférences (autocomplétion, canon, dictionnaire…), avec toute sa plomberie (repo Mongo, use-cases, sérialiseur, formulaire UI) et un patron immuable (`updateXxx()` → nouvelle instance). C'est le **foyer** des styles.
- **`PublicationProfile`** porte déjà la typographie **du corps** (`bodyFontFamily`, `bodyFontSizePoints`, `lineHeight`, `firstLineIndentCentimeters`), lue par `BookCssBuilder`. Les tailles de titres sont les seules **pas encore exposées**.

La couche `PresentationOverride` (par-nœud) ne concerne que `passerelle` ; comme la typographie ci-dessous ne touche que les profils **PDF**, les deux **ne se chevauchent pas**.

## Décisions produit (arbitrées le 2026-07-04, ne pas rouvrir)

1. **Foyer : `ProjectSettings`** (nouveau groupe de réglages), même patron que `autocompletePreferences`/`canonExtraction`. `BookCssBuilder` reçoit ces valeurs **en plus** du profil et les applique **par-dessus** les défauts.
2. **Portée : par profil**, table `{profileId → LevelStyleSet}`, **uniquement pour les profils PDF** (`kdp-6x9`, `a5`). `passerelle`/DOCX est **exclu** (garde le style unique fixé par `0017`). La table est **creuse** : seuls les profils réellement personnalisés ont une entrée ; sinon, défauts.
3. **5 rôles stylables** : `titre-de-chapitre`, `sous-titre`, `corps`, `citation`, `epigraphe` (`separateur-de-scene` exclu, non textuel). Le style s'applique **par rôle sémantique** (`[data-semantic-role="…"]`), **pas** par balise brute (`h1`/`h2`) — fondation durable.
4. **Jeu d'attributs par rôle (riche mais borné, sans couleur)** : **taille** (pt), **graisse** (normal/gras), **italique** (oui/non), **alignement** (gauche/centré/droite/justifié), **interligne**, **espace avant/après** (pt), **police** (parmi les polices **embarquées** : EB Garamond, Arial — pas d'upload libre). **Pas de couleur** (intérieurs KDP souvent N&B — piège d'auto-édition écarté).
5. **Défauts = rendu actuel** : sans réglage, le CSS émis est identique à aujourd'hui (`titre-de-chapitre` 14pt, `sous-titre` 12pt, `corps` depuis le profil…) → **aucune régression** à l'introduction.
6. **Garde-fous : bornes simples par attribut** (clamp) : taille 6–48 pt ; interligne 1,0–3,0 ; espace avant/après 0–200 pt ; graisse/italique/alignement/police = listes fermées (sûres). **Pas** de règle imposée « titre ≥ sous-titre ≥ corps » (trop dirigiste — on protège des valeurs absurdes, pas des choix de goût). Le preflight intelligent relève de `0012`, hors scope.
7. **UI** : panneau d'édition des styles avec **aperçu en direct** (déjà disponible). On édite les styles du **profil actif** du projet (celui prévisualisé).
8. **Invalidation `0019`** : changer un style d'un profil modifie le PDF → invalide **l'entrée de cache `{projet, ce profil}`** (pas les autres profils). Cohérent avec la règle « si ça se voit dans le PDF, c'est dans l'empreinte ».

## Périmètre

**In** : value object `LevelStyleSet` (les 7 attributs, bornes incluses) ; extension de `ProjectSettings` avec une table `{profileId(PDF) → LevelStyleSet}` (+ getter/updater immuables, sérialiseur, migration de lecture tolérante aux absents) ; `BookCssBuilder` lit ces styles et émet le CSS **par rôle sémantique** (défauts = valeurs actuelles) ; panneau UI d'édition avec aperçu live sur le profil actif ; branchement de l'invalidation du cache `0019` sur un changement de style.

**Out** : le sommaire (profondeur + designs) → `0021` ; la couleur ; les polices non embarquées ; les styles par-nœud (déjà `PresentationOverride`/`0009`) ; la typographie de `passerelle`/DOCX ; le preflight (`0012`) ; le palliatif `h2` déjà livré (ici rendu configurable, défaut = palliatif).

## Critères d'acceptation

- [ ] L'auteur règle la typographie **par niveau** (les 5 rôles) et la voit appliquée à tout le manuscrit dans l'aperçu du **profil actif**.
- [ ] Les styles sont stockés dans `ProjectSettings`, **par profil PDF** (`kdp-6x9`, `a5`) ; `passerelle` n'est pas stylable.
- [ ] Le CSS est produit **par rôle sémantique**, pas par balise brute.
- [ ] Sans réglage, le rendu est **identique** à l'actuel (défauts = 14pt/12pt/corps-profil).
- [ ] Chaque attribut est **borné** ; une valeur hors bornes est ramenée dans l'intervalle.
- [ ] Modifier un style **invalide** l'entrée de cache `0019` du profil concerné (pas des autres).

## Ancre TDD

- `LevelStyleSet` : bornes appliquées (valeur hors intervalle → clampée) ; listes fermées rejettent l'invalide.
- `ProjectSettings` : lecture/écriture de la table `{profileId → LevelStyleSet}`, isolée par `ownerId`, tolérante à l'absence (défauts) ; sérialiseur round-trip.
- `BookCssBuilder` : avec des styles fournis, le CSS reflète chaque attribut par rôle sémantique ; sans styles, il émet les défauts actuels (non-régression) ; `sous-titre` reste stylable indépendamment de `titre-de-chapitre`.
- Invalidation `0019` : un changement de style change l'empreinte de cache du profil concerné uniquement.
