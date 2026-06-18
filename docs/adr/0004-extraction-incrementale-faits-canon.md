# Extraction incrémentale des faits canon par hash de chapitre

L'extraction complète des faits canon (retraiter tout le manuscrit à chaque fois) est coûteuse en tokens et impraticable sur un déclencheur de fin de session. À l'inverse, ne traiter que les chapitres *nouveaux* manquerait les révisions de chapitres anciens.

Nous adoptons une extraction incrémentale par **hash de chapitre** : chaque chapitre a son propre hash de contenu. À chaque extraction, seuls les chapitres dont le hash a changé (nouveaux ou modifiés) sont retraités. Les faits des chapitres inchangés sont conservés.

La **détection de contradictions** est intégrée à l'extraction : quand le LLM identifie qu'un fait extrait d'un nouveau chapitre invalide une croyance antérieure, il retourne un champ `invalidates` optionnel. Le système pose `validToChapter` sur le fait correspondant. Cela évite les "fantômes" — croyances dépassées qui resteraient actives parce qu'elles viennent d'un chapitre inchangé.

## Considered Options

**Réconciliation LLM post-extraction** — un appel séparé après chaque extraction pour détecter les contradictions. Rejeté : coût supplémentaire et le LLM qui extrait le chapitre courant est mieux placé pour déclarer lui-même ce qu'il invalide, sans avoir besoin de voir l'historique complet.

**Toujours retraiter le manuscrit complet.** Acceptable pour les petits manuscrits, mais impraticable une fois le roman avancé (coût et latence). Le déclencheur de fin de session perdrait son intérêt si chaque exécution coûte autant qu'une extraction initiale.
