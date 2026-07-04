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

export type PublicationProfileId = 'kdp-6x9' | 'a5' | 'passerelle';

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

  /**
   * Restores a profile by id. Unknown/removed ids (e.g. legacy KDP trims dropped
   * from the catalogue) fall back to kdp-6x9 instead of throwing, so a project
   * stored on a removed profile still opens.
   */
  static fromId(id: PublicationProfileId): PublicationProfile {
    switch (id) {
      case 'a5':
        return PublicationProfile.a5();
      case 'passerelle':
        return PublicationProfile.passerelle();
      case 'kdp-6x9':
        return PublicationProfile.kdpSixByNine();
      default:
        return PublicationProfile.kdpSixByNine();
    }
  }

  get values(): PublicationProfileProperties {
    return this.properties;
  }
}
