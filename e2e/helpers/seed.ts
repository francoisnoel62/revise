// ABOUTME: MongoDB seeding utilities for E2E tests — creates and removes test fixtures
// ABOUTME: All test entities use ownerId TEST_USER_ID for easy cleanup by ownerId

import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { encryptApiKey } from '../../src/infrastructure/encryption/crypto';
import type { SnapshotDocument } from '../../src/infrastructure/persistence/snapshot-serializer';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'revise';

interface AutomaticSnapshotScheduleFixture {
  _id: string;
  ownerId: string;
  projectId: string;
  intervalMinutes: 5;
  changedAt: Date | null;
  nextDueAt: Date | null;
  changeRevision: number;
  leaseUntil: Date | null;
}

// ── Fixed test identifiers (known at test-write time) ──────────────────────────

export const TEST_USER_ID = 'e2e-strategy-user-001';
export const TEST_USER_EMAIL = 'e2e-strategy@revise.test';
export const TEST_USER_PASSWORD = 'TestE2E2025!';
export const TEST_PROJECT_ID = 'e2e-strategy-project-001';
export const TEST_CHAPTER_ID = 'e2e-strategy-chapter-001';
export const TEST_LEVEL_STYLES_PROJECT_ID = 'e2e-level-styles-project-001';
export const TEST_LEVEL_STYLES_CHAPTER_ID = 'e2e-level-styles-chapter-001';
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

// Book-preview E2E fixture: five liminaires followed by two deliberately short chapters.
// The second chapter needs a physical blank verso before its recto opening. It guards KDP
// Roman liminaire folios and body-page counting after blank versos.
export const TEST_BOOK_PREVIEW_PAGINATION_PROJECT_ID = 'e2e-book-preview-pagination-001';
export const TEST_BOOK_PREVIEW_PAGINATION_CHAPTER_1_ID = 'e2e-book-preview-pagination-chapter-001';
export const TEST_BOOK_PREVIEW_PAGINATION_CHAPTER_2_ID = 'e2e-book-preview-pagination-chapter-002';
export const TEST_BOOK_PREVIEW_PAGINATION_SETTINGS_ID = '6475a8f3c1234567890abce8';
export const TEST_BOOK_PREVIEW_PAGINATION_DEDICATION_ID = 'e2e-book-preview-pagination-dedication';
export const TEST_BOOK_PREVIEW_PAGINATION_EPIGRAPH_ID = 'e2e-book-preview-pagination-epigraph';

// Book-preview E2E fixtures — a chapter whose title heading carries the editor's default
// inline textAlign ('justify'). Guards the regression where that inline style out-specified
// the profile's centering and rendered chapter titles left-aligned in the whole-book PDF.
export const TEST_BOOK_PREVIEW_ALIGN_PROJECT_ID = 'e2e-book-preview-align-001';
export const TEST_BOOK_PREVIEW_ALIGN_CHAPTER_ID = 'e2e-book-preview-align-ch-001';
export const TEST_BOOK_PREVIEW_ALIGN_TITLE = 'Titre Centre Par Le Profil';

// Book-preview E2E fixtures — passerelle project (no whole-book preview)
export const TEST_BOOK_PREVIEW_PASSERELLE_PROJECT_ID = 'e2e-book-preview-passerelle-001';
export const TEST_BOOK_PREVIEW_PASSERELLE_CHAPTER_ID = 'e2e-book-preview-passerelle-ch-001';
export const TEST_BOOK_PREVIEW_PASSERELLE_SETTINGS_ID = '6475a8f3c1234567890abce1';

// Book-preview E2E fixtures — configurable sommaire (tocDepth: chapters-and-subtitles, tocStyle: litteraire)
export const TEST_BOOK_PREVIEW_TOC_PROJECT_ID = 'e2e-book-preview-toc-001';
export const TEST_BOOK_PREVIEW_TOC_CHAPTER_1_ID = 'e2e-book-preview-toc-chapter-001';
export const TEST_BOOK_PREVIEW_TOC_CHAPTER_2_ID = 'e2e-book-preview-toc-chapter-002';
export const TEST_BOOK_PREVIEW_TOC_SETTINGS_ID = '6475a8f3c1234567890abce2';
export const TEST_BOOK_PREVIEW_TOC_SUBTITLE = 'Le Secret Retrouvé';

// Book-preview E2E fixtures — a "realistic" multi-page manuscript for the cold/hot perf
// test. Sized to render in a handful of seconds (CI-safe) while still exercising real
// front matter + TOC + a multi-page body with per-chapter page offsets. It is a smaller,
// deterministic stand-in for the production target of a ~300-400 page novel.
export const TEST_BOOK_PREVIEW_LARGE_PROJECT_ID = 'e2e-book-preview-large-001';
export const TEST_BOOK_PREVIEW_LARGE_CHAPTER_COUNT = 6;

// Snapshots E2E fixtures — one chapter, no settings, for manual snapshot create/list coverage.
export const TEST_SNAPSHOT_PROJECT_ID = 'e2e-snapshot-project-001';
export const TEST_SNAPSHOT_CHAPTER_ID = 'e2e-snapshot-chapter-001';
export const TEST_SNAPSHOT_CHAPTER_TEXT = 'Le phare veillait seul sur la côte déserte.';

// Automatic snapshot fixture — its server-side due time is deliberately in the past.
// Opening the editor sends the heartbeat that turns it into a real automatic snapshot.
export const TEST_AUTOMATIC_SNAPSHOT_PROJECT_ID = 'e2e-automatic-snapshot-project-001';
export const TEST_AUTOMATIC_SNAPSHOT_CHAPTER_ID = 'e2e-automatic-snapshot-chapter-001';

// Snapshot-restore E2E fixtures — a pre-existing v1 snapshot plus a diverged live chapter,
// so restoring exercises both the safety-snapshot path and the chapter/metadata restore.
export const TEST_RESTORE_PROJECT_ID = 'e2e-restore-project-001';
export const TEST_RESTORE_CHAPTER_ID = 'e2e-restore-chapter-001';
export const TEST_RESTORE_SNAPSHOT_ID = 'e2e-restore-snapshot-v1';
export const TEST_RESTORE_SETTINGS_ID = '6475a8f3c1234567890abce3';
export const TEST_RESTORE_ORIGINAL_TITLE = 'Chapitre Original';
export const TEST_RESTORE_ORIGINAL_TEXT = 'Le vent soufflait sur la lande déserte.';
export const TEST_RESTORE_ORIGINAL_GENRE = 'Fantasy';
export const TEST_RESTORE_DIVERGED_TITLE = 'Chapitre Modifié';
export const TEST_RESTORE_DIVERGED_TEXT = 'Le soleil brillait sur la plage animée.';

// Endnotes E2E fixtures — one chapter carrying a single endnote call whose rich body holds a
// unique sentinel word, for the reading-preview bubble + call-colour checks and the Notes-title
// setting round-trip. The endnoteRef node stores its note body inline in attrs.content, exactly
// as the editor persists it.
export const TEST_ENDNOTE_PROJECT_ID = 'e2e-endnote-project-001';
export const TEST_ENDNOTE_CHAPTER_ID = 'e2e-endnote-chapter-001';
export const TEST_ENDNOTE_NOTE_SENTINEL = 'Lugdunum';
// A second chapter, added AFTER the first so activeChapterId (chapter 1) and the existing
// endnotes.spec.ts assertions are undisturbed — used to prove the endnotes panel lists notes
// across chapters, not just the active one.
export const TEST_ENDNOTE_CHAPTER_2_ID = 'e2e-endnote-chapter-002';
export const TEST_ENDNOTE_CHAPTER_2_TITLE = 'Chapitre 2';
export const TEST_ENDNOTE_NOTE_2_SENTINEL = 'Massalia';

// Dedicated projects for the endnotes panel's edit/delete E2E tests — separate from
// TEST_ENDNOTE_PROJECT_ID (shared by read-only assertions above) so a mutating test never
// disturbs a sibling test's expectations on the same seeded document.
export const TEST_ENDNOTE_PANEL_EDIT_PROJECT_ID = 'e2e-endnote-panel-edit-001';
export const TEST_ENDNOTE_PANEL_EDIT_CHAPTER_ID = 'e2e-endnote-panel-edit-chapter-001';
export const TEST_ENDNOTE_PANEL_EDIT_NOTE_SENTINEL = 'Tolosa';

export const TEST_ENDNOTE_PANEL_DELETE_PROJECT_ID = 'e2e-endnote-panel-delete-001';
export const TEST_ENDNOTE_PANEL_DELETE_CHAPTER_ID = 'e2e-endnote-panel-delete-chapter-001';
export const TEST_ENDNOTE_PANEL_DELETE_NOTE_SENTINEL = 'Nemausus';

// A two-chapter project, chapter 1 active, whose second (inactive) chapter carries a note —
// for the E2E proving that editing a non-active chapter's note from the panel switches to it
// and resolves against its own document. Its own project so the chapter switch this test
// triggers never disturbs TEST_ENDNOTE_PROJECT_ID's activeChapterId used by sibling tests.
export const TEST_ENDNOTE_PANEL_CROSS_CHAPTER_PROJECT_ID = 'e2e-endnote-panel-cross-001';
export const TEST_ENDNOTE_PANEL_CROSS_CHAPTER_1_ID = 'e2e-endnote-panel-cross-chapter-001';
export const TEST_ENDNOTE_PANEL_CROSS_CHAPTER_2_ID = 'e2e-endnote-panel-cross-chapter-002';
export const TEST_ENDNOTE_PANEL_CROSS_CHAPTER_2_TITLE = 'Chapitre 2';
export const TEST_ENDNOTE_PANEL_CROSS_NOTE_2_SENTINEL = 'Burdigala';

// Book-preview E2E fixtures — a genuinely large manuscript (~90k words / ~200 pages),
// matching the production target. Seeded ON DEMAND by the opt-in heavy test (not in
// seedAll), so routine runs stay fast; exercises the real cold-generation cost.
export const TEST_BOOK_PREVIEW_HUGE_PROJECT_ID = 'e2e-book-preview-huge-001';
export const TEST_BOOK_PREVIEW_HUGE_CHAPTER_COUNT = 20;
export const TEST_BOOK_PREVIEW_HUGE_PARAGRAPHS_PER_CHAPTER = 70;

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
        attrs: { level: 1, semanticRole: 'titre-de-chapitre' },
        content: [{ type: 'text', text: `Chapitre ${chapterNumber}` }],
      },
      {
        type: 'heading',
        attrs: { level: 2, semanticRole: 'sous-titre' },
        content: [{ type: 'text', text: `Section ${chapterNumber}` }],
      },
      ...Array.from({ length: paragraphCount }, (_, i) => ({
        type: 'paragraph',
        attrs: { semanticRole: 'corps' },
        content: [{ type: 'text', text: `${filler.repeat(4)}(§${chapterNumber}.${i + 1})` }],
      })),
    ],
  });
}

// Re-seed only the snapshots project's chapter content, and clear any snapshots/counters
// left over from a previous run. Used in a beforeEach so the manual-snapshot E2E journey
// (which asserts on absolute numbers v1/v2) stays idempotent across repeated local runs.
export async function resetSnapshotFixture(): Promise<void> {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(MONGODB_DB_NAME);
    const past = new Date('2025-01-01T10:00:00Z');
    const now = new Date();
    await db.collection('projects').replaceOne(
      { _id: TEST_SNAPSHOT_PROJECT_ID } as object,
      {
        _id: TEST_SNAPSHOT_PROJECT_ID,
        ownerId: TEST_USER_ID,
        title: 'Roman Test Snapshots',
        chapters: [{
          id: TEST_SNAPSHOT_CHAPTER_ID,
          title: 'Chapitre 1',
          content: JSON.stringify({
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: TEST_SNAPSHOT_CHAPTER_TEXT }] }],
          }),
          order: 0,
          metadata: { wordCount: 7, characterCount: 44, lastEdited: past },
        }],
        activeChapterId: TEST_SNAPSHOT_CHAPTER_ID,
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
    await db.collection('snapshots').deleteMany({ ownerId: TEST_USER_ID, projectId: TEST_SNAPSHOT_PROJECT_ID });
    await db.collection('snapshotCounters').deleteMany({ _id: TEST_SNAPSHOT_PROJECT_ID } as object);
  } finally {
    await client.close();
  }
}

export async function resetAutomaticSnapshotFixture(
  chapterContent = JSON.stringify({
    type: 'doc',
    content: [{
      type: 'paragraph',
      attrs: { semanticRole: 'corps' },
      content: [{ type: 'text', text: 'Un changement déjà sauvegardé.' }],
    }],
  }),
): Promise<void> {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(MONGODB_DB_NAME);
    const now = new Date();
    const past = new Date(now.getTime() - 10 * 60_000);
    await db.collection('projects').replaceOne(
      { _id: TEST_AUTOMATIC_SNAPSHOT_PROJECT_ID } as object,
      {
        _id: TEST_AUTOMATIC_SNAPSHOT_PROJECT_ID,
        ownerId: TEST_USER_ID,
        title: 'Roman Test Snapshots Automatiques',
        chapters: [{
          id: TEST_AUTOMATIC_SNAPSHOT_CHAPTER_ID,
          title: 'Chapitre 1',
          content: chapterContent,
          order: 0,
          metadata: { wordCount: 4, characterCount: 31, lastEdited: past },
        }],
        activeChapterId: TEST_AUTOMATIC_SNAPSHOT_CHAPTER_ID,
        providerId: null,
        createdAt: past,
        updatedAt: past,
        isPublished: false,
        shareToken: null,
        publishedAt: null,
        publishedChapterIds: null,
      },
      { upsert: true },
    );
    await Promise.all([
      db.collection('snapshots').deleteMany({ ownerId: TEST_USER_ID, projectId: TEST_AUTOMATIC_SNAPSHOT_PROJECT_ID }),
      db.collection('snapshotCounters').deleteMany({ _id: TEST_AUTOMATIC_SNAPSHOT_PROJECT_ID } as object),
      db.collection('automaticSnapshotSessions').deleteMany({ ownerId: TEST_USER_ID, projectId: TEST_AUTOMATIC_SNAPSHOT_PROJECT_ID }),
    ]);
    await db.collection<AutomaticSnapshotScheduleFixture>('automaticSnapshotSchedules').replaceOne(
      { _id: `${TEST_USER_ID}:${TEST_AUTOMATIC_SNAPSHOT_PROJECT_ID}` },
      {
        ownerId: TEST_USER_ID,
        projectId: TEST_AUTOMATIC_SNAPSHOT_PROJECT_ID,
        intervalMinutes: 5,
        changedAt: past,
        nextDueAt: past,
        changeRevision: 1,
        leaseUntil: null,
      },
      { upsert: true },
    );
  } finally {
    await client.close();
  }
}

// Re-seed the restore project to a known state: a pre-existing, immutable v1 snapshot
// (inserted directly, bypassing the UI) capturing the "original" chapter + genre, while
// the live project/settings documents already carry "diverged" content — i.e. the state
// a real author would be in after editing since their last snapshot. Used in a beforeEach
// so the restore E2E journey's absolute v1/v2/v3 assertions stay valid across re-runs.
export async function resetRestoreFixture(): Promise<void> {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(MONGODB_DB_NAME);
    const past = new Date('2025-01-01T10:00:00Z');
    const snapshotCreatedAt = new Date('2025-06-01T10:00:00Z');
    const now = new Date();

    const originalContent = JSON.stringify({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: TEST_RESTORE_ORIGINAL_TEXT }] },
        { type: 'horizontalRule' },
      ],
    });
    const divergedContent = JSON.stringify({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: TEST_RESTORE_DIVERGED_TEXT }] }],
    });

    await db.collection('projects').replaceOne(
      { _id: TEST_RESTORE_PROJECT_ID } as object,
      {
        _id: TEST_RESTORE_PROJECT_ID,
        ownerId: TEST_USER_ID,
        title: 'Roman Test Restauration',
        chapters: [{
          id: TEST_RESTORE_CHAPTER_ID,
          title: TEST_RESTORE_DIVERGED_TITLE,
          content: divergedContent,
          order: 0,
          metadata: { wordCount: 6, characterCount: 40, lastEdited: now },
        }],
        activeChapterId: TEST_RESTORE_CHAPTER_ID,
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
      { _id: new ObjectId(TEST_RESTORE_SETTINGS_ID) },
      {
        _id: new ObjectId(TEST_RESTORE_SETTINGS_ID),
        projectId: TEST_RESTORE_PROJECT_ID,
        ownerId: TEST_USER_ID,
        title: 'Roman Test Restauration',
        summary: '',
        genre: 'Romance',
        synopsis: '',
        contributors: [],
        relatedWorks: [],
        createdAt: past,
        updatedAt: now,
      },
      { upsert: true }
    );

    await db.collection('snapshots').deleteMany({ ownerId: TEST_USER_ID, projectId: TEST_RESTORE_PROJECT_ID });
    await db.collection('snapshotCounters').deleteMany({ _id: TEST_RESTORE_PROJECT_ID } as object);

    await db.collection<SnapshotDocument>('snapshots').insertOne({
      _id: TEST_RESTORE_SNAPSHOT_ID,
      projectId: TEST_RESTORE_PROJECT_ID,
      ownerId: TEST_USER_ID,
      authorId: TEST_USER_ID,
      number: 1,
      type: 'manual',
      title: 'Version 1',
      comment: null,
      projectTitle: 'Roman Test Restauration',
      chapters: [{
        id: TEST_RESTORE_CHAPTER_ID,
        title: TEST_RESTORE_ORIGINAL_TITLE,
        content: originalContent,
        order: 0,
      }],
      editorialMetadata: {
        title: 'Roman Test Restauration',
        summary: '',
        genre: TEST_RESTORE_ORIGINAL_GENRE,
        synopsis: '',
        contributors: [],
        relatedWorks: [],
      },
      sourceSnapshotNumber: null,
      createdAt: snapshotCreatedAt,
    });
    await db.collection('snapshotCounters').replaceOne(
      { _id: TEST_RESTORE_PROJECT_ID } as object,
      { _id: TEST_RESTORE_PROJECT_ID, ownerId: TEST_USER_ID, seq: 1 },
      { upsert: true }
    );
  } finally {
    await client.close();
  }
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

  // 2a. Isolated semantic manuscript for per-level typography E2E coverage.
  await db.collection('projects').replaceOne(
    { _id: TEST_LEVEL_STYLES_PROJECT_ID } as object,
    {
      _id: TEST_LEVEL_STYLES_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Projet Test Typographie',
      chapters: [{
        id: TEST_LEVEL_STYLES_CHAPTER_ID,
        title: 'Chapitre Typographie',
        content: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 1, semanticRole: 'titre-de-chapitre' },
              content: [{ type: 'text', text: 'Chapitre Typographie' }],
            },
            {
              type: 'paragraph',
              attrs: { semanticRole: 'corps' },
              content: [{ type: 'text', text: 'Un manuscrit pour vérifier la typographie.' }],
            },
          ],
        }),
        order: 0,
        metadata: { wordCount: 7, characterCount: 51, lastEdited: past },
      }],
      activeChapterId: TEST_LEVEL_STYLES_CHAPTER_ID,
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

  // 5b-bis. Alignment-regression project — a single chapter whose H1 title heading carries
  //         the editor's default inline textAlign:'justify'. In the whole-book PDF the profile's
  //         [data-semantic-role="titre-de-chapitre"] centering must win: the pipeline strips
  //         inline presentation attrs, so a single-line title renders centered, not left.
  const bookPreviewAlignContent = JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1, semanticRole: 'titre-de-chapitre', textAlign: 'justify' },
        content: [{ type: 'text', text: TEST_BOOK_PREVIEW_ALIGN_TITLE }],
      },
      {
        type: 'paragraph',
        attrs: { semanticRole: 'corps', textAlign: 'justify' },
        content: [{ type: 'text', text: 'La nuit tombait sur la vieille ville quand tout bascula.' }],
      },
    ],
  });
  await db.collection('projects').replaceOne(
    { _id: TEST_BOOK_PREVIEW_ALIGN_PROJECT_ID } as object,
    {
      _id: TEST_BOOK_PREVIEW_ALIGN_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Roman Test Alignement',
      chapters: [{
        id: TEST_BOOK_PREVIEW_ALIGN_CHAPTER_ID,
        title: TEST_BOOK_PREVIEW_ALIGN_TITLE,
        content: bookPreviewAlignContent,
        order: 0,
        metadata: { wordCount: 14, characterCount: 90, lastEdited: past },
      }],
      activeChapterId: TEST_BOOK_PREVIEW_ALIGN_CHAPTER_ID,
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

  // 5b-ter. KDP pagination-regression project: five front-matter sections followed by
  //         two one-page chapters. Chapter 2 must open two physical pages after chapter 1:
  //         chapter 1, an unnumbered blank verso, then chapter 2. That blank must still
  //         advance the Arabic folio from 1 to 3.
  const paginationChapter1Content = JSON.stringify({
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1, semanticRole: 'titre-de-chapitre' }, content: [{ type: 'text', text: 'Premier chapitre bref' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Une seule page suffit à ce premier chapitre de contrôle.' }] },
    ],
  });
  const paginationChapter2Content = JSON.stringify({
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1, semanticRole: 'titre-de-chapitre' }, content: [{ type: 'text', text: 'Second chapitre bref' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Ce chapitre doit commencer sur le recto suivant.' }] },
    ],
  });
  await db.collection('projects').replaceOne(
    { _id: TEST_BOOK_PREVIEW_PAGINATION_PROJECT_ID } as object,
    {
      _id: TEST_BOOK_PREVIEW_PAGINATION_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Roman Test Pagination KDP',
      chapters: [
        {
          id: TEST_BOOK_PREVIEW_PAGINATION_CHAPTER_1_ID,
          title: 'Premier chapitre bref',
          content: paginationChapter1Content,
          order: 0,
          metadata: { wordCount: 11, characterCount: 65, lastEdited: past },
        },
        {
          id: TEST_BOOK_PREVIEW_PAGINATION_CHAPTER_2_ID,
          title: 'Second chapitre bref',
          content: paginationChapter2Content,
          order: 1,
          metadata: { wordCount: 9, characterCount: 53, lastEdited: past },
        },
      ],
      activeChapterId: TEST_BOOK_PREVIEW_PAGINATION_CHAPTER_1_ID,
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
    { _id: new ObjectId(TEST_BOOK_PREVIEW_PAGINATION_SETTINGS_ID) },
    {
      _id: new ObjectId(TEST_BOOK_PREVIEW_PAGINATION_SETTINGS_ID),
      projectId: TEST_BOOK_PREVIEW_PAGINATION_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Roman Test Pagination KDP',
      summary: '',
      genre: '',
      synopsis: '',
      contributors: [{ name: 'Autrice E2E', role: 'author' }],
      relatedWorks: [],
      createdAt: past,
      updatedAt: now,
      publicationProfileId: 'kdp-6x9',
    },
    { upsert: true }
  );
  await db.collection('project_metadata').replaceOne(
    { _id: TEST_BOOK_PREVIEW_PAGINATION_DEDICATION_ID } as object,
    {
      _id: TEST_BOOK_PREVIEW_PAGINATION_DEDICATION_ID,
      projectId: TEST_BOOK_PREVIEW_PAGINATION_PROJECT_ID,
      ownerId: TEST_USER_ID,
      typeKey: 'dedication',
      title: 'Dédicace',
      content: JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'À celles et ceux qui relisent.' }] }],
      }),
      structuredData: null,
      properties: { wordCount: 6, characterCount: 31, lastEdited: past, generatedAt: null, isGenerated: false, contentHash: null },
      createdAt: past,
      updatedAt: now,
    },
    { upsert: true }
  );
  await db.collection('project_metadata').replaceOne(
    { _id: TEST_BOOK_PREVIEW_PAGINATION_EPIGRAPH_ID } as object,
    {
      _id: TEST_BOOK_PREVIEW_PAGINATION_EPIGRAPH_ID,
      projectId: TEST_BOOK_PREVIEW_PAGINATION_PROJECT_ID,
      ownerId: TEST_USER_ID,
      typeKey: 'epigraph',
      title: 'Épigraphe',
      content: JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Un livre commence toujours avant sa première page.' }] }],
      }),
      structuredData: null,
      properties: { wordCount: 9, characterCount: 51, lastEdited: past, generatedAt: null, isGenerated: false, contentHash: null },
      createdAt: past,
      updatedAt: now,
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

  // 5d2. Configurable sommaire project — sous-titre heading + tocDepth/tocStyle settings,
  //      for the "sub-entry cliquable et navigable (#page=N)" acceptance criterion.
  const bookPreviewTocChapter1Content = JSON.stringify({
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1, semanticRole: 'titre-de-chapitre' }, content: [{ type: 'text', text: 'Chapitre 1 — La Librairie' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'La nuit tombait sur la vieille ville quand Élise poussa la porte de la librairie.' }] },
      { type: 'heading', attrs: { level: 2, semanticRole: 'sous-titre' }, content: [{ type: 'text', text: TEST_BOOK_PREVIEW_TOC_SUBTITLE }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Les rayonnages débordaient de livres anciens dont certains n\'avaient pas été ouverts depuis des décennies.' }] },
    ],
  });
  const bookPreviewTocChapter2Content = JSON.stringify({
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1, semanticRole: 'titre-de-chapitre' }, content: [{ type: 'text', text: 'Chapitre 2 — Le Lendemain' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Le lendemain matin, la lumière dorée filtrait à travers les rideaux de dentelle.' }] },
    ],
  });
  await db.collection('projects').replaceOne(
    { _id: TEST_BOOK_PREVIEW_TOC_PROJECT_ID } as object,
    {
      _id: TEST_BOOK_PREVIEW_TOC_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Roman Test Sommaire Configurable',
      chapters: [
        {
          id: TEST_BOOK_PREVIEW_TOC_CHAPTER_1_ID,
          title: 'Chapitre 1 — La Librairie',
          content: bookPreviewTocChapter1Content,
          order: 0,
          metadata: { wordCount: 30, characterCount: 200, lastEdited: past },
        },
        {
          id: TEST_BOOK_PREVIEW_TOC_CHAPTER_2_ID,
          title: 'Chapitre 2 — Le Lendemain',
          content: bookPreviewTocChapter2Content,
          order: 1,
          metadata: { wordCount: 15, characterCount: 100, lastEdited: past },
        },
      ],
      activeChapterId: TEST_BOOK_PREVIEW_TOC_CHAPTER_1_ID,
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
    { _id: new ObjectId(TEST_BOOK_PREVIEW_TOC_SETTINGS_ID) },
    {
      _id: new ObjectId(TEST_BOOK_PREVIEW_TOC_SETTINGS_ID),
      projectId: TEST_BOOK_PREVIEW_TOC_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Roman Test Sommaire Configurable',
      summary: '',
      genre: '',
      synopsis: '',
      contributors: [],
      relatedWorks: [],
      createdAt: past,
      updatedAt: now,
      publicationProfileId: 'kdp-6x9',
      tocDepth: 'chapters-and-subtitles',
      tocStyle: 'litteraire',
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

  // 5f. Snapshots project — a single chapter, no project_settings doc (exercises the
  //     null-editorial-metadata path), for manual snapshot create/list E2E coverage.
  await db.collection('projects').replaceOne(
    { _id: TEST_SNAPSHOT_PROJECT_ID } as object,
    {
      _id: TEST_SNAPSHOT_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Roman Test Snapshots',
      chapters: [{
        id: TEST_SNAPSHOT_CHAPTER_ID,
        title: 'Chapitre 1',
        content: JSON.stringify({
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: TEST_SNAPSHOT_CHAPTER_TEXT }] }],
        }),
        order: 0,
        metadata: { wordCount: 7, characterCount: 44, lastEdited: past },
      }],
      activeChapterId: TEST_SNAPSHOT_CHAPTER_ID,
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
  // Snapshot numbering must never reuse a number across test runs sharing this fixture.
  await db.collection('snapshots').deleteMany({ ownerId: TEST_USER_ID, projectId: TEST_SNAPSHOT_PROJECT_ID });
  await db.collection('snapshotCounters').deleteMany({ _id: TEST_SNAPSHOT_PROJECT_ID } as object);

  // 5e. Endnotes project — a single chapter with one endnote call carrying a rich note body.
  const endnoteChapterContent = JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Le voyageur atteignit la cité' },
          {
            type: 'endnoteRef',
            attrs: {
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'Autrefois nommée ' },
                      { type: 'text', text: TEST_ENDNOTE_NOTE_SENTINEL, marks: [{ type: 'bold' }] },
                      { type: 'text', text: ' sous l’Empire.' },
                    ],
                  },
                ],
              },
            },
          },
          { type: 'text', text: ' au crépuscule.' },
        ],
      },
    ],
  });
  // A second chapter carrying its own note, for the endnotes panel's cross-chapter listing.
  const endnoteChapter2Content = JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Un autre voyageur visita' },
          {
            type: 'endnoteRef',
            attrs: {
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'Colonie grecque devenue ' },
                      { type: 'text', text: TEST_ENDNOTE_NOTE_2_SENTINEL, marks: [{ type: 'bold' }] },
                      { type: 'text', text: '.' },
                    ],
                  },
                ],
              },
            },
          },
          { type: 'text', text: ' au printemps.' },
        ],
      },
    ],
  });

  await db.collection('projects').replaceOne(
    { _id: TEST_ENDNOTE_PROJECT_ID } as object,
    {
      _id: TEST_ENDNOTE_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Roman Test Notes de fin',
      chapters: [
        {
          id: TEST_ENDNOTE_CHAPTER_ID,
          title: 'Chapitre 1',
          content: endnoteChapterContent,
          order: 0,
          metadata: { wordCount: 8, characterCount: 55, lastEdited: past },
        },
        {
          id: TEST_ENDNOTE_CHAPTER_2_ID,
          title: TEST_ENDNOTE_CHAPTER_2_TITLE,
          content: endnoteChapter2Content,
          order: 1,
          metadata: { wordCount: 7, characterCount: 50, lastEdited: past },
        },
      ],
      activeChapterId: TEST_ENDNOTE_CHAPTER_ID,
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

  // 5f. Dedicated project for the endnotes panel's "edit" E2E test — its own project so
  // mutating the note doesn't disturb the read-only assertions above.
  const endnotePanelEditChapterContent = JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'La caravane franchit' },
          {
            type: 'endnoteRef',
            attrs: {
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'Aujourd’hui ' },
                      { type: 'text', text: TEST_ENDNOTE_PANEL_EDIT_NOTE_SENTINEL, marks: [{ type: 'bold' }] },
                      { type: 'text', text: '.' },
                    ],
                  },
                ],
              },
            },
          },
          { type: 'text', text: ' avant la nuit.' },
        ],
      },
    ],
  });
  await db.collection('projects').replaceOne(
    { _id: TEST_ENDNOTE_PANEL_EDIT_PROJECT_ID } as object,
    {
      _id: TEST_ENDNOTE_PANEL_EDIT_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Roman Test Panneau Notes — Édition',
      chapters: [{
        id: TEST_ENDNOTE_PANEL_EDIT_CHAPTER_ID,
        title: 'Chapitre 1',
        content: endnotePanelEditChapterContent,
        order: 0,
        metadata: { wordCount: 8, characterCount: 55, lastEdited: past },
      }],
      activeChapterId: TEST_ENDNOTE_PANEL_EDIT_CHAPTER_ID,
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

  // 5g. Dedicated project for the endnotes panel's "delete" E2E test — kept separate from the
  // edit project so the two mutating tests can run fully in parallel without racing.
  const endnotePanelDeleteChapterContent = JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Le marchand rejoignit' },
          {
            type: 'endnoteRef',
            attrs: {
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'De nos jours ' },
                      { type: 'text', text: TEST_ENDNOTE_PANEL_DELETE_NOTE_SENTINEL, marks: [{ type: 'bold' }] },
                      { type: 'text', text: '.' },
                    ],
                  },
                ],
              },
            },
          },
          { type: 'text', text: ' à dos de mule.' },
        ],
      },
    ],
  });
  await db.collection('projects').replaceOne(
    { _id: TEST_ENDNOTE_PANEL_DELETE_PROJECT_ID } as object,
    {
      _id: TEST_ENDNOTE_PANEL_DELETE_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Roman Test Panneau Notes — Suppression',
      chapters: [{
        id: TEST_ENDNOTE_PANEL_DELETE_CHAPTER_ID,
        title: 'Chapitre 1',
        content: endnotePanelDeleteChapterContent,
        order: 0,
        metadata: { wordCount: 8, characterCount: 55, lastEdited: past },
      }],
      activeChapterId: TEST_ENDNOTE_PANEL_DELETE_CHAPTER_ID,
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

  // 5h. Dedicated two-chapter project for the "act on a non-active chapter" E2E test — chapter 1
  // is active and note-free, chapter 2 carries the note the test targets from the panel.
  const endnotePanelCrossChapter1Content = JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Rien à signaler ici.' }] }],
  });
  const endnotePanelCrossChapter2Content = JSON.stringify({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Plus loin sur la route' },
          {
            type: 'endnoteRef',
            attrs: {
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { type: 'text', text: 'Port fluvial connu sous le nom de ' },
                      { type: 'text', text: TEST_ENDNOTE_PANEL_CROSS_NOTE_2_SENTINEL, marks: [{ type: 'bold' }] },
                      { type: 'text', text: '.' },
                    ],
                  },
                ],
              },
            },
          },
          { type: 'text', text: ' se dressait la cité.' },
        ],
      },
    ],
  });
  await db.collection('projects').replaceOne(
    { _id: TEST_ENDNOTE_PANEL_CROSS_CHAPTER_PROJECT_ID } as object,
    {
      _id: TEST_ENDNOTE_PANEL_CROSS_CHAPTER_PROJECT_ID,
      ownerId: TEST_USER_ID,
      title: 'Roman Test Panneau Notes — Chapitre non actif',
      chapters: [
        {
          id: TEST_ENDNOTE_PANEL_CROSS_CHAPTER_1_ID,
          title: 'Chapitre 1',
          content: endnotePanelCrossChapter1Content,
          order: 0,
          metadata: { wordCount: 4, characterCount: 20, lastEdited: past },
        },
        {
          id: TEST_ENDNOTE_PANEL_CROSS_CHAPTER_2_ID,
          title: TEST_ENDNOTE_PANEL_CROSS_CHAPTER_2_TITLE,
          content: endnotePanelCrossChapter2Content,
          order: 1,
          metadata: { wordCount: 8, characterCount: 55, lastEdited: past },
        },
      ],
      activeChapterId: TEST_ENDNOTE_PANEL_CROSS_CHAPTER_1_ID,
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
    db.collection('snapshots').deleteMany({ ownerId: TEST_USER_ID }),
    db.collection('snapshotCounters').deleteMany({ ownerId: TEST_USER_ID }),
    db.collection('automaticSnapshotSchedules').deleteMany({ ownerId: TEST_USER_ID }),
    db.collection('automaticSnapshotSessions').deleteMany({ ownerId: TEST_USER_ID }),
    db.collection('automaticSnapshotActivity').deleteMany({ ownerId: TEST_USER_ID }),
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

// Seed (on demand) a large ~90k-word manuscript for the opt-in heavy preview test.
// Kept out of seedAll so routine e2e runs don't pay for it. Also clears any cached
// PDF so the caller can measure a true cold generation.
export async function seedHugeManuscript(): Promise<void> {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  try {
    const db = client.db(MONGODB_DB_NAME);
    const past = new Date('2025-01-01T10:00:00Z');
    const now = new Date();
    await db.collection('projects').replaceOne(
      { _id: TEST_BOOK_PREVIEW_HUGE_PROJECT_ID } as object,
      {
        _id: TEST_BOOK_PREVIEW_HUGE_PROJECT_ID,
        ownerId: TEST_USER_ID,
        title: 'Manuscrit Volumineux Test',
        chapters: Array.from({ length: TEST_BOOK_PREVIEW_HUGE_CHAPTER_COUNT }, (_, i) => ({
          id: `e2e-book-preview-huge-ch-${String(i + 1).padStart(3, '0')}`,
          title: `Chapitre ${i + 1}`,
          content: buildLargeChapterContent(i + 1, TEST_BOOK_PREVIEW_HUGE_PARAGRAPHS_PER_CHAPTER),
          order: i,
          metadata: { wordCount: 4600, characterCount: 27600, lastEdited: past },
        })),
        activeChapterId: 'e2e-book-preview-huge-ch-001',
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
  } finally {
    await client.close();
  }
  await clearBookPreviewCache(TEST_BOOK_PREVIEW_HUGE_PROJECT_ID);
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
