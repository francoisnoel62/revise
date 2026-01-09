// ABOUTME: Central export point for application layer use cases
// ABOUTME: Provides clean imports for interface layer (UI, API routes)

// Document Use Cases (Legacy - Phase 1)
export { RewriteTextUseCase } from './use-cases/RewriteTextUseCase';
export { ImportDocumentUseCase } from './use-cases/ImportDocumentUseCase';
export { ExportDocumentUseCase } from './use-cases/ExportDocumentUseCase';

// Project Use Cases (Phase 2)
export { ImportProjectUseCase } from './use-cases/ImportProjectUseCase';
export { ExportProjectUseCase } from './use-cases/ExportProjectUseCase';

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
