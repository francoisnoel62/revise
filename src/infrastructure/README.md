# Infrastructure Layer

Implements domain interfaces with concrete external services.

**Status**: ✅ Complete (21 unit tests + 6 integration tests)

## Rules:
- Implements interfaces defined in Domain layer
- Contains all framework-specific and external service code
- OpenAI API integration, document parsers, file operations

## Contents:

### AI Provider (✅ Implemented)

#### `OpenAIProvider`
Implements `LLMProvider` interface using OpenAI API.

**Technology**: OpenAI SDK with GPT-4o-mini
**Features**:
- Carefully crafted system prompt for text rewriting
- Context-aware generation (uses surrounding text)
- Generates exactly 5 distinct stylistic variants
- JSON-structured responses
- Error handling for API failures

**Configuration**:
- Model: `gpt-4o-mini`
- Temperature: 0.7 (balance creativity and consistency)
- Response format: JSON object with proposals array

**Tests**:
- 8 unit tests with mocked OpenAI client
- 4 integration tests with real API calls
- Performance validation (< 3s target)
- Proposal diversity verification

### Document Parsers (✅ Implemented)

#### `DocxParser`
Implements `DocumentParser` interface using mammoth library.

**Technology**: mammoth npm package
**Input**: .docx file buffer
**Output**: Plain text (formatting stripped)
**Tests**: 4 tests covering various DOCX structures

### Document Exporters (✅ Implemented)

#### `DocxExporter`
Implements `DocumentExporter` interface using docx library.

**Technology**: docx npm package
**Input**: Plain text content
**Output**: .docx file buffer
**Features**:
- Preserves paragraphs (line breaks)
- Basic formatting (Arial 11pt)
- Standard page margins

**Tests**: 7 tests covering export scenarios and edge cases

### Configuration (✅ Implemented)

#### `env.ts`
Environment variable validation and access.

**Variables**:
- `OPENAI_API_KEY` - Required for AI functionality

## Integration Testing

Complete document pipeline integration test validates:
- .docx import → plain text → .docx export
- Round-trip content preservation
- Real OpenAI API rewrite generation
