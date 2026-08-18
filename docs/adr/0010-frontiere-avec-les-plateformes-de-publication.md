# Frontière avec les plateformes de publication

Le marché visé veut publier « sans friction ». Il faut donc dire jusqu'où va cette
absence de friction, parce que la dernière étape est un piège.

## Trois degrés de liaison, et où nous nous arrêtons

**(a) Aucune liaison — retenu pour la v1.** L'auteur télécharge son PDF et son EPUB
depuis Revise, puis les dépose lui-même sur KDP. C'est le comportement actuel.

**(b) Import manuel — plus tard, porte laissée ouverte.** L'auteur télécharge ses
rapports de ventes en CSV depuis KDP et les dépose dans Revise. Aucune connexion
automatique ; l'auteur reste maître de ce qui circule.

**(c) Connexion automatique au compte KDP — jamais.** Il n'existe **pas d'API publique
KDP**. La seule technique disponible consiste à piloter un navigateur en se faisant
passer pour l'auteur. C'est contraire aux conditions d'utilisation d'Amazon et
l'exposition porte sur le compte KDP de l'utilisateur — c'est-à-dire son revenu. Aucune
version future ne rouvre cette option.

Ce refus est structurant et doit être dit au client : Revise fabrique des fichiers
conformes, il ne se connecte pas à sa place.

## Portée : KDP d'abord, architecture ouverte

La v1 vise **Amazon KDP**. L'outil ne doit pas pour autant être fermé sur KDP :
BoD, Kobo ou une autre plateforme doivent pouvoir s'ajouter sans refonte, si la demande
apparaît. Apple Books est explicitement hors périmètre pour l'instant.

## Un master, des profils de sortie

Un même fichier EPUB **ne passe pas tel quel** partout. Les divergences ne portent
presque pas sur la version de la spécification, mais sur l'enveloppe :

- **Kobo reconvertit** tout ce qu'il reçoit, EPUB compris — le fichier livré au lecteur
  n'est pas celui qui a été soumis. Draft2Digital garantit l'inverse.
- **Google impose le nom du fichier** : le `.epub` doit porter l'ISBN électronique.
- Les plafonds de taille vont de 100 MB (Kobo) à 2 GB (Google), Draft2Digital refusant
  au-delà d'environ 90 MB. **Le plafond exploitable réel est donc ~90 MB.**
- Le budget d'image le plus bas observé est de **2 millions de pixels** par image.
- La couverture est **toujours** un asset séparé, avec des spécifications différentes
  sur chaque plateforme.
- Lulu exige la conformité **EAA et WCAG 2 niveau AA**, et refuse les éléments
  interactifs et les zones à remplir.

Nous produisons donc un **master unique** construit à l'intersection des contraintes —
EPUB 3 reflowable, EPUBCheck v5 sans erreur, UTF-8, archive strictement manifestée,
table de navigation complète, aucune image au-delà de 2 M pixels, poids inférieur à
90 MB — et un **profil de sortie par destination** qui applique le renommage et le
rééchantillonnage nécessaires.

Conséquence sur la fiche produit : une entité canonique plus un `PlatformListing` par
destination. Environ 80 % des champs sont communs ; le reste demande un mapping
(catégories BISAC vers taxonomie cible, casse du titre, mots-clés ordonnés, variantes
de description). **L'ISBN n'est pas un champ mais un champ par (œuvre × format ×
plateforme)** — quatre régimes différents coexistent selon les plateformes.

## Interactivité

« Plus d'interactivité » se limite aux **liens, QR codes et ressources
téléchargeables**. Ce qui vit dans le fichier — formulaires, zones remplissables —
ferme des canaux de distribution ; ce qui pointe vers l'extérieur n'en ferme aucun et
fonctionne aussi bien en imprimé qu'en ebook.

## Fiabilité des faits ci-dessus

L'egress externe était bloqué pour **tous** les domaines pendant la recherche : aucune
page officielle n'a été lue verbatim. Les faits proviennent d'extraits de moteur
restreints aux domaines officiels. La prose est fiable ; **les tableaux n'ont jamais pu
être restitués**. Trois points restent ouverts et sont détaillés dans le PRD : les
tables de marges et de coûts d'impression KDP, deux contradictions internes sur la
version EPUB acceptée (Google, Apple), et un changement de bande tarifaire postérieur à
notre date de connaissance.

**Rien de tout cela ne doit être codé en dur sans revérification** depuis un
environnement à egress ouvert.

## Considered Options

**Un export par plateforme.** Rejeté : une dette qui se multiplie par le nombre de
destinations. Le master plus overlay concentre la complexité en un point.

**Attendre d'avoir les tables KDP pour livrer la prévalidation.** Rejeté : la
prévalidation partielle (fonds perdus, marges extérieures, DPI, polices embarquées,
minimum de pages, taille de fichier) est livrable et utile ; la règle de gouttière
renvoie au calculateur officiel en attendant.

## Liens

- PRD : [plateforme-auto-edition/PRD.md](../plans/plateforme-auto-edition/PRD.md)
- ADR liés : [0007](0007-perimetre-produit-et-revision-philosophie.md),
  [0009](0009-editions-multiples-par-manuscrit.md)
- Chantiers : [06](../plans/plateforme-auto-edition/06-epub.md),
  [08](../plans/plateforme-auto-edition/08-prevalidation-kdp.md),
  [09](../plans/plateforme-auto-edition/09-fiche-produit.md)
