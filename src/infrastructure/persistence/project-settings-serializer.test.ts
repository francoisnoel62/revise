// ABOUTME: Tests reading and writing project settings documents, dictionary shapes included.
// ABOUTME: Guards that documents written before words could be declared are still read correctly.

import { ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';
import { ProjectSettings } from '@/domain/entities/ProjectSettings';
import {
  deserializeProjectSettings,
  serializeProjectSettings,
  type ProjectSettingsDocument,
} from './project-settings-serializer';

function documentWith(
  overrides: Partial<ProjectSettingsDocument> = {}
): ProjectSettingsDocument {
  return {
    _id: new ObjectId(),
    projectId: 'project-1',
    ownerId: 'owner-1',
    title: 'Le Cycle de Vhardun',
    summary: '',
    genre: '',
    synopsis: '',
    contributors: [],
    relatedWorks: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    ...overrides,
  };
}

describe('project settings dictionary serialization', () => {
  it('reads a document written before words could be declared', () => {
    const settings = deserializeProjectSettings(
      documentWith({ customDictionary: ['Arrakis', 'spicce'] })
    );

    expect(settings.getCustomDictionary()).toEqual([
      { word: 'Arrakis' },
      { word: 'spicce' },
    ]);
    expect(settings.getGrammarDictionary()).toBeNull();
  });

  it('reads a document mixing bare words and declared ones', () => {
    const settings = deserializeProjectSettings(
      documentWith({
        customDictionary: [
          'Arrakis',
          { word: 'krogan', nature: 'noun', gender: 'masculine', pluralForm: 'krogans' },
        ],
      })
    );

    expect(settings.getCustomDictionary()).toEqual([
      { word: 'Arrakis' },
      { word: 'krogan', nature: 'noun', gender: 'masculine', pluralForm: 'krogans' },
    ]);
  });

  it('writes declarations and the compiled dictionary, and reads them back unchanged', () => {
    const compiled = { sLangCode: 'fr', nEntry: 2 };
    const settings = ProjectSettings.create(
      new ObjectId().toHexString(),
      'project-1',
      'owner-1',
      'Le Cycle de Vhardun'
    ).updateCustomDictionary(
      ['Arrakis', { word: 'krogan', nature: 'noun', gender: 'masculine', pluralForm: 'krogans' }],
      compiled
    );

    const document = serializeProjectSettings(settings);

    expect(document.customDictionary).toEqual([
      { word: 'Arrakis' },
      { word: 'krogan', nature: 'noun', gender: 'masculine', pluralForm: 'krogans' },
    ]);
    expect(document.grammarDictionary).toEqual(compiled);

    const reread = deserializeProjectSettings(document as ProjectSettingsDocument);
    expect(reread.getCustomDictionary()).toEqual(settings.getCustomDictionary());
    expect(reread.getGrammarDictionary()).toEqual(compiled);
  });

  it('leaves a document with no dictionary at all readable', () => {
    const settings = deserializeProjectSettings(documentWith());

    expect(settings.getCustomDictionary()).toEqual([]);
    expect(settings.getGrammarDictionary()).toBeNull();
  });
});
