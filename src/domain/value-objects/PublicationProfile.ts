// ABOUTME: Immutable publication-profile value object for book rendering constraints.
// ABOUTME: Defines the single KDP 6×9 preset shared by preview and export during the spike.

export interface PublicationProfileProperties {
  readonly id: string;
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

  get values(): PublicationProfileProperties {
    return this.properties;
  }
}
