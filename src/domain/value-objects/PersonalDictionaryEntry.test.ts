// ABOUTME: Test suite for the personal dictionary entry value object.
// ABOUTME: Covers the reading of bare-word entries and the flexions a declared word produces.

import { describe, expect, it } from 'vitest';
import {
  personalDictionaryFlexions,
  toPersonalDictionaryEntry,
  type PersonalDictionaryEntry,
} from './PersonalDictionaryEntry';

describe('toPersonalDictionaryEntry', () => {
  it('reads a bare word as an entry declaring nothing', () => {
    expect(toPersonalDictionaryEntry('Vhardun')).toEqual({ word: 'Vhardun' });
  });

  it('trims the word it is given', () => {
    expect(toPersonalDictionaryEntry('  Vhardun  ')).toEqual({ word: 'Vhardun' });
    expect(toPersonalDictionaryEntry({ word: '  Vhardun  ' }).word).toBe('Vhardun');
  });

  it('keeps what the author declared', () => {
    const declared: PersonalDictionaryEntry = {
      word: 'Vhardun',
      nature: 'proper-noun',
      gender: 'feminine',
      pluralForm: 'Vharduns',
    };

    expect(toPersonalDictionaryEntry(declared)).toEqual(declared);
  });

  it('drops a plural form that repeats the singular', () => {
    expect(
      toPersonalDictionaryEntry({ word: 'Vhardun', nature: 'noun', pluralForm: 'Vhardun' })
    ).toEqual({ word: 'Vhardun', nature: 'noun' });
  });

  it('rejects an empty word', () => {
    expect(() => toPersonalDictionaryEntry('   ')).toThrow(/empty/i);
  });
});

describe('personalDictionaryFlexions', () => {
  it('gives the engine nothing for a word whose nature is undeclared', () => {
    expect(personalDictionaryFlexions({ word: 'Vhardun' })).toEqual([]);
  });

  it('tags a proper noun with its gender, invariable when no plural is declared', () => {
    expect(
      personalDictionaryFlexions({ word: 'Vhardun', nature: 'proper-noun', gender: 'feminine' })
    ).toEqual([{ label: 'Vhardun', stem: 'Vhardun', tags: ':M1:f:i' }]);
  });

  it('emits a singular and a plural flexion when the author declared a plural', () => {
    expect(
      personalDictionaryFlexions({
        word: 'krogan',
        nature: 'noun',
        gender: 'masculine',
        pluralForm: 'krogans',
      })
    ).toEqual([
      { label: 'krogan', stem: 'krogan', tags: ':N:m:s' },
      { label: 'krogans', stem: 'krogan', tags: ':N:m:p' },
    ]);
  });

  it('treats an undeclared gender as epicene, so the engine stays silent on agreement', () => {
    expect(personalDictionaryFlexions({ word: 'sylve', nature: 'adjective' })).toEqual([
      { label: 'sylve', stem: 'sylve', tags: ':A:e:i' },
    ]);
  });
});
