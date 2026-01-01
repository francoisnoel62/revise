# Infrastructure Layer

Implements domain interfaces with concrete external services.

## Rules:
- Implements interfaces defined in Domain layer
- Contains all framework-specific and external service code
- OpenAI API integration, document parsers, file operations

## Contents:
- `ai/` - LLM provider implementations (OpenAIProvider)
- `document/parsers/` - Document parsing implementations (DocxParser)
- `document/exporters/` - Document export implementations (DocxExporter)
