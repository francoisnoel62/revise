// ABOUTME: French morphology backed by the Lexique index stored in MongoDB
// ABOUTME: Lemmatizes inflected forms and re-inflects lemmas for the contextual thesaurus

import { Db, Collection } from 'mongodb';
import { Morphology, MorphInterpretation } from '@/domain/interfaces/Morphology';

interface FormsDocument {
  _id: string;
  interpretations: MorphInterpretation[];
}

interface ConjugationsDocument {
  _id: string;
  forms: { morphs: string[]; ortho: string }[];
}

export class FrenchMorphology implements Morphology {
  private readonly forms: Collection<FormsDocument>;
  private readonly conjugations: Collection<ConjugationsDocument>;

  constructor(db: Db) {
    this.forms = db.collection<FormsDocument>('lexique_forms');
    this.conjugations = db.collection<ConjugationsDocument>('lexique_conjugations');
  }

  async lemmatize(word: string): Promise<MorphInterpretation[]> {
    const normalized = word.trim().toLowerCase();
    if (normalized.length === 0) return [];

    const doc = await this.forms.findOne({ _id: normalized });
    return doc?.interpretations ?? [];
  }

  async inflect(lemma: string, cgram: string, morph: string): Promise<string | null> {
    const key = `${lemma.trim().toLowerCase()}|${cgram}`;
    const doc = await this.conjugations.findOne({ _id: key });
    if (!doc) return null;

    const match = doc.forms.find((form) => form.morphs.includes(morph));
    return match?.ortho ?? null;
  }

  async inflectBatch(
    lemmas: string[],
    cgram: string,
    morph: string
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const suffix = `|${cgram}`;

    const keys = [...new Set(lemmas.map((l) => l.trim().toLowerCase()))]
      .filter((l) => l.length > 0)
      .map((l) => `${l}${suffix}`);
    if (keys.length === 0) return result;

    const docs = await this.conjugations.find({ _id: { $in: keys } }).toArray();
    for (const doc of docs) {
      const match = doc.forms.find((form) => form.morphs.includes(morph));
      if (match) {
        const lemma = doc._id.slice(0, -suffix.length);
        result.set(lemma, match.ortho);
      }
    }
    return result;
  }
}
