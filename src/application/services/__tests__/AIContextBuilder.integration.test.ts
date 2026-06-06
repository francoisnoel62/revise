// ABOUTME: Integration tests for AIContextBuilder using real MongoDB repositories
// ABOUTME: Validates context building with actual data persistence — no mocks

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { AIContextBuilder } from '../AIContextBuilder';
import { MongoDBMetadataRepository } from '@/infrastructure/persistence/MongoDBMetadataRepository';
import { MongoDBResearchDocumentRepository } from '@/infrastructure/persistence/MongoDBResearchDocumentRepository';
import { MongoDBProjectRepository } from '@/infrastructure/persistence/MongoDBProjectRepository';
import { CheckMetadataFreshnessUseCase } from '@/application/use-cases/CheckMetadataFreshnessUseCase';
import { ProjectMetadata } from '@/domain/entities/ProjectMetadata';
import { ResearchDocument } from '@/domain/entities/ResearchDocument';
import { getDatabase, closeDatabase } from '@/infrastructure/config/database';
import type { Db } from 'mongodb';
import { hashText } from '@/application/utils/text-hash';
import { extractProjectFullText } from '@/application/services/project-text';

// ── Test data helpers ─────────────────────────────────────────────────────────

function makeChapterContent(text: string): string {
  return JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  });
}

function seedProjectDoc(ownerId: string, projectId: string, chapterText: string) {
  return {
    _id: projectId,
    ownerId,
    title: 'Test Integration Project',
    chapters: [{
      id: `${projectId}-ch1`,
      title: 'Chapitre 1',
      content: makeChapterContent(chapterText),
      order: 0,
      metadata: { wordCount: 5, characterCount: 30, lastEdited: new Date() },
    }],
    activeChapterId: `${projectId}-ch1`,
    providerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublished: false,
    shareToken: null,
    publishedAt: null,
    publishedChapterIds: null,
  };
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('AIContextBuilder — intégration MongoDB réel', () => {
  let db: Db;
  let ownerId: string;
  let projectId: string;
  let metaRepo: MongoDBMetadataRepository;
  let researchRepo: MongoDBResearchDocumentRepository;

  beforeEach(async () => {
    db = await getDatabase();
    ownerId = `test-integration-${randomUUID()}`;
    projectId = `test-proj-${randomUUID()}`;
    metaRepo = new MongoDBMetadataRepository(db);
    researchRepo = new MongoDBResearchDocumentRepository(db);
  });

  afterEach(async () => {
    await Promise.all([
      db.collection('project_metadata').deleteMany({ ownerId }),
      db.collection('researchDocuments').deleteMany({ ownerId }),
      db.collection('projects').deleteMany({ ownerId }),
    ]);
  });

  it('le contexte de complétion contient le texte d\'une note de recherche', async () => {
    const docId = new ObjectId().toHexString();
    const doc = ResearchDocument.create(docId, projectId, ownerId, 'note', 'Plan du roman', {
      content: { text: 'Héroïne : Éliane Vaucresson, horlogère de nuit.' },
    });
    await researchRepo.create(ownerId, doc);

    const builder = new AIContextBuilder(metaRepo, researchRepo);
    const ctx = await builder.buildCompletionContext(ownerId, projectId);

    expect(ctx).toContain('Éliane Vaucresson');
    expect(ctx).toContain('Plan du roman');
  });

  it('une note liée à un autre chapitre est exclue du contexte de complétion du chapitre courant', async () => {
    const globalId = new ObjectId().toHexString();
    const linkedId = new ObjectId().toHexString();

    const globalDoc = ResearchDocument.create(globalId, projectId, ownerId, 'note', 'Note globale', {
      content: { text: 'Héroïne : Éliane Vaucresson' },
    });
    const linkedDoc = ResearchDocument.create(linkedId, projectId, ownerId, 'note', 'Note ch-2', {
      content: { text: 'Noor Bachir révèle le secret au chapitre 2' },
      linkedChapterIds: ['ch-2'],
    });

    await researchRepo.create(ownerId, globalDoc);
    await researchRepo.create(ownerId, linkedDoc);

    const builder = new AIContextBuilder(metaRepo, researchRepo);
    const ctx = await builder.buildCompletionContext(ownerId, projectId, 'ch-1');

    expect(ctx).toContain('Éliane Vaucresson');
    expect(ctx).not.toContain('Noor Bachir');
  });

  it('quand la métadonnée a été éditée, le contexte utilise le texte édité (pas les données structurées)', async () => {
    const editedContent = makeChapterContent('Marguerite : yeux VIOLETS, injectés de mauve.');
    const ficheEditee = new ProjectMetadata(`${projectId}-meta`, projectId, 'characters', 'Personnages', editedContent, {
      isGenerated: true,
      generatedAt: new Date('2025-01-01T10:00:00Z'),
      lastEdited: new Date('2025-06-01T12:00:00Z'),  // après generatedAt → wasEditedSinceGeneration=true
      contentHash: 'old-hash',
      structuredData: JSON.stringify({ characterProfiles: [{ name: 'Marguerite', identity: 'yeux bleus' }] }),
    });
    await metaRepo.create(ownerId, ficheEditee);

    const builder = new AIContextBuilder(metaRepo);
    const ctx = await builder.buildCompletionContext(ownerId, projectId);

    expect(ctx).toContain('VIOLETS');
    expect(ctx).not.toContain('yeux bleus');
    expect(ctx).toContain("édité par l'auteur");
  });

  it('quand la métadonnée n\'a pas été éditée, le contexte utilise les données structurées', async () => {
    const now = new Date();
    const freshContent = makeChapterContent('analyse structurée');
    const ficheGeneree = new ProjectMetadata(`${projectId}-meta2`, projectId, 'characters', 'Personnages', freshContent, {
      isGenerated: true,
      generatedAt: now,
      lastEdited: now,  // même timestamp → wasEditedSinceGeneration=false
      contentHash: 'any-hash',
      structuredData: JSON.stringify({ characterProfiles: [{ name: 'Marguerite', identity: 'yeux bleus, protagoniste' }] }),
    });
    await metaRepo.create(ownerId, ficheGeneree);

    const builder = new AIContextBuilder(metaRepo);
    const ctx = await builder.buildCompletionContext(ownerId, projectId);

    expect(ctx).toContain('Marguerite');
    expect(ctx).not.toContain("édité par l'auteur");
  });
});

// ── CheckMetadataFreshnessUseCase ─────────────────────────────────────────────

describe('CheckMetadataFreshnessUseCase — intégration MongoDB réel', () => {
  let db: Db;
  let ownerId: string;
  let projectId: string;
  let metaRepo: MongoDBMetadataRepository;
  let projectRepo: MongoDBProjectRepository;

  beforeEach(async () => {
    db = await getDatabase();
    ownerId = `test-integration-${randomUUID()}`;
    projectId = `test-proj-${randomUUID()}`;
    metaRepo = new MongoDBMetadataRepository(db);
    projectRepo = new MongoDBProjectRepository(db);
  });

  afterEach(async () => {
    await Promise.all([
      db.collection('project_metadata').deleteMany({ ownerId }),
      db.collection('projects').deleteMany({ ownerId }),
    ]);
  });

  it('retourne isStale=false pour une métadonnée dont le hash correspond au chapitre', async () => {
    const chapterText = 'Marguerite avait les yeux bleus.';
    await db.collection('projects').insertOne(seedProjectDoc(ownerId, projectId, chapterText) as object);

    const chapters = [{ getTitle: () => 'Chapitre 1', getContent: () => makeChapterContent(chapterText) }];
    const freshHash = hashText(extractProjectFullText(chapters));

    const meta = ProjectMetadata.createGenerated(`${projectId}-m1`, projectId, 'characters', 'Personnages',
      makeChapterContent('analyse'), freshHash, '{}');
    await metaRepo.create(ownerId, meta);

    const useCase = new CheckMetadataFreshnessUseCase(metaRepo, projectRepo);
    const result = await useCase.execute({ ownerId, projectId });

    expect(result.find(r => r.typeKey === 'characters')?.isStale).toBe(false);
  });

  it('retourne isStale=true quand le hash stocké ne correspond pas au chapitre actuel', async () => {
    const currentText = 'Marguerite avait les yeux bleus et un sourire triste.';
    await db.collection('projects').insertOne(seedProjectDoc(ownerId, projectId, currentText) as object);

    const meta = ProjectMetadata.createGenerated(`${projectId}-m2`, projectId, 'characters', 'Personnages',
      makeChapterContent('analyse'), 'stale-hash-does-not-match', '{}');
    await metaRepo.create(ownerId, meta);

    const useCase = new CheckMetadataFreshnessUseCase(metaRepo, projectRepo);
    const result = await useCase.execute({ ownerId, projectId });

    expect(result.find(r => r.typeKey === 'characters')?.isStale).toBe(true);
  });

  it('une annexe éditoriale (Dédicace) n\'est jamais périmée', async () => {
    await db.collection('projects').insertOne(
      seedProjectDoc(ownerId, projectId, 'Marguerite avait les yeux bleus.') as object
    );

    const dedicace = ProjectMetadata.createEmpty(`${projectId}-ded`, projectId, 'dedication', 'Dédicace');
    await metaRepo.create(ownerId, dedicace);

    const useCase = new CheckMetadataFreshnessUseCase(metaRepo, projectRepo);
    const result = await useCase.execute({ ownerId, projectId });

    expect(result.find(r => r.typeKey === 'dedication')?.isStale).toBe(false);
  });
});
