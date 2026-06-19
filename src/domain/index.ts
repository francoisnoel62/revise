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
export { WritingGoal, type WritingGoalProperties } from './entities/WritingGoal';
export { WritingQuota, type QuotaPeriod, type WritingQuotaProperties } from './entities/WritingQuota';
export { WordCountSnapshot, type WordCountSnapshotProperties } from './entities/WordCountSnapshot';
export { AIUsageRecord, type AIUsageRecordProperties } from './entities/AIUsageRecord';
export {
  AutocompleteEvent,
  type AutocompleteEventProperties,
  type CreateAutocompleteEventProps,
} from './entities/AutocompleteEvent';
export {
  CanonFact,
  type CanonFactProperties,
  type CreateCanonFactProps,
} from './entities/CanonFact';
export { ProjectTask, type ProjectTaskProperties } from './entities/ProjectTask';
export { Character, type CharacterProperties } from './entities/Character';
export {
  ResearchDocument,
  type ResearchDocumentProperties,
  type ResearchDocumentType,
} from './entities/ResearchDocument';

// Value Objects
export { TextSelection } from './value-objects/TextSelection';
export { RewriteProposal } from './value-objects/RewriteProposal';
export {
  type MetadataTypeDefinition,
  METADATA_TYPES,
  isValidMetadataType,
  getMetadataType,
  EDITORIAL_TYPE_KEYS,
  type EditorialTypeKey,
  EDITORIAL_PLACEHOLDERS,
  EDITORIAL_ORDER,
  isEditorialType,
  getEditorialPlaceholder,
  getEditorialOrder,
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
export {
  type AIOperationType,
  AI_OPERATION_TYPES,
  AI_OPERATION_LABELS,
  isValidAIOperationType,
} from './value-objects/AIOperationType';
export {
  type CanonFactSource,
  CANON_FACT_SOURCES,
  isValidCanonFactSource,
} from './value-objects/CanonFactSource';
export {
  type CanonFacts,
  type ExtractedCanonFact,
  isValidExtractedCanonFact,
} from './value-objects/CanonFacts';
export {
  type AutocompleteOutcome,
  AUTOCOMPLETE_OUTCOMES,
  isValidAutocompleteOutcome,
} from './value-objects/AutocompleteOutcome';
export {
  type AIOperationPolicy,
  AUTOCOMPLETE_POLICY,
} from './value-objects/AIOperationPolicy';
export {
  type AutocompleteIntent,
  AUTOCOMPLETE_INTENTS,
  isValidAutocompleteIntent,
  nextAutocompleteIntent,
} from './value-objects/AutocompleteIntent';
export {
  type TaskStatus,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
  isValidTaskStatus,
} from './value-objects/TaskStatus';
export {
  type TaskPriority,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_ORDER,
  isValidTaskPriority,
} from './value-objects/TaskPriority';

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
export type { AIUsageRepository, UsageStats, DailyUsage } from './interfaces/AIUsageRepository';
export type {
  AutocompleteEventRepository,
  AutocompleteProviderModelStats,
  AutocompleteStats,
} from './interfaces/AutocompleteEventRepository';
export type { CanonFactRepository } from './interfaces/CanonFactRepository';
export type { CanonExtractionStateRepository } from './interfaces/CanonExtractionStateRepository';
export type { ProjectTaskRepository, TaskFilters, TaskSortOptions } from './interfaces/ProjectTaskRepository';
export type { CharacterRepository } from './interfaces/CharacterRepository';
export type {
  ResearchDocumentRepository,
  ResearchDocumentFilters,
} from './interfaces/ResearchDocumentRepository';
