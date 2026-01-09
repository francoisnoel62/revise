// ABOUTME: Central export point for domain layer entities, value objects, and interfaces
// ABOUTME: Provides clean imports for application and infrastructure layers

// Entities
export { TextDocument } from './entities/TextDocument';
export { Chapter } from './entities/Chapter';
export { Project } from './entities/Project';
export { Provider } from './entities/Provider';
export type { ProviderType } from './entities/Provider';
export * from './entities/User';

// Value Objects
export { TextSelection } from './value-objects/TextSelection';
export { RewriteProposal } from './value-objects/RewriteProposal';

// Interfaces
export type { LLMProvider, ConnectionTestResult } from './interfaces/LLMProvider';
export type { LLMProviderFactory } from './interfaces/LLMProviderFactory';
export type { DocumentParser } from './interfaces/DocumentParser';
export type { DocumentExporter } from './interfaces/DocumentExporter';
export type { AuthProvider, UserSession } from './interfaces/AuthProvider';
export { UnauthorizedError } from './interfaces/AuthProvider';
export type { ProjectRepository } from './interfaces/ProjectRepository';
export type { ProviderRepository } from './interfaces/ProviderRepository';
export type { IdGenerator } from './interfaces/IdGenerator';
export * from './interfaces/UserRepository';
