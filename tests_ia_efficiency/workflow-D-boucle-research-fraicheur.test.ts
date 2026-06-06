// ABOUTME: Tests automatisés — Workflow D : Boucle research → écriture → fraîcheur
// ABOUTME: Vérifie l'Acte 2 (univers injecté) + l'Acte 3 (péremption/régénération) + invalidation de contexte

import { describe, it, expect, vi } from 'vitest';
import { AIContextBuilder } from '@/application/services/AIContextBuilder';
import { GenerateNarrativeAnalysisUseCase } from '@/application/use-cases/GenerateNarrativeAnalysisUseCase';
import { CheckMetadataFreshnessUseCase } from '@/application/use-cases/CheckMetadataFreshnessUseCase';
import { ProjectMetadata } from '@/domain/entities/ProjectMetadata';
import { ResearchDocument } from '@/domain/entities/ResearchDocument';

// Sentinelles du Workflow D — absentes du manuscrit, présentes uniquement dans la bible d'univers
const BIBLE_UNIVERS_V1 = [
  'La planète Xérion tourne autour d\'un soleil double, l\'un rouge et l\'autre bleu.',
  'La monnaie locale s\'appelle les éclats — pièces de verre taillé.',
  'Les ramasseurs patrouillent les dômes après la pluie d\'acide.',
  'Règle d\'or : on ne prête jamais sa combinaison, sous aucun prétexte.',
].join('\n');

// Version modifiée : la monnaie a changé
const BIBLE_UNIVERS_V2 = BIBLE_UNIVERS_V1.replace(
  's\'appelle les éclats — pièces de verre taillé',
  's\'appelle les ombres — brumes solidifiées'
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const chapterJson = (text: string) =>
  JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  });

const note = (title: string, body: string) =>
  ResearchDocument.create('doc-' + title, 'p1', 'u1', 'note', title, {
    content: { text: body },
  });

const emptyMetaRepo = () => ({
  findByProjectId: vi.fn().mockResolvedValue([]),
  create: vi.fn(),
  findById: vi.fn(),
  findByProjectAndType: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteByProjectId: vi.fn(),
  deleteAllByOwner: vi.fn(),
});

const mockResearchRepo = (docs: ResearchDocument[]) => ({
  findByProjectId: vi.fn().mockResolvedValue(docs),
  create: vi.fn(),
  findById: vi.fn(),
  countByProjectId: vi.fn(),
  getAllTags: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteAllByProject: vi.fn(),
  deleteAllByOwner: vi.fn(),
});

// ─── Harness generate + check ─────────────────────────────────────────────────

function buildFreshnessHarness() {
  let chapterText = 'Kael porta sa combinaison de protection contre la pluie corrosive.';
  const chapter = {
    getTitle: () => 'Chapitre 1',
    getContent: () => chapterJson(chapterText),
  };
  const project = { id: 'p1', getChapters: () => [chapter] };

  const store: ProjectMetadata[] = [];
  const metadataRepo = {
    create: vi.fn((_: string, m: ProjectMetadata) => { store.push(m); return Promise.resolve(m); }),
    update: vi.fn((_: string, m: ProjectMetadata) => Promise.resolve(m)),
    findById: vi.fn(),
    findByProjectId: vi.fn(() => Promise.resolve(store)),
    findByProjectAndType: vi.fn(() => Promise.resolve(store[0] ?? null)),
    delete: vi.fn(),
    deleteByProjectId: vi.fn(),
    deleteAllByOwner: vi.fn(),
  };

  const projectRepo = {
    loadProject: vi.fn(() => Promise.resolve(project)),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    listProjects: vi.fn(),
    deleteAllByOwner: vi.fn(),
  };

  const llm = {
    generateRewrites: vi.fn(),
    testConnection: vi.fn(),
    getProviderName: vi.fn().mockReturnValue('Mock'),
    getModel: vi.fn().mockReturnValue('mock-model'),
    generateNarrativeAnalysis: vi.fn().mockResolvedValue({
      narratorType: 'Troisième personne',
      focalization: 'Externe',
      temporality: 'Présent',
      chapterStructure: 'Linéaire',
      narrativeVoice: ['Ton neutre', 'Style concis'],
      summary: 'résumé',
    }),
  };
  const idGen = { generate: vi.fn().mockReturnValue('m1') };

  const generate = new GenerateNarrativeAnalysisUseCase(
    metadataRepo as never,
    projectRepo as never,
    llm as never,
    idGen as never
  );
  const check = new CheckMetadataFreshnessUseCase(
    metadataRepo as never,
    projectRepo as never
  );

  return {
    store,
    editChapter: (text: string) => { chapterText = text; },
    generate: () => generate.execute({ ownerId: 'u1', projectId: 'p1' }),
    check: () => check.execute({ ownerId: 'u1', projectId: 'p1' }),
  };
}

// ─── Tests Acte 2 — La bible nourrit le contexte IA ──────────────────────────

describe('Workflow D — Acte 2 : la bible d\'univers nourrit le contexte de complétion', () => {
  it('les sentinelles de la bible apparaissent dans le contexte de complétion', async () => {
    const docs = [note('Bible d\'univers', BIBLE_UNIVERS_V1)];
    const builder = new AIContextBuilder(
      emptyMetaRepo() as never,
      mockResearchRepo(docs) as never
    );

    const ctx = await builder.buildCompletionContext('u1', 'p1');

    expect(ctx).toContain('Xérion');
    expect(ctx).toContain('éclats');
    expect(ctx).toContain('ramasseurs');
    expect(ctx).toContain('combinaison');
  });

  it('les sentinelles de la bible apparaissent dans le contexte de génération de chapitre', async () => {
    const docs = [note('Bible d\'univers', BIBLE_UNIVERS_V1)];
    const builder = new AIContextBuilder(
      emptyMetaRepo() as never,
      mockResearchRepo(docs) as never
    );

    const ctx = await builder.buildChapterContext('u1', 'p1');

    expect(ctx).toContain('Xérion');
    expect(ctx).toContain('pluie d\'acide');
  });

  it('sans bible de recherche, les sentinelles sont absentes du contexte', async () => {
    const builder = new AIContextBuilder(emptyMetaRepo() as never);

    const ctx = await builder.buildCompletionContext('u1', 'p1');

    expect(ctx).not.toContain('Xérion');
    expect(ctx).not.toContain('éclats');
  });
});

// ─── Tests Acte 2 — Invalidation de contexte à l'édition de la bible ─────────

describe('Workflow D — Boucle : éditer la bible se répercute immédiatement sur le contexte', () => {
  it('la monnaie «éclats» → «ombres» après modification de la bible', async () => {
    const ctxV1 = await new AIContextBuilder(
      emptyMetaRepo() as never,
      mockResearchRepo([note('Bible d\'univers', BIBLE_UNIVERS_V1)]) as never
    ).buildCompletionContext('u1', 'p1');

    const ctxV2 = await new AIContextBuilder(
      emptyMetaRepo() as never,
      mockResearchRepo([note('Bible d\'univers', BIBLE_UNIVERS_V2)]) as never
    ).buildCompletionContext('u1', 'p1');

    expect(ctxV1).toContain('éclats');
    expect(ctxV1).not.toContain('ombres');
    expect(ctxV2).toContain('ombres');
    expect(ctxV2).not.toContain('éclats');
  });
});

// ─── Tests Acte 3 — Péremption et régénération ───────────────────────────────

describe('Workflow D — Acte 3 : péremption visible après enrichissement du manuscrit', () => {
  it('juste après génération, la fiche est fraîche', async () => {
    const h = buildFreshnessHarness();
    await h.generate();

    const result = await h.check();

    expect(h.store[0].isGenerated()).toBe(true);
    expect(result[0].isStale).toBe(false);
  });

  it('après enrichissement du chapitre, la fiche devient périmée', async () => {
    const h = buildFreshnessHarness();
    await h.generate();

    h.editChapter(
      'Kael porta sa combinaison. Au coin de la rue, un vieux ramasseur lui tendit la main ' +
      'et demanda quelques éclats. Le soleil double projetait deux ombres sur le dôme.'
    );

    const result = await h.check();
    expect(result[0].isStale).toBe(true);
  });

  it('après régénération, la fiche redevient fraîche', async () => {
    const h = buildFreshnessHarness();
    await h.generate();

    h.editChapter(
      'Kael porta sa combinaison. Le soleil rouge et le soleil bleu se couchaient ensemble.'
    );
    expect((await h.check())[0].isStale).toBe(true);

    await h.generate();

    const result = await h.check();
    expect(result[0].isStale).toBe(false);
  });
});
