// ABOUTME: Central export point for domain layer entities, value objects, and interfaces
// ABOUTME: Provides clean imports for application and infrastructure layers

// Entities
export { TextDocument } from './entities/TextDocument';
export * from './entities/User';

// Value Objects
export { TextSelection } from './value-objects/TextSelection';
export { RewriteProposal } from './value-objects/RewriteProposal';

// Interfaces
export type { LLMProvider } from './interfaces/LLMProvider';
export type { DocumentParser } from './interfaces/DocumentParser';
export type { DocumentExporter } from './interfaces/DocumentExporter';
export type { AuthProvider, UserSession } from './interfaces/AuthProvider';
export { UnauthorizedError } from './interfaces/AuthProvider';
export * from './interfaces/UserRepository';
