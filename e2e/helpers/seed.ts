// ABOUTME: MongoDB seeding utilities for E2E tests — creates and removes test fixtures
// ABOUTME: All test entities use ownerId TEST_USER_ID for easy cleanup by ownerId

import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { encryptApiKey } from '../../src/infrastructure/encryption/crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'revise';

// ── Fixed test identifiers (known at test-write time) ──────────────────────────

export const TEST_USER_ID = 'e2e-strategy-user-001';
export const TEST_USER_EMAIL = 'e2e-strategy@revise.test';
export const TEST_USER_PASSWORD = 'TestE2E2025!';
export const TEST_PROJECT_ID = 'e2e-strategy-project-001';
export const TEST_CHAPTER_ID = 'e2e-strategy-chapter-001';
export const TEST_AUTOCOMPLETE_PROJECT_ID = 'e2e-autocomplete-project-001';
export const TEST_AUTOCOMPLETE_CHAPTER_ID = 'e2e-autocomplete-chapter-001';
export const TEST_PROVIDER_ID = 'e2e-provider-autocomplete-001';
export const TEST_META_STALE_ID = 'e2e-strategy-meta-stale';
export const TEST_META_FRESH_ID = 'e2e-strategy-meta-fresh';
// Fixed 24-char hex ObjectId for the seeded research document
export const TEST_RESEARCH_DOC_ID = '6475a8f3c1234567890abcde';
// Fixed 24-char hex ObjectId for the autocomplete project settings
export const TEST_AUTOCOMPLETE_SETTINGS_ID = '6475a8f3c1234567890abcdf';

// Spell-check E2E fixtures
export const TEST_SPELLCHECK_PROJECT_ID = 'e2e-spellcheck-project-001';
export const TEST_SPELLCHECK_CHAPTER_ID = 'e2e-spellcheck-chapter-001';

// Canon E2E fixtures — stale canon (for notification bell tests)
export const TEST_CANON_STALE_PROJECT_ID = 'e2e-canon-stale-project-001';
export const TEST_CANON_STALE_CHAPTER_ID = 'e2e-canon-stale-chapter-001';
// Canon E2E fixtures — session-end mode
export const TEST_CANON_SESSION_PROJECT_ID = 'e2e-canon-session-project-001';
export const TEST_CANON_SESSION_CHAPTER_ID = 'e2e-canon-session-chapter-001';
export const TEST_CANON_SESSION_SETTINGS_ID = '6475a8f3c1234567890abce0';

// Book-preview E2E fixtures — multi-chapter project for whole-book preview tests
export const TEST_BOOK_PREVIEW_PROJECT_ID = 'e2e-book-preview-project-001';
export const TEST_BOOK_PREVIEW_CHAPTER_1_ID = 'e2e-book-preview-chapter-001';
export const TEST_BOOK_PREVIEW_CHAPTER_2_ID = 'e2e-book-preview-chapter-002';

// Book-preview E2E fixtures — passerelle project (no whole-book preview)
export const TEST_BOOK_PREVIEW_PASSERELLE_PROJECT_ID = 'e2e-book-preview-passerelle-001';
export const TEST_BOOK_PREVIEW_PASSERELLE_CHAPTER_ID = 'e2e-book-preview-passerelle-ch-001';
export const TEST_BOOK_PREVIEW_PASSERELLE_SETTINGS_ID = '6475a8f3c1234567890abce1';

// Book-preview E2E fixtures — a "realistic" multi-page manuscript for the cold/hot perf
// test. Sized to render in a handful of seconds (CI-safe) while still exercising real
// front matter + TOC + a multi-page body with per-chapter page offsets. It is a smaller,
// deterministic stand-in for the production target of a ~300-400 page novel.
export const TEST_BOOK_PREVIEW_LARGE_PROJECT_ID = 'e2e-book-preview-large-001';
export const TEST_BOOK_PREVIEW_LARGE_CHAPTER_COUNT = 6;

// ── Chapter content seedé ─────────────────────────────────────────────────────

export const TEST_CHAPTER_TITLE = 'Chapitre 1';
export const TEST_CHAPTER_TEXT = 'Le soleil se leva sur la ville de Brumes-sur-Loire.';
export const TEST_CHAPTER_CONTENT = JSON.stringify({
  type: 'doc',
  content: [{
    type: 'paragraph',
    content: [{ type: 'text', text: TEST_CHAPTER_TEXT }],
  }],
});

export const TEST_AUTOCOMPLETE_CHAPTER_TITLE = 'Chapitre Autocomplétion';
export const TEST_AUTOCOMPLETE_CHAPTER_TEXT = 'Éliane Vaucresson leva les yeux vers l’horloge arrêtée et';
export const TEST_AUTOCOMPLETE_CHAPTER_CONTENT = JSON.stringify({
  type: 'doc',
  content: [{
    type: 'paragraph',
    content: [{ type: 'text', text: TEST_AUTOCOMPLETE_CHAPTER_TEXT }],
  }],
});

function autocompleteEvent(
  suffix: string,
  outcome: string,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  const now = new Date();
  return {
    _id: new ObjectId(),
    ownerId: TEST_USER_ID,
    projectId: TEST_AUTOCOMPLETE_PROJECT_ID,
    chapterId: TEST_AUTOCOMPLETE_CHAPTER_ID,
    suggestionId: `e2e-autocomplete-${suffix}`,
    providerType: null,
    model: null,
    triggeredAt: now,
    firstTokenMs: outcome === 'empty' ? null : 200,
    totalMs: 800,
    suggestionLengthChars: outcome === 'empty' ? 0 : 30,
    suggestionLengthWords: outcome === 'empty' ? 0 : 6,
    acceptedChars: outcome === 'accepted_full' ? 30 : 0,
    acceptedWords: outcome === 'accepted_full' ? 6 : 0,
    intent: 'natural',
    outcome,
    deletedAfterMs: null,
    createdAt: now,
    ...overrides,
  };
}

// ── Hash computation (même logique que extractProjectFullText + hashText) ─────

function extractTipTapText(json: unknown): string {
  if (!json || typeof json !== 'object') return '';
  const node = json as Record<string, unknown>;
  if (node.type === 'text' && typeof node.text === 'string') return node.text;
  if (Array.isArray(node.content)) {
    return node.content
      .map(extractTipTapText)
      .join(node.type === 'paragraph' ? '\n' : ' ');
  }
  return '';
}

export function computeChapterHash(): string {
  const text = extractTipTapText(JSON.parse(TEST_CHAPTER_CONTENT));
  const fullText = `# ${TEST_CHAPTER_TITLE}\n\n${text}`;
  return crypto.createHash('sha256').update(fullText, 'utf8').digest('hex');
}

// ── Spell-check project document ──────────────────────────────────────────────

// Clean French text, no AI provider needed. The editor autosaves typed text back
// to this chapter, so spell-check tests must re-seed it before each test to avoid
// previously-typed misspellings accumulating in the shared chapter.
function buildSpellCheckProject(past: Date, now: Date): Record<string, unknown> {
  const spellcheckChapterText = 'La vieille bibliothèque sentait le bois.';
  return {
    _id: TEST_SPELLCHECK_PROJECT_ID,
    ownerId: TEST_USER_ID,
    title: 'Projet Test Orthographe',
    chapters: [{
      id: TEST_SPELLCHECK_CHAPTER_ID,
      title: 'Chapitre Ortho',
      content: JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: spellcheckChapterText }] }],
      }),
      order: 0,
      metadata: { wordCount: 6, characterCount: 40, lastEdited: past },
    }],
    activeChapterId: TEST_SPELLCHECK_CHAPTER_ID,
    providerId: null,
    createdAt: past,
    updatedAt: now,
    isPublished: false,
    shareToken: null,
    publishedAt: null,
    publishedChapterIds: null,
  };
}

// Re-seed only the spell-check project to its clean state. Used in a beforeEach so
// each spell-check test starts from the same chapter content regardless of what
// previous tests typed and autosaved.
export async function seedSpellCheckProject(): Promise<void> {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(MONGODB_DB_NAME);
    const past = new Date('2025-01-01T10:00:00Z');
    const now = new Date();
    await db.collection('projects').replaceOne(
      { _id: TEST_SPELLCHECK_PROJECT_ID } as object,
      buildSpellCheckProject(past, now),
      { upsert: true }
    );
  } finally {
    await client.close();
  }
}

// ── Realistic manuscript generator (cold/hot perf fixture) ──────────────────────

// A chapter opens with an H1 (so the title is read from the body per profile 0017 and
// each chapter break-before: page starts a fresh page) followed by several dense
// paragraphs. Deterministic content keeps pagination — and therefore page offsets and
// the perf profile — stable across runs.
function buildLargeChapterContent(chapterNumber: number, paragraphCount: number): string {
  const filler =
    'La lumière déclinait lentement sur les toits de la vieille ville tandis que les cloches ' +
    'égrenaient les heures. Chacun portait en soi le poids des mots tus et des promesses à ' +
    'tenir, et la nuit venue rendait plus vives encore les silences entre les êtres. ';
  return JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: `Chapitre ${chapterNumber}` }],
      },
      ...Array.from({ length: paragraphCount }, (_, i) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: `${filler.repeat(4)}(§${chapterNumber}.${i + 1})` }],
      })),
    ],
  });
}

// ── Seed all test fixtures ────────────────────────────────────────────────────

export async function seedAll(): Promise<void> {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB_NAME);
  const past = new Date('2025-01-01T10:00:00Z');
  const now = new Date();

  // 1. Test user (approved, known password)
  const passwordHash = await bcrypt.hash(TEST_USER_PASSWORD, 10);
  await db.collection('users').replaceOne(
    { _id: TEST_USER_ID } as object,
    {
      _id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      passwordHash,
      name: 'Test E2E Stratégie IA',
      isApproved: true,
      isAdmin: false,
      createdAt: past,
      updatedAt: now,
    },
    { upsert: true }
  );

  // 2. Test project with one chapter
  await db.collection('projects').replaceOne(
    { _id: TEST_PROJECT_ID } as object,
    {
      _id: TEST_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Projet Test Stratégie IA',
      chapters: [{
        id: TEST_CHAPTER_ID,
        title: TEST_CHAPTER_TITLE,
        content: TEST_CHAPTER_CONTENT,
        order: 0,
        metadata: { wordCount: 9, characterCount: 51, lastEdited: past },
      }],
      activeChapterId: TEST_CHAPTER_ID,
      providerId: null,
      createdAt: past,
      updatedAt: now,
      isPublished: false,
      shareToken: null,
      publishedAt: null,
      publishedChapterIds: null,
    },
    { upsert: true }
  );

  // 2b. Separate project for autocomplete E2E tests. It is intentionally isolated from
  // the AI-strategy project because those tests edit their own manuscript in parallel.
  await db.collection('projects').replaceOne(
    { _id: TEST_AUTOCOMPLETE_PROJECT_ID } as object,
    {
      _id: TEST_AUTOCOMPLETE_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Projet Test Autocomplétion',
      chapters: [{
        id: TEST_AUTOCOMPLETE_CHAPTER_ID,
        title: TEST_AUTOCOMPLETE_CHAPTER_TITLE,
        content: TEST_AUTOCOMPLETE_CHAPTER_CONTENT,
        order: 0,
        metadata: { wordCount: 8, characterCount: 64, lastEdited: past },
      }],
      activeChapterId: TEST_AUTOCOMPLETE_CHAPTER_ID,
      providerId: TEST_PROVIDER_ID,
      createdAt: past,
      updatedAt: now,
      isPublished: false,
      shareToken: null,
      publishedAt: null,
      publishedChapterIds: null,
    },
    { upsert: true }
  );

  // 2c. Valid provider fixture so AI UI controls are visible in E2E tests.
  // The fake key is encrypted because the provider repository decrypts on list.
  const encryptedProviderKey = encryptApiKey('sk-e2e-fake-provider-key');
  await db.collection('providers').replaceOne(
    { _id: TEST_PROVIDER_ID } as object,
    {
      _id: TEST_PROVIDER_ID,
      ownerId: TEST_USER_ID,
      name: 'Provider E2E',
      type: 'openai',
      encryptedApiKey: encryptedProviderKey.encryptedData,
      encryptionIV: encryptedProviderKey.iv,
      authTag: encryptedProviderKey.authTag,
      model: 'gpt-4o-mini',
      isValid: true,
      lastTested: now,
      createdAt: past,
      updatedAt: now,
    },
    { upsert: true }
  );

  // 2c-bis. Spell-check project — clean French text, no AI provider needed.
  await db.collection('projects').replaceOne(
    { _id: TEST_SPELLCHECK_PROJECT_ID } as object,
    buildSpellCheckProject(past, now),
    { upsert: true }
  );

  // 2d. Project settings for the autocomplete project. learnFromRejections must be true
  // so the editor wires the telemetry sender (onEvent); the default is false, which would
  // silence all lifecycle telemetry the autocomplete E2E tests assert on.
  await db.collection('project_settings').replaceOne(
    { _id: new ObjectId(TEST_AUTOCOMPLETE_SETTINGS_ID) },
    {
      _id: new ObjectId(TEST_AUTOCOMPLETE_SETTINGS_ID),
      projectId: TEST_AUTOCOMPLETE_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Projet Test Autocomplétion',
      summary: '',
      genre: '',
      synopsis: '',
      contributors: [],
      relatedWorks: [],
      createdAt: past,
      updatedAt: now,
      autocompleteEnabled: true,
      autocompleteSuggestionLength: 'medium',
      autocompleteAudace: 'balanced',
      autocompleteLearnFromRejections: true,
      autocompletePartialAcceptance: true,
      autocompleteSmartPrefetch: true,
    },
    { upsert: true }
  );

  // 3. Research document (sentinelle unique pour vérifier l'injection de contexte)
  const researchDocId = new ObjectId(TEST_RESEARCH_DOC_ID);
  await db.collection('researchDocuments').replaceOne(
    { _id: researchDocId },
    {
      _id: researchDocId,
      projectId: TEST_PROJECT_ID,
      ownerId: TEST_USER_ID,
      type: 'note',
      title: 'Plan du roman E2E',
      content: { text: 'Héroïne : Éliane Vaucresson, horlogère de nuit ayant hérité de l\'atelier.' },
      url: null,
      sourceTitle: null,
      sourceAuthor: null,
      tags: [],
      linkedChapterIds: [],
      createdAt: past,
      updatedAt: past,
    },
    { upsert: true }
  );

  // 4. Métadonnée PÉRIMÉE (hash ne correspond pas au chapitre)
  const staleMetaContent = JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'analyse des personnages' }] }],
  });
  await db.collection('project_metadata').replaceOne(
    { _id: TEST_META_STALE_ID } as object,
    {
      _id: TEST_META_STALE_ID,
      projectId: TEST_PROJECT_ID,
      ownerId: TEST_USER_ID,
      typeKey: 'characters',
      title: 'Personnages',
      content: staleMetaContent,
      structuredData: null,
      properties: {
        wordCount: 3,
        characterCount: 23,
        lastEdited: past,
        generatedAt: past,
        isGenerated: true,
        contentHash: 'intentionally-stale-this-hash-does-not-match-the-chapter-content',
      },
      createdAt: past,
      updatedAt: past,
    },
    { upsert: true }
  );

  // 5. Métadonnée FRAÎCHE (hash correspond exactement au contenu du chapitre)
  const freshHash = computeChapterHash();
  const freshMetaContent = JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'analyse narrative fraîche' }] }],
  });
  await db.collection('project_metadata').replaceOne(
    { _id: TEST_META_FRESH_ID } as object,
    {
      _id: TEST_META_FRESH_ID,
      projectId: TEST_PROJECT_ID,
      ownerId: TEST_USER_ID,
      typeKey: 'narrative-analysis',
      title: 'Analyse Narrative',
      content: freshMetaContent,
      structuredData: null,
      properties: {
        wordCount: 3,
        characterCount: 25,
        lastEdited: past,
        generatedAt: past,
        isGenerated: true,
        contentHash: freshHash,
      },
      createdAt: past,
      updatedAt: past,
    },
    { upsert: true }
  );

  // 7. Canon stale project — one chapter, one derived fact with a wrong contentHash.
  //    checkCanonFreshnessAction compares fact.contentHash with hashText(projectFullText).
  //    Using a sentinel string guarantees a mismatch → isStale = true.
  const canonStaleChapterText = 'Madeleine ouvrit la porte avec précaution.';
  const canonStaleChapterContent = JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: canonStaleChapterText }] }],
  });
  await db.collection('projects').replaceOne(
    { _id: TEST_CANON_STALE_PROJECT_ID } as object,
    {
      _id: TEST_CANON_STALE_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Projet Canon Périmé',
      chapters: [{
        id: TEST_CANON_STALE_CHAPTER_ID,
        title: 'Chapitre 1',
        content: canonStaleChapterContent,
        order: 0,
        metadata: { wordCount: 6, characterCount: 42, lastEdited: past },
      }],
      activeChapterId: TEST_CANON_STALE_CHAPTER_ID,
      providerId: TEST_PROVIDER_ID,
      createdAt: past,
      updatedAt: now,
      isPublished: false,
      shareToken: null,
      publishedAt: null,
      publishedChapterIds: null,
    },
    { upsert: true }
  );
  // Seed a derived fact with a stale contentHash (does not match real chapter hash)
  await db.collection('canonFacts').deleteMany({
    ownerId: TEST_USER_ID,
    projectId: TEST_CANON_STALE_PROJECT_ID,
  });
  await db.collection('canonFacts').insertOne({
    _id: new ObjectId(),
    ownerId: TEST_USER_ID,
    projectId: TEST_CANON_STALE_PROJECT_ID,
    entity: 'Madeleine',
    statement: 'ouvre la porte',
    validFromChapter: 0,
    validToChapter: null,
    source: 'derived',
    sourceChapterId: TEST_CANON_STALE_CHAPTER_ID,
    contentHash: 'stale-sentinel-does-not-match-real-hash',
    category: 1,
    createdAt: past,
    updatedAt: past,
  });

  // 8. Canon session-end project — project with session-end extraction mode.
  const canonSessionChapterText = 'Le détective attendait dans l\'ombre.';
  const canonSessionChapterContent = JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: canonSessionChapterText }] }],
  });
  await db.collection('projects').replaceOne(
    { _id: TEST_CANON_SESSION_PROJECT_ID } as object,
    {
      _id: TEST_CANON_SESSION_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Projet Canon Session',
      chapters: [{
        id: TEST_CANON_SESSION_CHAPTER_ID,
        title: 'Chapitre 1',
        content: canonSessionChapterContent,
        order: 0,
        metadata: { wordCount: 6, characterCount: 37, lastEdited: past },
      }],
      activeChapterId: TEST_CANON_SESSION_CHAPTER_ID,
      providerId: TEST_PROVIDER_ID,
      createdAt: past,
      updatedAt: now,
      isPublished: false,
      shareToken: null,
      publishedAt: null,
      publishedChapterIds: null,
    },
    { upsert: true }
  );
  await db.collection('project_settings').replaceOne(
    { _id: new ObjectId(TEST_CANON_SESSION_SETTINGS_ID) },
    {
      _id: new ObjectId(TEST_CANON_SESSION_SETTINGS_ID),
      projectId: TEST_CANON_SESSION_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Projet Canon Session',
      summary: '',
      genre: '',
      synopsis: '',
      contributors: [],
      relatedWorks: [],
      createdAt: past,
      updatedAt: now,
      autocompleteEnabled: true,
      autocompleteSuggestionLength: 'medium',
      autocompleteAudace: 'balanced',
      autocompleteLearnFromRejections: false,
      autocompletePartialAcceptance: true,
      autocompleteSmartPrefetch: false,
      canonExtractionMode: 'session-end',
    },
    { upsert: true }
  );

  // 5b. Book-preview project — two chapters for whole-book aperçu tests.
  const bookPreviewChapter1Content = JSON.stringify({
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'La nuit tombait sur la vieille ville quand Élise poussa la porte de la librairie.' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Les rayonnages débordaient de livres anciens dont certains n\'avaient pas été ouverts depuis des décennies.' }] },
    ],
  });
  const bookPreviewChapter2Content = JSON.stringify({
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Le lendemain matin, la lumière dorée filtrait à travers les rideaux de dentelle.' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Élise se souvint du livre mystérieux qu\'elle avait découvert la veille et se leva précipitamment.' }] },
    ],
  });
  await db.collection('projects').replaceOne(
    { _id: TEST_BOOK_PREVIEW_PROJECT_ID } as object,
    {
      _id: TEST_BOOK_PREVIEW_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Roman Test Aperçu',
      chapters: [
        {
          id: TEST_BOOK_PREVIEW_CHAPTER_1_ID,
          title: 'Chapitre 1 — La Librairie',
          content: bookPreviewChapter1Content,
          order: 0,
          metadata: { wordCount: 25, characterCount: 165, lastEdited: past },
        },
        {
          id: TEST_BOOK_PREVIEW_CHAPTER_2_ID,
          title: 'Chapitre 2 — Le Lendemain',
          content: bookPreviewChapter2Content,
          order: 1,
          metadata: { wordCount: 22, characterCount: 155, lastEdited: past },
        },
      ],
      activeChapterId: TEST_BOOK_PREVIEW_CHAPTER_1_ID,
      providerId: null,
      createdAt: past,
      updatedAt: now,
      isPublished: false,
      shareToken: null,
      publishedAt: null,
      publishedChapterIds: null,
    },
    { upsert: true }
  );

  // 5c. Passerelle project — its active profile is passerelle, which has no whole-book
  //     preview (the button/PDF is hidden). Needs a project_settings doc carrying the profile.
  await db.collection('projects').replaceOne(
    { _id: TEST_BOOK_PREVIEW_PASSERELLE_PROJECT_ID } as object,
    {
      _id: TEST_BOOK_PREVIEW_PASSERELLE_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Roman Test Passerelle',
      chapters: [{
        id: TEST_BOOK_PREVIEW_PASSERELLE_CHAPTER_ID,
        title: 'Chapitre 1',
        content: bookPreviewChapter1Content,
        order: 0,
        metadata: { wordCount: 25, characterCount: 165, lastEdited: past },
      }],
      activeChapterId: TEST_BOOK_PREVIEW_PASSERELLE_CHAPTER_ID,
      providerId: null,
      createdAt: past,
      updatedAt: now,
      isPublished: false,
      shareToken: null,
      publishedAt: null,
      publishedChapterIds: null,
    },
    { upsert: true }
  );
  await db.collection('project_settings').replaceOne(
    { _id: new ObjectId(TEST_BOOK_PREVIEW_PASSERELLE_SETTINGS_ID) },
    {
      _id: new ObjectId(TEST_BOOK_PREVIEW_PASSERELLE_SETTINGS_ID),
      projectId: TEST_BOOK_PREVIEW_PASSERELLE_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Roman Test Passerelle',
      summary: '',
      genre: '',
      synopsis: '',
      contributors: [],
      relatedWorks: [],
      createdAt: past,
      updatedAt: now,
      publicationProfileId: 'passerelle',
    },
    { upsert: true }
  );

  // 5d. Realistic manuscript for the cold/hot rendering-budget test.
  await db.collection('projects').replaceOne(
    { _id: TEST_BOOK_PREVIEW_LARGE_PROJECT_ID } as object,
    {
      _id: TEST_BOOK_PREVIEW_LARGE_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Grand Roman Test Aperçu',
      chapters: Array.from({ length: TEST_BOOK_PREVIEW_LARGE_CHAPTER_COUNT }, (_, i) => ({
        id: `e2e-book-preview-large-ch-${String(i + 1).padStart(3, '0')}`,
        title: `Chapitre ${i + 1}`,
        content: buildLargeChapterContent(i + 1, 12),
        order: i,
        metadata: { wordCount: 600, characterCount: 3600, lastEdited: past },
      })),
      activeChapterId: 'e2e-book-preview-large-ch-001',
      providerId: null,
      createdAt: past,
      updatedAt: now,
      isPublished: false,
      shareToken: null,
      publishedAt: null,
      publishedChapterIds: null,
    },
    { upsert: true }
  );

  // 6. Autocomplete telemetry fixtures for cockpit usage metrics.
  await db.collection('autocompleteEvents').deleteMany({
    ownerId: TEST_USER_ID,
    projectId: TEST_AUTOCOMPLETE_PROJECT_ID,
  });
  await db.collection('autocompleteEvents').insertMany([
    autocompleteEvent('accepted-1', 'accepted_full', {
      firstTokenMs: 100,
      totalMs: 500,
    }),
    autocompleteEvent('accepted-2', 'accepted_full', {
      firstTokenMs: 200,
      totalMs: 700,
      deletedAfterMs: 4200,
    }),
    autocompleteEvent('partial-1', 'accepted_partial', {
      firstTokenMs: 300,
      totalMs: 900,
      acceptedChars: 12,
      acceptedWords: 2,
    }),
    autocompleteEvent('rejected-1', 'rejected_escape', {
      firstTokenMs: 400,
      totalMs: 1100,
    }),
    autocompleteEvent('superseded-1', 'superseded_typing', {
      firstTokenMs: 500,
      totalMs: 1300,
    }),
    autocompleteEvent('empty-1', 'empty', {
      totalMs: 300,
    }),
  ]);

  await client.close();
}

// ── Cleanup : supprime tous les docs de test par ownerId ──────────────────────

export async function cleanupAll(): Promise<void> {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB_NAME);

  await Promise.all([
    db.collection('users').deleteOne({ _id: TEST_USER_ID } as object),
    db.collection('projects').deleteMany({ ownerId: TEST_USER_ID }),
    db.collection('providers').deleteMany({ ownerId: TEST_USER_ID }),
    db.collection('project_metadata').deleteMany({ ownerId: TEST_USER_ID }),
    db.collection('project_settings').deleteMany({ ownerId: TEST_USER_ID }),
    db.collection('researchDocuments').deleteMany({ ownerId: TEST_USER_ID }),
    db.collection('autocompleteEvents').deleteMany({ ownerId: TEST_USER_ID }),
    db.collection('canonFacts').deleteMany({ ownerId: TEST_USER_ID }),
    db.collection('canonExtractionState').deleteMany({ ownerId: TEST_USER_ID }),
    db.collection('book_preview_cache').deleteMany({ ownerId: TEST_USER_ID }),
  ]);

  // Whole-book preview PDFs live in a GridFS bucket (files + chunks); remove both.
  await dropBookPreviewPdfs(db, { 'metadata.ownerId': TEST_USER_ID });

  await client.close();
}

// Delete GridFS PDF blobs (files + their chunks) matching a metadata filter.
async function dropBookPreviewPdfs(
  db: import('mongodb').Db,
  filter: Record<string, unknown>
): Promise<void> {
  const files = await db.collection('book_preview_pdf.files').find(filter).toArray();
  if (files.length === 0) return;
  const ids = files.map((f) => f._id);
  await db.collection('book_preview_pdf.chunks').deleteMany({ files_id: { $in: ids } });
  await db.collection('book_preview_pdf.files').deleteMany({ _id: { $in: ids } });
}

// Force a cold cache for one project: remove its cached metrics + PDF so the next
// open re-generates. Used by the cold/hot rendering-budget E2E test.
export async function clearBookPreviewCache(projectId: string): Promise<void> {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(MONGODB_DB_NAME);
    await db.collection('book_preview_cache').deleteMany({ projectId });
    await dropBookPreviewPdfs(db, { 'metadata.projectId': projectId });
  } finally {
    await client.close();
  }
}
