// ABOUTME: Domain value type for presentation overrides in the passerelle profile.
// ABOUTME: Overrides are stored as a separate layer, never touching the semantic content.

export interface PresentationProps {
  fontFamily?: string;
  fontSize?: string;
  textAlign?: string;
}

export interface NodeOverride {
  nodeIndex: number;
  props: PresentationProps;
}

export type PresentationOverrideLayer = NodeOverride[];
