// ABOUTME: Central export point for domain layer entities, value objects, and interfaces
// ABOUTME: Provides clean imports for application and infrastructure layers

// Entities
export { TextDocument } from './entities/TextDocument';

// Value Objects
export { TextSelection } from './value-objects/TextSelection';
export { RewriteProposal } from './value-objects/RewriteProposal';

// Interfaces
export type { LLMProvider } from './interfaces/LLMProvider';
export type { DocumentParser } from './interfaces/DocumentParser';
export type { DocumentExporter } from './interfaces/DocumentExporter';
