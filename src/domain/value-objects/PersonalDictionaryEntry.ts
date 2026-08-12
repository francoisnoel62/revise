// ABOUTME: One word of a project's invented vocabulary, with the nature/gender/number the author declared.
// ABOUTME: Turns a declaration into the flexions a grammar engine needs to judge agreement.

/** What the word is, grammatically — what the engine needs to apply agreement rules. */
export type PersonalDictionaryNature = 'proper-noun' | 'noun' | 'adjective';

export type PersonalDictionaryGender = 'masculine' | 'feminine' | 'epicene';

/**
 * An entry declaring only a word is an entry the author never described: it is
 * still theirs, still listed, still accepted by the spell checker — the grammar
 * engine simply has nothing to reason about.
 */
export interface PersonalDictionaryEntry {
  word: string;
  nature?: PersonalDictionaryNature;
  gender?: PersonalDictionaryGender;
  /** Absent means the word does not vary in number. */
  pluralForm?: string;
}

/** One inflected form the engine can recognise, with its morphology tags. */
export interface PersonalDictionaryFlexion {
  label: string;
  stem: string;
  tags: string;
}

const NATURE_TAGS: Record<PersonalDictionaryNature, string> = {
  'proper-noun': 'M1',
  noun: 'N',
  adjective: 'A',
};

const GENDER_TAGS: Record<PersonalDictionaryGender, string> = {
  masculine: 'm',
  feminine: 'f',
  epicene: 'e',
};

/** Reads an entry from what a project stores — a bare word, or a full declaration. */
export function toPersonalDictionaryEntry(
  value: string | PersonalDictionaryEntry
): PersonalDictionaryEntry {
  const source = typeof value === 'string' ? { word: value } : value;
  const word = source.word.trim();
  if (!word) throw new Error('A dictionary entry cannot be an empty word');

  const pluralForm = source.pluralForm?.trim();

  return {
    word,
    ...(source.nature ? { nature: source.nature } : {}),
    ...(source.gender ? { gender: source.gender } : {}),
    ...(pluralForm && pluralForm !== word ? { pluralForm } : {}),
  };
}

export function personalDictionaryFlexions(
  entry: PersonalDictionaryEntry
): PersonalDictionaryFlexion[] {
  if (!entry.nature) return [];

  const nature = NATURE_TAGS[entry.nature];
  const gender = GENDER_TAGS[entry.gender ?? 'epicene'];

  if (!entry.pluralForm) {
    return [{ label: entry.word, stem: entry.word, tags: `:${nature}:${gender}:i` }];
  }

  return [
    { label: entry.word, stem: entry.word, tags: `:${nature}:${gender}:s` },
    { label: entry.pluralForm, stem: entry.word, tags: `:${nature}:${gender}:p` },
  ];
}
