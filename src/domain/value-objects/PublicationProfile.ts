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

  static create(props: PublicationProfileProperties): PublicationProfile {
    if (props.pageWidthInches <= 0) throw new Error('pageWidthInches must be positive');
    if (props.pageHeightInches <= 0) throw new Error('pageHeightInches must be positive');
    if (props.marginTopCentimeters < 0) throw new Error('marginTopCentimeters must be non-negative');
    if (props.marginBottomCentimeters < 0) throw new Error('marginBottomCentimeters must be non-negative');
    if (props.marginInsideCentimeters < 0) throw new Error('marginInsideCentimeters must be non-negative');
    if (props.marginOutsideCentimeters < 0) throw new Error('marginOutsideCentimeters must be non-negative');
    if (props.bodyFontSizePoints <= 0) throw new Error('bodyFontSizePoints must be positive');
    if (props.lineHeight <= 0) throw new Error('lineHeight must be positive');
    if (!props.bodyFontFamily.trim()) throw new Error('bodyFontFamily must not be empty');
    return new PublicationProfile(props);
  }

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

  equals(other: PublicationProfile): boolean {
    return this.properties.id === other.properties.id;
  }

  get values(): PublicationProfileProperties {
    return this.properties;
  }
}
