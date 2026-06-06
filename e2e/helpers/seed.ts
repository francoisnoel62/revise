// ABOUTME: MongoDB seeding utilities for E2E tests — creates and removes test fixtures
// ABOUTME: All test entities use ownerId TEST_USER_ID for easy cleanup by ownerId

import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'revise';

// ── Fixed test identifiers (known at test-write time) ──────────────────────────

export const TEST_USER_ID = 'e2e-strategy-user-001';
export const TEST_USER_EMAIL = 'e2e-strategy@revise.test';
export const TEST_USER_PASSWORD = 'TestE2E2025!';
export const TEST_PROJECT_ID = 'e2e-strategy-project-001';
export const TEST_CHAPTER_ID = 'e2e-strategy-chapter-001';
export const TEST_META_STALE_ID = 'e2e-strategy-meta-stale';
export const TEST_META_FRESH_ID = 'e2e-strategy-meta-fresh';
// Fixed 24-char hex ObjectId for the seeded research document
export const TEST_RESEARCH_DOC_ID = '6475a8f3c1234567890abcde';

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
    db.collection('project_metadata').deleteMany({ ownerId: TEST_USER_ID }),
    db.collection('researchDocuments').deleteMany({ ownerId: TEST_USER_ID }),
  ]);

  await client.close();
}
