// ABOUTME: Lexical thesaurus backed by the JeuxDeMots r_syn index stored in MongoDB
// ABOUTME: Implements the Thesaurus domain interface for zero-token synonym lookup

import { Db, Collection } from 'mongodb';
import { Thesaurus } from '@/domain/interfaces/Thesaurus';

interface JdmDocument {
  _id: string;
  synonyms: string[];
}

export class JeuxDeMotsThesaurus implements Thesaurus {
  private readonly collection: Collection<JdmDocument>;

  constructor(db: Db) {
    this.collection = db.collection<JdmDocument>('jdm_synonyms');
  }

  async lookup(word: string): Promise<string[]> {
    const normalized = word.trim().toLowerCase();
    if (normalized.length === 0) return [];

    const doc = await this.collection.findOne({ _id: normalized });
    return doc?.synonyms ?? [];
  }
}
