// ABOUTME: Tests bounded, closed-list typography values for semantic text roles.
// ABOUTME: Guards the immutable LevelStyleSet interface used by settings and renderers.

import { describe, expect, it } from 'vitest';
import { LevelStyleSet } from './LevelStyleSet';
import { PublicationProfile } from './PublicationProfile';

describe('LevelStyleSet', () => {
  it('clamps numeric attributes to safe publishing bounds', () => {
    const defaults = LevelStyleSet.defaultsFor(PublicationProfile.kdpSixByNine()).values;
    const styles = LevelStyleSet.create({
      ...defaults,
      'titre-de-chapitre': {
        ...defaults['titre-de-chapitre'],
        fontSizePoints: 99,
        lineHeight: 0.2,
        spaceBeforePoints: -5,
        spaceAfterPoints: 999,
      },
      corps: {
        ...defaults.corps,
        fontSizePoints: 1,
        lineHeight: 8,
      },
    }).values;

    expect(styles['titre-de-chapitre']).toMatchObject({
      fontSizePoints: 48,
      lineHeight: 1,
      spaceBeforePoints: 0,
      spaceAfterPoints: 200,
    });
    expect(styles.corps).toMatchObject({ fontSizePoints: 6, lineHeight: 3 });
  });

  it.each([
    ['fontWeight', 'heavy'],
    ['alignment', 'middle'],
    ['fontFamily', 'Comic Sans'],
  ] as const)('rejects an invalid closed-list %s', (attribute, value) => {
    const defaults = LevelStyleSet.defaultsFor(PublicationProfile.kdpSixByNine()).values;
    expect(() =>
      LevelStyleSet.create({
        ...defaults,
        corps: { ...defaults.corps, [attribute]: value },
      }),
    ).toThrow(`Invalid level style ${attribute}`);
  });

  it('rejects a non-boolean italic value', () => {
    const defaults = LevelStyleSet.defaultsFor(PublicationProfile.kdpSixByNine()).values;
    expect(() =>
      LevelStyleSet.create({
        ...defaults,
        corps: { ...defaults.corps, italic: 'yes' as never },
      }),
    ).toThrow('Invalid level style italic');
  });

  it('defaults subtitles to left alignment so their indent aligns with body starts', () => {
    const defaults = LevelStyleSet.defaultsFor(PublicationProfile.kdpSixByNine()).values;
    expect(defaults['sous-titre'].alignment).toBe('left');
  });

  it('derives body defaults from each publication profile', () => {
    expect(LevelStyleSet.defaultsFor(PublicationProfile.kdpSixByNine()).values.corps).toMatchObject({
      fontFamily: 'EB Garamond',
      fontSizePoints: 11,
      lineHeight: 1.15,
    });
    expect(LevelStyleSet.defaultsFor(PublicationProfile.a5()).values.corps.fontSizePoints).toBe(10.5);
  });
});
