// ABOUTME: Tests for ProjectSettings entity
// ABOUTME: Verifies project settings creation, validation, and immutable updates

import { describe, it, expect } from 'vitest';
import { ProjectSettings, ProjectSettingsProperties } from '../ProjectSettings';
import { Contributor } from '@/domain/value-objects/Contributor';
import { RelatedWork } from '@/domain/value-objects/RelatedWork';
import { DEFAULT_CANON_EXTRACTION_PREFERENCES } from '@/domain/value-objects/CanonExtractionPreferences';
import { DEFAULT_TOC_PREFERENCES } from '@/domain/value-objects/TocPreferences';

describe('ProjectSettings', () => {
  const validProps: ProjectSettingsProperties = {
    id: 'settings-123',
    projectId: 'project-456',
    ownerId: 'owner-789',
    title: 'My Novel',
    subtitle: 'A Subtitle',
    summary: 'A brief summary of the book',
    coverImageUrl: 'https://example.com/cover.jpg',
    genre: 'Fantasy',
    synopsis: 'A longer synopsis of the story',
    pointOfView: 'first_person',
    tense: 'past',
    targetAudience: 'adult',
    isbn: '978-3-16-148410-0',
    contributors: [{ name: 'John Doe', role: 'author' }],
    relatedWorks: [{ title: 'Previous Book', projectId: 'proj-111' }],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  describe('create', () => {
    it('creates a new project settings with required fields', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'My Title');

      expect(settings.getId()).toBe('id-1');
      expect(settings.getProjectId()).toBe('proj-1');
      expect(settings.getOwnerId()).toBe('owner-1');
      expect(settings.getTitle()).toBe('My Title');
      expect(settings.getSubtitle()).toBeUndefined();
      expect(settings.getSummary()).toBe('');
      expect(settings.getCoverImageUrl()).toBeUndefined();
      expect(settings.getGenre()).toBe('');
      expect(settings.getSynopsis()).toBe('');
      expect(settings.getPointOfView()).toBeUndefined();
      expect(settings.getTense()).toBeUndefined();
      expect(settings.getTargetAudience()).toBeUndefined();
      expect(settings.getIsbn()).toBeUndefined();
      expect(settings.getContributors()).toEqual([]);
      expect(settings.getRelatedWorks()).toEqual([]);
      expect(settings.getCreatedAt()).toBeInstanceOf(Date);
      expect(settings.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('trims whitespace from title', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', '  My Title  ');
      expect(settings.getTitle()).toBe('My Title');
    });

    it('throws error for empty id', () => {
      expect(() => ProjectSettings.create('', 'proj-1', 'owner-1', 'Title')).toThrow('Project settings ID cannot be empty');
    });

    it('throws error for empty projectId', () => {
      expect(() => ProjectSettings.create('id-1', '', 'owner-1', 'Title')).toThrow('Project ID cannot be empty');
    });

    it('throws error for empty ownerId', () => {
      expect(() => ProjectSettings.create('id-1', 'proj-1', '', 'Title')).toThrow('Owner ID cannot be empty');
    });

    it('throws error for empty title', () => {
      expect(() => ProjectSettings.create('id-1', 'proj-1', 'owner-1', '')).toThrow('Project title cannot be empty');
    });
  });

  describe('reconstruct', () => {
    it('reconstructs from properties', () => {
      const settings = ProjectSettings.reconstruct(validProps);

      expect(settings.getId()).toBe('settings-123');
      expect(settings.getProjectId()).toBe('project-456');
      expect(settings.getOwnerId()).toBe('owner-789');
      expect(settings.getTitle()).toBe('My Novel');
      expect(settings.getSubtitle()).toBe('A Subtitle');
      expect(settings.getSummary()).toBe('A brief summary of the book');
      expect(settings.getCoverImageUrl()).toBe('https://example.com/cover.jpg');
      expect(settings.getGenre()).toBe('Fantasy');
      expect(settings.getSynopsis()).toBe('A longer synopsis of the story');
      expect(settings.getPointOfView()).toBe('first_person');
      expect(settings.getTense()).toBe('past');
      expect(settings.getTargetAudience()).toBe('adult');
      expect(settings.getIsbn()).toBe('978-3-16-148410-0');
      expect(settings.getContributors()).toEqual([{ name: 'John Doe', role: 'author' }]);
      expect(settings.getRelatedWorks()).toEqual([{ title: 'Previous Book', projectId: 'proj-111' }]);
    });
  });

  describe('update methods', () => {
    it('stores an editable grammar rule profile for fiction without mutating the original', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'My Title');

      expect(settings.getGrammarRuleProfile()).toMatchObject({
        gn: true,
        conj: true,
        conf: true,
        poncfin: true,
        typo: false,
        chim: false,
      });

      const updated = settings.updateGrammarRuleProfile({
        ...settings.getGrammarRuleProfile(),
        conf: false,
      });

      expect(updated.getGrammarRuleProfile().conf).toBe(false);
      expect(settings.getGrammarRuleProfile().conf).toBe(true);
    });

    it('persists the active publication profile with a KDP default', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'My Title');

      expect(settings.getPublicationProfileId()).toBe('kdp-6x9');
      expect(settings.updatePublicationProfile('passerelle').getPublicationProfileId()).toBe(
        'passerelle'
      );
      expect(settings.getPublicationProfileId()).toBe('kdp-6x9');
    });

    it('updateTitle returns new instance with updated title', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updateTitle('New Title');

      expect(updated.getTitle()).toBe('New Title');
      expect(settings.getTitle()).toBe('My Novel'); // Original unchanged
      expect(updated.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(settings.getUpdatedAt().getTime());
    });

    it('updateTitle throws for empty title', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      expect(() => settings.updateTitle('')).toThrow('Project title cannot be empty');
    });

    it('updateSubtitle returns new instance', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updateSubtitle('New Subtitle');

      expect(updated.getSubtitle()).toBe('New Subtitle');
      expect(settings.getSubtitle()).toBe('A Subtitle');
    });

    it('updateSubtitle accepts undefined', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updateSubtitle(undefined);

      expect(updated.getSubtitle()).toBeUndefined();
    });

    it('updateSummary returns new instance', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updateSummary('New summary');

      expect(updated.getSummary()).toBe('New summary');
    });

    it('updateCoverImageUrl returns new instance', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updateCoverImageUrl('https://new-url.com/cover.png');

      expect(updated.getCoverImageUrl()).toBe('https://new-url.com/cover.png');
    });

    it('updateCoverImageUrl accepts undefined', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updateCoverImageUrl(undefined);

      expect(updated.getCoverImageUrl()).toBeUndefined();
    });

    it('updateGenre returns new instance', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updateGenre('Science Fiction');

      expect(updated.getGenre()).toBe('Science Fiction');
    });

    it('updateSynopsis returns new instance', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updateSynopsis('A new synopsis');

      expect(updated.getSynopsis()).toBe('A new synopsis');
    });

    it('updatePointOfView returns new instance', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updatePointOfView('third_person_omniscient');

      expect(updated.getPointOfView()).toBe('third_person_omniscient');
    });

    it('updatePointOfView accepts undefined', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updatePointOfView(undefined);

      expect(updated.getPointOfView()).toBeUndefined();
    });

    it('updateTense returns new instance', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updateTense('present');

      expect(updated.getTense()).toBe('present');
    });

    it('updateTense accepts undefined', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updateTense(undefined);

      expect(updated.getTense()).toBeUndefined();
    });

    it('updateTargetAudience returns new instance', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updateTargetAudience('young_adult');

      expect(updated.getTargetAudience()).toBe('young_adult');
    });

    it('updateTargetAudience accepts undefined', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updateTargetAudience(undefined);

      expect(updated.getTargetAudience()).toBeUndefined();
    });

    it('updateIsbn returns new instance', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updateIsbn('978-0-13-468599-1');

      expect(updated.getIsbn()).toBe('978-0-13-468599-1');
    });

    it('updateIsbn accepts undefined', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updateIsbn(undefined);

      expect(updated.getIsbn()).toBeUndefined();
    });

    it('getEndnotesTitle defaults to « Notes » when unset', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      expect(settings.getEndnotesTitle()).toBe('Notes');
    });

    it('updateEndnotesTitle returns a new instance with the trimmed title', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const updated = settings.updateEndnotesTitle('  Références  ');

      expect(updated.getEndnotesTitle()).toBe('Références');
      expect(settings.getEndnotesTitle()).toBe('Notes');
    });

    it('updateEndnotesTitle with an empty value falls back to the default', () => {
      const settings = ProjectSettings.reconstruct(validProps).updateEndnotesTitle('Autre');
      const cleared = settings.updateEndnotesTitle('   ');

      expect(cleared.getEndnotesTitle()).toBe('Notes');
    });

    it('updateContributors returns new instance', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const newContributors: Contributor[] = [
        { name: 'Jane Doe', role: 'editor' },
        { name: 'Bob Smith', role: 'illustrator' },
      ];
      const updated = settings.updateContributors(newContributors);

      expect(updated.getContributors()).toEqual(newContributors);
      expect(settings.getContributors()).toEqual([{ name: 'John Doe', role: 'author' }]);
    });

    it('updateRelatedWorks returns new instance', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const newWorks: RelatedWork[] = [
        { title: 'Sequel', projectId: 'proj-222' },
      ];
      const updated = settings.updateRelatedWorks(newWorks);

      expect(updated.getRelatedWorks()).toEqual(newWorks);
      expect(settings.getRelatedWorks()).toEqual([{ title: 'Previous Book', projectId: 'proj-111' }]);
    });
  });

  describe('toProperties', () => {
    it('returns all properties', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const props = settings.toProperties();

      expect(props).toMatchObject({
        ...validProps,
        customDictionary: [],
        ignoredWords: [],
        publicationProfileId: 'kdp-6x9',
        grammarRuleProfile: expect.objectContaining({ gn: true }),
      });
    });

    it('returns a copy of arrays', () => {
      const settings = ProjectSettings.reconstruct(validProps);
      const props = settings.toProperties();

      props.contributors.push({ name: 'New', role: 'other' });
      expect(settings.getContributors()).toEqual([{ name: 'John Doe', role: 'author' }]);
    });
  });

  describe('getCanonExtractionPreferences', () => {
    it('returns defaults when no mode stored', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'My Novel');
      expect(settings.getCanonExtractionPreferences()).toEqual(DEFAULT_CANON_EXTRACTION_PREFERENCES);
    });

    it('returns stored mode when set', () => {
      const settings = ProjectSettings.reconstruct({
        ...validProps,
        canonExtractionMode: 'session-end',
      });
      expect(settings.getCanonExtractionPreferences().mode).toBe('session-end');
    });
  });

  describe('updateCanonExtractionPreferences', () => {
    it('returns new instance with updated mode', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'My Novel');
      const updated = settings.updateCanonExtractionPreferences({ mode: 'session-end' });

      expect(updated.getCanonExtractionPreferences().mode).toBe('session-end');
      expect(settings.getCanonExtractionPreferences().mode).toBe('manual');
    });

    it('preserves other prefs when updating partial', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'My Novel');
      const updated = settings.updateCanonExtractionPreferences({ mode: 'manual' });

      expect(updated.getCanonExtractionPreferences()).toEqual(DEFAULT_CANON_EXTRACTION_PREFERENCES);
    });
  });

  describe('getTocPreferences', () => {
    it('returns defaults when nothing stored (current rendered behavior)', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'My Novel');
      expect(settings.getTocPreferences()).toEqual(DEFAULT_TOC_PREFERENCES);
    });

    it('returns stored depth and style when set', () => {
      const settings = ProjectSettings.reconstruct({
        ...validProps,
        tocDepth: 'chapters-and-subtitles',
        tocStyle: 'litteraire',
      });
      expect(settings.getTocPreferences()).toEqual({
        depth: 'chapters-and-subtitles',
        style: 'litteraire',
      });
    });
  });

  describe('updateTocPreferences', () => {
    it('returns a new instance with updated depth and style', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'My Novel');
      const updated = settings.updateTocPreferences({ depth: 'chapters-and-subtitles', style: 'epure' });

      expect(updated.getTocPreferences()).toEqual({ depth: 'chapters-and-subtitles', style: 'epure' });
      expect(settings.getTocPreferences()).toEqual(DEFAULT_TOC_PREFERENCES);
    });

    it('preserves the other setting when updating partially', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'My Novel')
        .updateTocPreferences({ depth: 'chapters-and-subtitles', style: 'classique' });

      const updated = settings.updateTocPreferences({ style: 'litteraire' });

      expect(updated.getTocPreferences()).toEqual({ depth: 'chapters-and-subtitles', style: 'litteraire' });
    });
  });

  describe('getCreatedAt and getUpdatedAt', () => {
    it('returns copies of dates', () => {
      const settings = ProjectSettings.reconstruct(validProps);

      const createdAt = settings.getCreatedAt();
      const updatedAt = settings.getUpdatedAt();

      createdAt.setFullYear(2000);
      updatedAt.setFullYear(2000);

      expect(settings.getCreatedAt().getFullYear()).toBe(2024);
      expect(settings.getUpdatedAt().getFullYear()).toBe(2024);
    });
  });

  describe('ignoredWords', () => {
    it('defaults to an empty array when not provided', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'Title');
      expect(settings.getIgnoredWords()).toEqual([]);
    });

    it('reconstructs with provided ignoredWords', () => {
      const settings = ProjectSettings.reconstruct({
        ...validProps,
        ignoredWords: ['gonna', 'ouais'],
      });
      expect(settings.getIgnoredWords()).toEqual(['gonna', 'ouais']);
    });

    it('getIgnoredWords returns a copy (mutation-safe)', () => {
      const settings = ProjectSettings.reconstruct({ ...validProps, ignoredWords: ['gonna'] });
      settings.getIgnoredWords().push('mutated');
      expect(settings.getIgnoredWords()).toEqual(['gonna']);
    });

    it('addIgnoredWord returns a new instance with the word appended', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'Title');
      const updated = settings.addIgnoredWord('gonna');
      expect(updated).not.toBe(settings);
      expect(updated.getIgnoredWords()).toEqual(['gonna']);
      expect(settings.getIgnoredWords()).toEqual([]);
    });

    it('addIgnoredWord is idempotent when word already present', () => {
      const settings = ProjectSettings.reconstruct({ ...validProps, ignoredWords: ['gonna'] });
      const updated = settings.addIgnoredWord('gonna');
      expect(updated).toBe(settings);
    });

    it('addIgnoredWord throws for an empty word', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'Title');
      expect(() => settings.addIgnoredWord('')).toThrow('Word cannot be empty');
    });

    it('removeIgnoredWord returns a new instance without the word', () => {
      const settings = ProjectSettings.reconstruct({ ...validProps, ignoredWords: ['gonna', 'ouais'] });
      const updated = settings.removeIgnoredWord('gonna');
      expect(updated.getIgnoredWords()).toEqual(['ouais']);
      expect(settings.getIgnoredWords()).toEqual(['gonna', 'ouais']);
    });

    it('removeIgnoredWord is a no-op when word is not present', () => {
      const settings = ProjectSettings.reconstruct({ ...validProps, ignoredWords: ['gonna'] });
      const updated = settings.removeIgnoredWord('absent');
      expect(updated).toBe(settings);
    });

    it('clearIgnoredWords returns a new instance with an empty list', () => {
      const settings = ProjectSettings.reconstruct({ ...validProps, ignoredWords: ['gonna', 'ouais'] });
      const updated = settings.clearIgnoredWords();
      expect(updated.getIgnoredWords()).toEqual([]);
    });

    it('toProperties includes ignoredWords', () => {
      const settings = ProjectSettings.reconstruct({ ...validProps, ignoredWords: ['gonna'] });
      expect(settings.toProperties().ignoredWords).toEqual(['gonna']);
    });
  });

  describe('customDictionary', () => {
    it('defaults to an empty array when not provided', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'Title');
      expect(settings.getCustomDictionary()).toEqual([]);
    });

    it('reads words stored as bare strings as entries declaring nothing', () => {
      const settings = ProjectSettings.reconstruct({
        ...validProps,
        customDictionary: ['Arrakis', 'spicce'],
      });
      expect(settings.getCustomDictionary()).toEqual([
        { word: 'Arrakis' },
        { word: 'spicce' },
      ]);
    });

    it('keeps a declared word beside a bare one, with no rewrite of either', () => {
      const settings = ProjectSettings.reconstruct({
        ...validProps,
        customDictionary: [
          'Arrakis',
          { word: 'krogan', nature: 'noun', gender: 'masculine', pluralForm: 'krogans' },
        ],
      });

      expect(settings.getCustomDictionary()).toEqual([
        { word: 'Arrakis' },
        { word: 'krogan', nature: 'noun', gender: 'masculine', pluralForm: 'krogans' },
      ]);
    });

    it('lists every written form, so the spell checker accepts the plural too', () => {
      const settings = ProjectSettings.reconstruct({
        ...validProps,
        customDictionary: [
          'Arrakis',
          { word: 'krogan', nature: 'noun', pluralForm: 'krogans' },
        ],
      });

      expect(settings.getCustomDictionaryWords()).toEqual(['Arrakis', 'krogan', 'krogans']);
    });

    it('getCustomDictionary returns a copy (mutation-safe)', () => {
      const settings = ProjectSettings.reconstruct({
        ...validProps,
        customDictionary: ['Arrakis'],
      });
      settings.getCustomDictionary().push({ word: 'mutated' });
      expect(settings.getCustomDictionary()).toEqual([{ word: 'Arrakis' }]);
    });

    it('addWordToCustomDictionary returns a new instance with the word appended', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'Title');
      const updated = settings.addWordToCustomDictionary('Arrakis');

      expect(updated).not.toBe(settings);
      expect(updated.getCustomDictionary()).toEqual([{ word: 'Arrakis' }]);
      expect(settings.getCustomDictionary()).toEqual([]); // original unchanged
    });

    it('addWordToCustomDictionary is idempotent when word already present', () => {
      const settings = ProjectSettings.reconstruct({
        ...validProps,
        customDictionary: ['Arrakis'],
      });
      const updated = settings.addWordToCustomDictionary('Arrakis');
      expect(updated).toBe(settings); // same reference — no new instance
    });

    it('addWordToCustomDictionary throws for an empty word', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'Title');
      expect(() => settings.addWordToCustomDictionary('')).toThrow('Word cannot be empty');
      expect(() => settings.addWordToCustomDictionary('   ')).toThrow('Word cannot be empty');
    });

    it('toProperties includes customDictionary', () => {
      const settings = ProjectSettings.reconstruct({
        ...validProps,
        customDictionary: ['Arrakis', 'spicce'],
      });
      expect(settings.toProperties().customDictionary).toEqual([
        { word: 'Arrakis' },
        { word: 'spicce' },
      ]);
    });

    it('updateCustomDictionary replaces the full list and returns a new instance', () => {
      const settings = ProjectSettings.reconstruct({
        ...validProps,
        customDictionary: ['old'],
      });
      const updated = settings.updateCustomDictionary(
        [{ word: 'Arrakis' }, { word: 'spicce' }],
        null
      );
      expect(updated.getCustomDictionary()).toEqual([
        { word: 'Arrakis' },
        { word: 'spicce' },
      ]);
      expect(settings.getCustomDictionary()).toEqual([{ word: 'old' }]); // original unchanged
    });
  });

  describe('grammar dictionary', () => {
    it('has no compiled dictionary until one is written', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'Title');
      expect(settings.getGrammarDictionary()).toBeNull();
    });

    it('stores the compiled dictionary alongside the list it was built from', () => {
      const compiled = { sLangCode: 'fr', nEntry: 2 };
      const settings = ProjectSettings.create(
        'id-1',
        'proj-1',
        'owner-1',
        'Title'
      ).updateCustomDictionary([{ word: 'krogan', nature: 'noun' }], compiled);

      expect(settings.getGrammarDictionary()).toEqual(compiled);
    });

    it('drops the compiled dictionary when the list no longer declares anything', () => {
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'Title')
        .updateCustomDictionary([{ word: 'krogan', nature: 'noun' }], { nEntry: 1 })
        .updateCustomDictionary([{ word: 'krogan' }], null);

      expect(settings.getGrammarDictionary()).toBeNull();
    });

    it('leaves the compiled dictionary alone when a word declaring nothing is added', () => {
      // A word added from the spell-check palette carries no nature, so it adds no
      // flexion — the automaton stays valid without being rebuilt.
      const compiled = { nEntry: 1 };
      const settings = ProjectSettings.create('id-1', 'proj-1', 'owner-1', 'Title')
        .updateCustomDictionary([{ word: 'krogan', nature: 'noun' }], compiled)
        .addWordToCustomDictionary('Arrakis');

      expect(settings.getGrammarDictionary()).toEqual(compiled);
      expect(settings.getCustomDictionaryWords()).toEqual(['krogan', 'Arrakis']);
    });
  });
});
