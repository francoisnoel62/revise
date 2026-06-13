// ABOUTME: Exports for the lexical infrastructure — thesaurus and morphology implementations

import { Db } from 'mongodb';
import { Thesaurus } from '@/domain/interfaces/Thesaurus';
import { JeuxDeMotsThesaurus } from './JeuxDeMotsThesaurus';
import { FrenchMorphology } from './FrenchMorphology';
import { ConjugationAwareThesaurus } from './ConjugationAwareThesaurus';

export { JeuxDeMotsThesaurus } from './JeuxDeMotsThesaurus';
export { FrenchMorphology } from './FrenchMorphology';
export { ConjugationAwareThesaurus } from './ConjugationAwareThesaurus';

// Composes the synonym index with French morphology so conjugated verbs resolve too
export function createThesaurus(db: Db): Thesaurus {
  return new ConjugationAwareThesaurus(
    new JeuxDeMotsThesaurus(db),
    new FrenchMorphology(db)
  );
}
