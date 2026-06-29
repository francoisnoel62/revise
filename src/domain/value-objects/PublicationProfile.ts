// ABOUTME: Immutable publication-profile value object for book rendering constraints.
// ABOUTME: Defines print-ready and passerelle presets shared by preview and export.

export interface PublicationProfileProperties {
  readonly id: PublicationProfileId;
  readonly pageWidthInches: number;
  readonly pageHeightInches: number;
  readonly marginTopCentimeters: number;
  readonly marginBottomCentimeters: number;
  readonly marginInsideCentimeters: number;
  readonly marginOutsideCentimeters: number;
  readonly bodyFontFamily: string;
  readonly bodyFontSizePoints: number;
  readonly lineHeight: number;
  readonly firstLineIndentCentimeters: number;
}

export type PublicationProfileId =
  | 'kdp-6x9'
  | 'kdp-5x8'
  | 'kdp-5_25x8'
  | 'kdp-5_5x8_5'
  | 'a5'
  | 'passerelle';

export class PublicationProfile {
  private constructor(private readonly properties: PublicationProfileProperties) {}

  static kdpSixByNine(): PublicationProfile {
    return new PublicationProfile({
      id: 'kdp-6x9',
      pageWidthInches: 6,
      pageHeightInches: 9,
      marginTopCentimeters: 1.8,
      marginBottomCentimeters: 1.8,
      marginInsideCentimeters: 2,
      marginOutsideCentimeters: 1.5,
      bodyFontFamily: 'EB Garamond',
      bodyFontSizePoints: 11,
      lineHeight: 1.15,
      firstLineIndentCentimeters: 0.8,
    });
  }

  static kdpFiveByEight(): PublicationProfile {
    return new PublicationProfile({
      id: 'kdp-5x8',
      pageWidthInches: 5,
      pageHeightInches: 8,
      marginTopCentimeters: 1.5,
      marginBottomCentimeters: 1.5,
      marginInsideCentimeters: 1.8,
      marginOutsideCentimeters: 1.3,
      bodyFontFamily: 'EB Garamond',
      bodyFontSizePoints: 10.5,
      lineHeight: 1.15,
      firstLineIndentCentimeters: 0.7,
    });
  }

  static kdpFiveQuarterByEight(): PublicationProfile {
    return new PublicationProfile({
      id: 'kdp-5_25x8',
      pageWidthInches: 5.25,
      pageHeightInches: 8,
      marginTopCentimeters: 1.6,
      marginBottomCentimeters: 1.6,
      marginInsideCentimeters: 1.8,
      marginOutsideCentimeters: 1.4,
      bodyFontFamily: 'EB Garamond',
      bodyFontSizePoints: 11,
      lineHeight: 1.15,
      firstLineIndentCentimeters: 0.8,
    });
  }

  static kdpFiveHalfByEightHalf(): PublicationProfile {
    return new PublicationProfile({
      id: 'kdp-5_5x8_5',
      pageWidthInches: 5.5,
      pageHeightInches: 8.5,
      marginTopCentimeters: 1.7,
      marginBottomCentimeters: 1.7,
      marginInsideCentimeters: 1.9,
      marginOutsideCentimeters: 1.5,
      bodyFontFamily: 'EB Garamond',
      bodyFontSizePoints: 11,
      lineHeight: 1.15,
      firstLineIndentCentimeters: 0.8,
    });
  }

  static a5(): PublicationProfile {
    return new PublicationProfile({
      id: 'a5',
      pageWidthInches: 5.83,
      pageHeightInches: 8.27,
      marginTopCentimeters: 1.8,
      marginBottomCentimeters: 1.8,
      marginInsideCentimeters: 2,
      marginOutsideCentimeters: 1.5,
      bodyFontFamily: 'EB Garamond',
      bodyFontSizePoints: 10.5,
      lineHeight: 1.15,
      firstLineIndentCentimeters: 0.7,
    });
  }

  static passerelle(): PublicationProfile {
    return new PublicationProfile({
      id: 'passerelle',
      pageWidthInches: 8.27,
      pageHeightInches: 11.69,
      marginTopCentimeters: 2.54,
      marginBottomCentimeters: 2.54,
      marginInsideCentimeters: 2.54,
      marginOutsideCentimeters: 2.54,
      bodyFontFamily: 'Arial',
      bodyFontSizePoints: 12,
      lineHeight: 1.5,
      firstLineIndentCentimeters: 0,
    });
  }

  static fromId(id: PublicationProfileId): PublicationProfile {
    switch (id) {
      case 'kdp-5x8':
        return PublicationProfile.kdpFiveByEight();
      case 'kdp-5_25x8':
        return PublicationProfile.kdpFiveQuarterByEight();
      case 'kdp-5_5x8_5':
        return PublicationProfile.kdpFiveHalfByEightHalf();
      case 'a5':
        return PublicationProfile.a5();
      case 'passerelle':
        return PublicationProfile.passerelle();
      default:
        return PublicationProfile.kdpSixByNine();
    }
  }

  get values(): PublicationProfileProperties {
    return this.properties;
  }
}
