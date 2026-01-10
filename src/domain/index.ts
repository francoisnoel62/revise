// ABOUTME: Central export point for domain layer entities, value objects, and interfaces
// ABOUTME: Provides clean imports for application and infrastructure layers

// Entities
export { TextDocument } from './entities/TextDocument';
export { Chapter } from './entities/Chapter';
export { Project } from './entities/Project';
export { Provider } from './entities/Provider';
export type { ProviderType } from './entities/Provider';
export * from './entities/User';
export { ProjectMetadata, type ProjectMetadataProperties } from './entities/ProjectMetadata';

// Value Objects
export { TextSelection } from './value-objects/TextSelection';
export { RewriteProposal } from './value-objects/RewriteProposal';
export {
  type MetadataTypeDefinition,
  METADATA_TYPES,
  isValidMetadataType,
  getMetadataType
} from './value-objects/MetadataType';
export { type NarrativeAnalysis } from './value-objects/NarrativeAnalysis';
export { type StylisticDNA } from './value-objects/StylisticDNA';
export { type Characters, type CharacterProfile } from './value-objects/Characters';
export { type Plot, type SceneBreakdown } from './value-objects/Plot';
export { type Worldbuilding } from './value-objects/Worldbuilding';
export {
  type Synthesis,
  type CharacterSummary,
  type NarrativeDirection,
} from './value-objects/Synthesis';

// Interfaces
export type { LLMProvider, ConnectionTestResult } from './interfaces/LLMProvider';
export type { LLMProviderFactory } from './interfaces/LLMProviderFactory';
export type { PromptRepository } from './interfaces/PromptRepository';
export type { DocumentParser } from './interfaces/DocumentParser';
export type { DocumentExporter } from './interfaces/DocumentExporter';
export type { AuthProvider, UserSession } from './interfaces/AuthProvider';
export { UnauthorizedError } from './interfaces/AuthProvider';
export type { ProjectRepository } from './interfaces/ProjectRepository';
export type { ProviderRepository } from './interfaces/ProviderRepository';
export type { IdGenerator } from './interfaces/IdGenerator';
export * from './interfaces/UserRepository';
export type { MetadataRepository } from './interfaces/MetadataRepository';
