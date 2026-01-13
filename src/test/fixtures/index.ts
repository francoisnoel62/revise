// ABOUTME: Central export for all test fixtures.
// ABOUTME: Provides convenient access to all fixture factories.

// TipTap document fixtures
export {
  createEmptyDocument,
  createSimpleDocument,
  createMultiParagraphDocument,
  createFormattedDocument,
  createMixedFormattingDocument,
  createHeadingDocument,
  createChapterDocument,
  createFictionChapter,
  stringify,
  parse,
  extractText,
  countWords,
  countCharacters,
} from './tiptap';

// Project and Chapter fixtures
export {
  TEST_USER_ID,
  createTestChapter,
  createTestChapters,
  createTestProject,
  createTestProjectWithChapters,
  createFictionProject,
  createLargeProject,
  serializeProject,
} from './projects';

// Provider fixtures
export {
  createTestProvider,
  createOpenAIProvider,
  createAnthropicProvider,
  createAllProviderTypes,
  createInvalidProvider,
  getDefaultModel,
  serializeProvider,
} from './providers';
