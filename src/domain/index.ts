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
export { CorrectionHistory } from './entities/CorrectionHistory';
export { WritingGoal, type GoalType, type WritingGoalProperties } from './entities/WritingGoal';

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
export {
  type ChapterSummaries,
  type ChapterSummary as ChapterSummaryItem,
} from './value-objects/ChapterSummaries';
export { type ChapterGeneration } from './value-objects/ChapterGeneration';
export {
  type ChapterGenerationTypeDefinition,
  type ChapterGenerationTypeKey,
  CHAPTER_GENERATION_TYPES,
  isValidChapterGenerationType,
  getChapterGenerationType,
} from './value-objects/ChapterGenerationType';

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
export type { CorrectionHistoryRepository } from './interfaces/CorrectionHistoryRepository';
export type { ContentConverter } from './interfaces/ContentConverter';
export type { WritingGoalRepository } from './interfaces/WritingGoalRepository';
