// ABOUTME: A real, deliberately faulty literary text used to exercise the grammar corrector end to end.
// ABOUTME: Ships the prose and its known corrections, so the E2E can measure recall on real writing.

/**
 * A page of essayistic prose seeded with the mistakes a French author actually makes:
 * agreement inside long noun phrases, past participles confused with infinitives,
 * `c'est`/`s'est` homophones, missing hyphens. It is deliberately harder than the
 * two-error fixture used by the other grammar specs — real sentences are long, and a
 * corrector that only works on short ones is not much use to a novelist.
 *
 * Held as data rather than a .txt file on purpose: a checked-out text file carries the
 * platform's line endings, and splitting it on a hard-coded '\n' silently collapses the
 * corpus to a single block (see GrammalecteGrammarChecker.test.ts).
 */
export interface CorpusBlock {
  readonly type: 'heading' | 'paragraph';
  readonly text: string;
}

export const HIROSHIMA_TITLE = 'Le second soleil';

export const HIROSHIMA_BLOCKS: readonly CorpusBlock[] = [
  {
    type: 'paragraph',
    text: 'Le 6 août 1945, à 8h15 du matin, le soleil se leva deux fois sur Hiroshima.',
  },
  {
    type: 'paragraph',
    text: "Le premier fût celui de chaque jours ; l'astre indifférent qui éclaire depuis des milliard d'années une planète minuscule dans un bras périphérique de la Voie lactée.",
  },
  {
    type: 'paragraph',
    text: "Le second surgit du coeur des Ténèbre. Pendant une fraction de seconde, une température de plusieurs millions de degré transforma le centre-ville en un four ardant où les corps se vaporisèrent instantanément. Où l'ombre des habitants s'imprimèrent sur les mur de pierre comme des photographie macabre. Dans les jours qui suivirent, une pluie noir et huileuse retomba sur les vivant ; de l'eau mélangé aux cendres de leurs semblables.",
  },
  {
    type: 'paragraph',
    text: "Ce matin là, quelque chose c'est brisé qui ne sera jamais réparer. Non pas seulement des vies, des familles, une ville ; mais une certaine idée que l'humanité se faisaient d'elle même. Le champignon atomique qui c'est élevé au-dessus d'Hiroshima n'était pas qu'un nuage de destruction : c'était le monument funéraire d'une époque, la signature visible d'une rupture irréverssible. Pour la première fois de l'Histoire, une espèce avait acquit les moyens de sa propre extinction.",
  },
  { type: 'paragraph', text: "Et cette espèce, c'était nous." },
  {
    type: 'paragraph',
    text: "Nous avons continuer à vivre, bien sûr. Nous avons reconstruis Hiroshima, signer des traités, érigés des mémoriaux. Nous avons inventé la dissuasion nucléaire et fait de la destruction mutuelle assuré le fondement paradoxale de la paix mondiale. Mais quelque chose dans notre rapport au monde et à nous même avait définitivement changer. Une fissure c'était ouverte dans l'édifice de nos certitudes : une fissure que toute notre ingéniosité humaine n'a jamais put colmater depuis.",
  },
  {
    type: 'paragraph',
    text: "Car Hiroshima n'était pas un accident. Ce n'était pas l'oeuvre de barbares venu d'ailleurs, ni la catastrophe naturel d'un univers indifférent. C'était le produit technologique le plus raffiné de ce que nous appelions le progrès : la physique nucléaire, l'ingénierie de pointe, la logistique militaire, la décision politique délibéré.",
  },
  {
    type: 'paragraph',
    text: "Ce champignon atomique n'était que le fils de la Raison pure, le fruit mûre de l'Arbre de la Connaissance que nous cultivions depuis des siècle. Et c'est précisément cela qui rendaient l'événement si vertigineux : non pas que le mal existait - nous le savions depuis toujours - mais que notre plus haute ambition, notre quête la plus noble de comprendre et de maîtrisé le monde, puisse accouchée d'une telle monstruosité.",
  },
  { type: 'heading', text: 'Les ruines du progrès' },
  {
    type: 'paragraph',
    text: "Pendant trois siècles, l'Occident avait vécu dans la lumière rassurante d'une promesse à la destiné cardinale.",
  },
  {
    type: 'paragraph',
    text: "Quel promesse ? Que demain serais meilleur qu'aujourd'hui, comme aujourd'hui était meilleurs qu'hier. Que la science dissiperais les ténèbres de l'ignorance, que la technique libérerai l'humanité de la servitude du travail, que l'éducation ferait reculé la barbarie, et que les Lumières - ces Lumières que les philosophes du XVIIIe siècle avait allumé contre l'obscurantisme - éclairerais bientôt la Terre entière.",
  },
  {
    type: 'paragraph',
    text: "Le Progrès - le mot en lui même - contenait cette fois : nous avancions, nous montions, nous nous élevions vers un avenir radieu.",
  },
  {
    type: 'paragraph',
    text: "Hiroshima fût le premier coup de tonnerre dans ce ciel si serein ; mais il ne fût pas le derniers. Vingt ans plus tard, les images des camps de la mort de l'Allemagne nazi achevèrent de fracturé la conscience européenne.",
  },
  {
    type: 'paragraph',
    text: "Auschwitz n'était pas un retour de la barbarie primitive : c'était une barbarie industriel, une extermination rationalisé, bureaucratisé, optimisée selon les méthodes de management les plus moderne. Les trains arrivais à l'heure, les registres était tenus avec précision. La mort elle même était produite à la chaîne, avec l'efficacitée que le taylorisme avait enseigné aux usines américaine.",
  },
  {
    type: 'paragraph',
    text: "Hannah Arendt, observant le procès d'Adolf Eichmann à Jérusalem, forgea pour décrire se phénomène un concept qui devait hanté le siècle : la « banalité du mal ».",
  },
  {
    type: 'paragraph',
    text: "Le bourreau n'était pas un monstre, mais un simple fonctionaire. Il ne haïssait pas particulièrement ces victimes : il remplissait des formulaire. La raison administrative, cette raison que Weber avait décrite comme le destin de l'Occident moderne, c'était révélée capable de gérer l'impensable avec la même froideur qu'elle gérait les chemins de fer ou le prélèvement des impôt.",
  },
  {
    type: 'paragraph',
    text: "Puis vins Tchernobyl. Le 26 avril 1986, le réacteur numéro quatre de la centrale nucléaire ukrainienne explosa, projetant dans l'atmosphère un nuage radioactif qui traversa l'Europe en quelque jours.",
  },
  {
    type: 'paragraph',
    text: "Les autorités soviétique mentirent, minimisèrent, évacuèrent trop tard. Des pompier moururent en héros, ignorant la nature de l'ennemi invisible qu'ils combattait. Des enfants jouèrent dans des cours d'école sous une pluie mortel de césium.",
  },
  {
    type: 'paragraph',
    text: "Et le monde découvris que la technologie la plus sophistiqué, celle qui promettait une énergie abondante et propre, pouvait transformé une région entière en espace inhabitable pour des siècles et des siècles ; par la simple conjonction d'une erreur humaine et d'un défaut de conceptions.",
  },
  {
    type: 'paragraph',
    text: "Tchernobyl révéla quelque chose qu'Hiroshima n'avait fait qu'esquisser : le progrès technique n'était pas seulement capable de produire des armes de destruction massive quand nous le décidions ; il pouvait aussi nous échappé, produire des catastrophes que personne n'avaient voulus, engendrer des conséquence que personne ne maîtrisaient.",
  },
  {
    type: 'paragraph',
    text: "La technique était devenue autonome, elle avait sa propre logique, ces propres emballements, ces propres accident. Nous n'en étions plus ses maître, seulement les apprentis sorciers d'un pouvoir qui nous dépassais.",
  },
  {
    type: 'paragraph',
    text: "Aujourd'hui, c'est la planète entière qui porte les stigmate de notre triomphe technologique ; nous avons même un mot pour le désigné : l'Anthropocène.",
  },
  {
    type: 'paragraph',
    text: "Pour la première fois dans l'histoire de la planète, une espèce vivante est devenu une force géologique capable de modifier ses équilibre fondamentaux : le climat, les océans, la biodiversité, les cycles du carbone et de l'azote.",
  },
  {
    type: 'paragraph',
    text: "Et cette force, ce n'est pas la force d'une météorite aveugle ou d'une éruption volcanique : c'est la notre. Nous sommes devenus, par la seul accumulation de nos actes quotidien (conduire, consommé, produire, jeté) les agents d'une transformation planétaire dont personne ne contrôlent le cours.",
  },
];

/**
 * Every mistake the author knows about, as (faulty fragment → corrected fragment).
 *
 * This is the yardstick, not the expectation: no corrector catches all of these, and the
 * E2E asserts a measured floor rather than the full list. Keeping the whole list here —
 * including what is currently missed — is what makes an improvement in recall visible.
 */
export interface KnownMistake {
  readonly wrong: string;
  readonly right: string;
}

export const HIROSHIMA_KNOWN_MISTAKES: readonly KnownMistake[] = [
  { wrong: 'fût celui', right: 'fut celui' },
  { wrong: 'chaque jours', right: 'chaque jour' },
  { wrong: "des milliard d'années", right: "des milliards d'années" },
  { wrong: 'coeur', right: 'cœur' },
  { wrong: 'des Ténèbre', right: 'des Ténèbres' },
  { wrong: 'millions de degré', right: 'millions de degrés' },
  { wrong: 'four ardant', right: 'four ardent' },
  { wrong: 'les mur', right: 'les murs' },
  { wrong: 'des photographie macabre', right: 'des photographies macabres' },
  { wrong: 'pluie noir', right: 'pluie noire' },
  { wrong: 'les vivant', right: 'les vivants' },
  { wrong: 'eau mélangé', right: 'eau mélangée' },
  { wrong: 'Ce matin là', right: 'Ce matin-là' },
  { wrong: "quelque chose c'est brisé", right: "quelque chose s'est brisé" },
  { wrong: 'jamais réparer', right: 'jamais réparé' },
  { wrong: "l'humanité se faisaient", right: "l'humanité se faisait" },
  { wrong: 'd\'elle même', right: "d'elle-même" },
  { wrong: "qui c'est élevé", right: "qui s'est élevé" },
  { wrong: 'irréverssible', right: 'irréversible' },
  { wrong: 'avait acquit', right: 'avait acquis' },
  { wrong: 'avons continuer', right: 'avons continué' },
  { wrong: 'avons reconstruis', right: 'avons reconstruit' },
  { wrong: 'signer des traités', right: 'signé des traités' },
  { wrong: 'érigés des mémoriaux', right: 'érigé des mémoriaux' },
  { wrong: 'destruction mutuelle assuré', right: 'destruction mutuelle assurée' },
  { wrong: 'fondement paradoxale', right: 'fondement paradoxal' },
  { wrong: 'à nous même', right: 'à nous-mêmes' },
  { wrong: 'définitivement changer', right: 'définitivement changé' },
  { wrong: "fissure c'était ouverte", right: "fissure s'était ouverte" },
  { wrong: 'jamais put', right: 'jamais pu' },
  { wrong: "l'oeuvre", right: "l'œuvre" },
  { wrong: 'barbares venu', right: 'barbares venus' },
  { wrong: 'catastrophe naturel', right: 'catastrophe naturelle' },
  { wrong: 'politique délibéré', right: 'politique délibérée' },
  { wrong: 'fruit mûre', right: 'fruit mûr' },
  { wrong: 'des siècle', right: 'des siècles' },
  { wrong: 'cela qui rendaient', right: 'cela qui rendait' },
  { wrong: 'de maîtrisé', right: 'de maîtriser' },
  { wrong: 'puisse accouchée', right: 'puisse accoucher' },
  { wrong: 'destiné cardinale', right: 'destinée cardinale' },
  { wrong: 'Quel promesse', right: 'Quelle promesse' },
  { wrong: 'demain serais', right: 'demain serait' },
  { wrong: 'était meilleurs', right: 'était meilleur' },
  { wrong: 'science dissiperais', right: 'science dissiperait' },
  { wrong: 'technique libérerai', right: 'technique libérerait' },
  { wrong: 'ferait reculé', right: 'ferait reculer' },
  { wrong: 'siècle avait allumé', right: 'siècle avaient allumées' },
  { wrong: 'éclairerais', right: 'éclaireraient' },
  { wrong: 'en lui même', right: 'en lui-même' },
  { wrong: 'contenait cette fois', right: 'contenait cette foi' },
  { wrong: 'avenir radieu', right: 'avenir radieux' },
  { wrong: 'Hiroshima fût', right: 'Hiroshima fut' },
  { wrong: 'il ne fût', right: 'il ne fut' },
  { wrong: 'le derniers', right: 'le dernier' },
  { wrong: 'Allemagne nazi', right: 'Allemagne nazie' },
  { wrong: 'de fracturé', right: 'de fracturer' },
  { wrong: 'barbarie industriel', right: 'barbarie industrielle' },
  { wrong: 'extermination rationalisé', right: 'extermination rationalisée' },
  { wrong: 'bureaucratisé', right: 'bureaucratisée' },
  { wrong: 'les plus moderne', right: 'les plus modernes' },
  { wrong: 'trains arrivais', right: 'trains arrivaient' },
  { wrong: 'registres était', right: 'registres étaient' },
  { wrong: 'mort elle même', right: 'mort elle-même' },
  { wrong: 'efficacitée', right: 'efficacité' },
  { wrong: 'usines américaine', right: 'usines américaines' },
  { wrong: 'se phénomène', right: 'ce phénomène' },
  { wrong: 'devait hanté', right: 'devait hanter' },
  { wrong: 'fonctionaire', right: 'fonctionnaire' },
  { wrong: 'particulièrement ces victimes', right: 'particulièrement ses victimes' },
  { wrong: 'des formulaire', right: 'des formulaires' },
  { wrong: "c'était révélée", right: "s'était révélée" },
  { wrong: 'des impôt', right: 'des impôts' },
  { wrong: 'Puis vins', right: 'Puis vint' },
  { wrong: 'quelque jours', right: 'quelques jours' },
  { wrong: 'autorités soviétique', right: 'autorités soviétiques' },
  { wrong: 'Des pompier', right: 'Des pompiers' },
  { wrong: "qu'ils combattait", right: "qu'ils combattaient" },
  { wrong: 'pluie mortel', right: 'pluie mortelle' },
  { wrong: 'monde découvris', right: 'monde découvrit' },
  { wrong: 'la plus sophistiqué', right: 'la plus sophistiquée' },
  { wrong: 'pouvait transformé', right: 'pouvait transformer' },
  { wrong: 'défaut de conceptions', right: 'défaut de conception' },
  { wrong: 'nous échappé', right: 'nous échapper' },
  { wrong: "personne n'avaient voulus", right: "personne n'avait voulues" },
  { wrong: 'des conséquence', right: 'des conséquences' },
  { wrong: 'personne ne maîtrisaient', right: 'personne ne maîtrisait' },
  { wrong: 'ces propres emballements', right: 'ses propres emballements' },
  { wrong: 'ces propres accident', right: 'ses propres accidents' },
  { wrong: 'ses maître', right: 'ses maîtres' },
  { wrong: 'nous dépassais', right: 'nous dépassait' },
  { wrong: 'les stigmate', right: 'les stigmates' },
  { wrong: 'pour le désigné', right: 'pour le désigner' },
  { wrong: 'est devenu une force', right: 'est devenue une force' },
  { wrong: 'ses équilibre fondamentaux', right: 'ses équilibres fondamentaux' },
  { wrong: "c'est la notre", right: "c'est la nôtre" },
  { wrong: 'la seul accumulation', right: 'la seule accumulation' },
  { wrong: 'actes quotidien', right: 'actes quotidiens' },
  { wrong: 'personne ne contrôlent', right: 'personne ne contrôle' },
];
