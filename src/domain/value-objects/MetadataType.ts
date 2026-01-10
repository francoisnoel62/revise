// ABOUTME: Value object representing a metadata type (e.g., 'narrative-analysis')
// ABOUTME: Defines the key, display name, and description for each type

export interface MetadataTypeDefinition {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly isBuiltIn: boolean;
}

/**
 * Predefined metadata types for MVP.
 * Only 'narrative-analysis' is implemented in MVP.
 */
export const METADATA_TYPES: Record<string, MetadataTypeDefinition> = {
  'narrative-analysis': {
    key: 'narrative-analysis',
    name: 'Analyse Narrative',
    description: 'Point de vue, structure narrative, temporalité, voix',
    isBuiltIn: true,
  },
  // Future types (not implemented in MVP):
  // 'stylistic-dna': { key: 'stylistic-dna', name: 'ADN Stylistique', ... },
  // 'characters': { key: 'characters', name: 'Personnages', ... },
  // 'plot': { key: 'plot', name: 'Intrigue', ... },
  // 'worldbuilding': { key: 'worldbuilding', name: 'Worldbuilding', ... },
  // 'synthesis': { key: 'synthesis', name: 'Synthèse', ... },
} as const;

export function isValidMetadataType(key: string): boolean {
  return key in METADATA_TYPES;
}

export function getMetadataType(key: string): MetadataTypeDefinition | undefined {
  return METADATA_TYPES[key];
}
