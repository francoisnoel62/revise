// ABOUTME: Tests automatisés — Workflow A : Du plan à la prose
// ABOUTME: Vérifie que les notes de recherche (contexte intentionnel) alimentent le contexte IA de complétion

import { describe, it, expect, vi } from 'vitest';
import { AIContextBuilder } from '@/application/services/AIContextBuilder';
import { ResearchDocument } from '@/domain/entities/ResearchDocument';

// Helpers

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

const note = (
  title: string,
  body: string,
  opts: { linkedChapterIds?: string[] } = {}
) =>
  ResearchDocument.create('id-' + title, 'p1', 'u1', 'note', title, {
    content: { text: body },
    linkedChapterIds: opts.linkedChapterIds,
  });

// Sentinelles du Workflow A — absentes du manuscrit, présentes uniquement dans le plan
const PLAN_DU_ROMAN = [
  'Héroïne : Éliane Vaucresson, horlogère de nuit ayant hérité de l\'atelier de son père.',
  'Personnage secondaire : Silas Greffe, vieux maître horloger au regard d\'acier.',
  'Objet clé : la montre à treize heures — le treizième chiffre n\'existe nulle part ailleurs.',
  'Lieu : Brumes-sur-Loire, ville perpétuellement brumeuse où le temps semble suspendu.',
].join('\n');

describe('Workflow A — Du plan à la prose : injection du contexte intentionnel', () => {
  it('le contexte de complétion contient les sentinelles issues du plan de recherche', async () => {
    const docs = [note('Plan du roman', PLAN_DU_ROMAN)];
    const builder = new AIContextBuilder(
      emptyMetaRepo() as never,
      mockResearchRepo(docs) as never
    );

    const ctx = await builder.buildCompletionContext('u1', 'p1');

    expect(ctx).toContain('Éliane Vaucresson');
    expect(ctx).toContain('Silas Greffe');
    expect(ctx).toContain('treize heures');
    expect(ctx).toContain('Brumes-sur-Loire');
  });

  it('les notes globales et les notes du chapitre en cours sont incluses, pas les autres chapitres', async () => {
    const docs = [
      note('Plan global', 'intention générale : Éliane Vaucresson cherche la vérité sur son père'),
      note('Note ch-1', 'scène : Silas Greffe remet la montre à Éliane', { linkedChapterIds: ['ch-1'] }),
      note('Note ch-2', 'scène : Noor Bachir révèle le secret', { linkedChapterIds: ['ch-2'] }),
    ];
    const builder = new AIContextBuilder(
      emptyMetaRepo() as never,
      mockResearchRepo(docs) as never
    );

    const ctx = await builder.buildCompletionContext('u1', 'p1', 'ch-1');

    expect(ctx).toContain('Éliane Vaucresson');
    expect(ctx).toContain('Silas Greffe');
    expect(ctx).not.toContain('Noor Bachir');
  });

  it('sans chapterId, seules les notes globales sont incluses', async () => {
    const docs = [
      note('Plan global', 'intention globale : la montre à treize heures'),
      note('Note ch-1', 'Silas Greffe apparaît', { linkedChapterIds: ['ch-1'] }),
    ];
    const builder = new AIContextBuilder(
      emptyMetaRepo() as never,
      mockResearchRepo(docs) as never
    );

    const ctx = await builder.buildCompletionContext('u1', 'p1');

    expect(ctx).toContain('treize heures');
    expect(ctx).not.toContain('Silas Greffe');
  });

  it('modifier le corps de la note se répercute immédiatement dans le contexte (pas de cache persistant)', async () => {
    const docV1 = [note('Plan du roman', 'Héroïne : Éliane Vaucresson')];
    const docV2 = [note('Plan du roman', 'Héroïne : Noor Bachir (renommée par l\'auteur)')];

    const ctxV1 = await new AIContextBuilder(
      emptyMetaRepo() as never,
      mockResearchRepo(docV1) as never
    ).buildCompletionContext('u1', 'p1');

    const ctxV2 = await new AIContextBuilder(
      emptyMetaRepo() as never,
      mockResearchRepo(docV2) as never
    ).buildCompletionContext('u1', 'p1');

    expect(ctxV1).toContain('Éliane Vaucresson');
    expect(ctxV1).not.toContain('Noor Bachir');
    expect(ctxV2).toContain('Noor Bachir');
    expect(ctxV2).not.toContain('Éliane Vaucresson');
  });

  it('la génération de chapitre inclut toutes les notes (globales + tous chapitres liés)', async () => {
    const docs = [
      note('Plan global', 'Brumes-sur-Loire, ville de la montre à treize heures'),
      note('Note ch-1', 'Éliane rencontre Silas Greffe au chapitre 1', { linkedChapterIds: ['ch-1'] }),
      note('Note ch-2', 'La montre révèle le treizième chiffre', { linkedChapterIds: ['ch-2'] }),
    ];
    const builder = new AIContextBuilder(
      emptyMetaRepo() as never,
      mockResearchRepo(docs) as never
    );

    const ctx = await builder.buildChapterContext('u1', 'p1');

    expect(ctx).toContain('Brumes-sur-Loire');
    expect(ctx).toContain('Silas Greffe');
    expect(ctx).toContain('treizième chiffre');
  });
});
