// ABOUTME: Central export point for application layer use cases
// ABOUTME: Provides clean imports for interface layer (UI, API routes)

// Document Use Cases (Legacy - Phase 1)
export { RewriteTextUseCase } from './use-cases/RewriteTextUseCase';
export { ImportDocumentUseCase } from './use-cases/ImportDocumentUseCase';
export { ExportDocumentUseCase } from './use-cases/ExportDocumentUseCase';

// Project Use Cases (Phase 2)
export { ImportProjectUseCase } from './use-cases/ImportProjectUseCase';
export { ExportProjectUseCase } from './use-cases/ExportProjectUseCase';

// Project CRUD Use Cases (Phase 3)
export { CreateProjectUseCase } from './use-cases/CreateProjectUseCase';
export type { CreateProjectInput } from './use-cases/CreateProjectUseCase';
export { InvalidProviderError } from './use-cases/CreateProjectUseCase';
export { LoadProjectUseCase } from './use-cases/LoadProjectUseCase';
export type { LoadProjectInput } from './use-cases/LoadProjectUseCase';
export { ProjectNotFoundError } from './use-cases/LoadProjectUseCase';
export { ListProjectsUseCase } from './use-cases/ListProjectsUseCase';
export type { ListProjectsInput } from './use-cases/ListProjectsUseCase';
export { DeleteProjectUseCase } from './use-cases/DeleteProjectUseCase';
export type { DeleteProjectInput } from './use-cases/DeleteProjectUseCase';
export { UpdateProjectTitleUseCase } from './use-cases/UpdateProjectTitleUseCase';
export type { UpdateProjectTitleInput } from './use-cases/UpdateProjectTitleUseCase';
export { UpdateProjectProviderUseCase } from './use-cases/UpdateProjectProviderUseCase';
export type { UpdateProjectProviderInput } from './use-cases/UpdateProjectProviderUseCase';
export { ProviderNotFoundError } from './use-cases/UpdateProjectProviderUseCase';

// Chapter Use Cases (Phase 2)
export { AddChapterUseCase } from './use-cases/AddChapterUseCase';
export { RemoveChapterUseCase } from './use-cases/RemoveChapterUseCase';
export { ReorderChaptersUseCase } from './use-cases/ReorderChaptersUseCase';
export { UpdateChapterContentUseCase } from './use-cases/UpdateChapterContentUseCase';
export { UpdateChapterTitleUseCase } from './use-cases/UpdateChapterTitleUseCase';
export { SwitchChapterUseCase } from './use-cases/SwitchChapterUseCase';

// Provider Use Cases (Phase 3.5)
export { CreateProviderUseCase } from './use-cases/CreateProviderUseCase';
export type { CreateProviderInput } from './use-cases/CreateProviderUseCase';
export { UpdateProviderUseCase } from './use-cases/UpdateProviderUseCase';
export type { UpdateProviderInput } from './use-cases/UpdateProviderUseCase';
export { DeleteProviderUseCase } from './use-cases/DeleteProviderUseCase';
export type { DeleteProviderInput } from './use-cases/DeleteProviderUseCase';
export { ListProvidersUseCase } from './use-cases/ListProvidersUseCase';
export type { ListProvidersInput } from './use-cases/ListProvidersUseCase';
export { TestProviderConnectionUseCase } from './use-cases/TestProviderConnectionUseCase';
export type { TestProviderConnectionInput, TestProviderConnectionOutput } from './use-cases/TestProviderConnectionUseCase';
export { ValidateProviderUseCase } from './use-cases/ValidateProviderUseCase';
export type { ValidateProviderInput } from './use-cases/ValidateProviderUseCase';

// User Use Cases (Phase 3)
export { RegisterUserUseCase } from './use-cases/RegisterUserUseCase';
export type { RegisterUserInput } from './use-cases/RegisterUserUseCase';
export { EmailAlreadyExistsError, ValidationError } from './use-cases/RegisterUserUseCase';

// Metadata Use Cases (Phase 3.6 - Project Metadata Feature)
export {
  CreateMetadataUseCase,
  type CreateMetadataInput,
  type CreateMetadataResult,
} from './use-cases/CreateMetadataUseCase';

export {
  UpdateMetadataContentUseCase,
  type UpdateMetadataContentInput,
  type UpdateMetadataContentResult,
} from './use-cases/UpdateMetadataContentUseCase';

export {
  UpdateMetadataTitleUseCase,
  type UpdateMetadataTitleInput,
  type UpdateMetadataTitleResult,
} from './use-cases/UpdateMetadataTitleUseCase';

export {
  DeleteMetadataUseCase,
  type DeleteMetadataInput,
  type DeleteMetadataResult,
} from './use-cases/DeleteMetadataUseCase';

export {
  ListMetadataUseCase,
  type ListMetadataInput,
  type ListMetadataResult,
} from './use-cases/ListMetadataUseCase';

export {
  LoadMetadataUseCase,
  type LoadMetadataInput,
  type LoadMetadataResult,
} from './use-cases/LoadMetadataUseCase';

export {
  GenerateNarrativeAnalysisUseCase,
  type GenerateNarrativeAnalysisInput,
  type GenerateNarrativeAnalysisResult,
} from './use-cases/GenerateNarrativeAnalysisUseCase';

export {
  GenerateStylisticDNAUseCase,
  type GenerateStylisticDNAInput,
  type GenerateStylisticDNAResult,
} from './use-cases/GenerateStylisticDNAUseCase';

export {
  GenerateCharactersUseCase,
  type GenerateCharactersInput,
  type GenerateCharactersResult,
} from './use-cases/GenerateCharactersUseCase';

export {
  GeneratePlotUseCase,
  type GeneratePlotInput,
  type GeneratePlotResult,
} from './use-cases/GeneratePlotUseCase';

export {
  GenerateWorldbuildingUseCase,
  type GenerateWorldbuildingInput,
  type GenerateWorldbuildingResult,
} from './use-cases/GenerateWorldbuildingUseCase';

export {
  GenerateSynthesisUseCase,
  type GenerateSynthesisInput,
  type GenerateSynthesisResult,
} from './use-cases/GenerateSynthesisUseCase';
