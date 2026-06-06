// ABOUTME: Tests automatisés — Workflow B : L'auteur corrige, l'IA suit
// ABOUTME: Vérifie la règle "édition manuelle fait foi" (Acte 1) et la péremption visible (Acte 3)

import { describe, it, expect, vi } from 'vitest';
import { AIContextBuilder } from '@/application/services/AIContextBuilder';
import { CheckMetadataFreshnessUseCase } from '@/application/use-cases/CheckMetadataFreshnessUseCase';
import { ProjectMetadata } from '@/domain/entities/ProjectMetadata';
import { extractProjectFullText } from '@/application/services/project-text';
import { hashText } from '@/application/utils/text-hash';

// Helpers

const chapterJson = (text: string) =>
  JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  });

const metaContentJson = JSON.stringify({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'analyse' }] }],
});

const makeMetadata = (opts: {
  structuredData?: string | null;
  edited?: boolean;
  contentText?: string;
}) => ({
  getTypeKey: () => 'characters',
  getStructuredData: () => opts.structuredData ?? null,
  wasEditedSinceGeneration: () => opts.edited ?? false,
  getContentText: () => opts.contentText ?? '',
});

const mockMetaRepo = (items: ReturnType<typeof makeMetadata>[]) => ({
  findByProjectId: vi.fn().mockResolvedValue(items),
  create: vi.fn(),
  findById: vi.fn(),
  findByProjectAndType: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteByProjectId: vi.fn(),
  deleteAllByOwner: vi.fn(),
});

const metadataRepo = (items: ProjectMetadata[]) => ({
  findByProjectId: vi.fn().mockResolvedValue(items),
  create: vi.fn(),
  findById: vi.fn(),
  findByProjectAndType: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteByProjectId: vi.fn(),
  deleteAllByOwner: vi.fn(),
});

const projectRepo = (project: unknown) => ({
  loadProject: vi.fn().mockResolvedValue(project),
  createProject: vi.fn(),
  listProjects: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
});

// Manuscrit original : Marguerite a les yeux bleus
const MANUSCRIT_ORIGINAL = 'Marguerite avait les yeux bleus et un sourire triste.';
// Ajout d'un paragraphe pour déclencher la péremption
const MANUSCRIT_ETENDU =
  'Marguerite avait les yeux bleus et un sourire triste. Le facteur passa sans s\'arrêter.';

describe('Workflow B — L\'auteur corrige, l\'IA suit', () => {
  describe('Acte 1 — Édition manuelle fait foi : l\'IA lit la version éditée', () => {
    it('quand l\'auteur a édité la fiche, le contexte IA utilise le texte édité, pas les données structurées', async () => {
      // L'auteur a généré "yeux bleus" puis manuellement corrigé en "yeux VIOLETS"
      const ficheEditee = makeMetadata({
        structuredData: JSON.stringify({ characterProfiles: [{ name: 'Marguerite', identity: 'yeux bleus' }] }),
        edited: true,
        contentText: 'Marguerite : yeux VIOLETS, injectés de mauve — édition manuelle de l\'auteur.',
      });

      const builder = new AIContextBuilder(mockMetaRepo([ficheEditee]) as never);
      const ctx = await builder.buildCompletionContext('u1', 'p1');

      // La fiche éditée doit apparaître avec son contenu édité
      expect(ctx).toContain('VIOLETS');
      expect(ctx).toContain('mauve');
      // La donnée structurée initiale (yeux bleus) ne doit PAS apparaître
      expect(ctx).not.toContain('yeux bleus');
      // Le marqueur "édité par l'auteur" doit être présent
      expect(ctx).toContain("édité par l'auteur");
    });

    it('quand la fiche n\'a pas été éditée, le contexte IA utilise les données structurées', async () => {
      const ficheGeneree = makeMetadata({
        structuredData: JSON.stringify({ characterProfiles: [{ name: 'Marguerite', identity: 'yeux bleus, protagoniste' }] }),
        edited: false,
      });

      const builder = new AIContextBuilder(mockMetaRepo([ficheGeneree]) as never);
      const ctx = await builder.buildCompletionContext('u1', 'p1');

      expect(ctx).toContain('Marguerite');
      expect(ctx).not.toContain("édité par l'auteur");
    });
  });

  describe('Acte 3 — Péremption : le manuscrit change, les fiches se signalent', () => {
    it('une fiche générée non-éditée devient périmée quand le manuscrit change', async () => {
      const chapters = [{ getTitle: () => 'Ch1', getContent: () => chapterJson(MANUSCRIT_ORIGINAL) }];
      const originalHash = hashText(extractProjectFullText(chapters));

      const ficheGeneree = ProjectMetadata.createGenerated(
        'm-characters', 'p1', 'characters', 'Personnages', metaContentJson,
        originalHash, '{}'
      );

      // Le manuscrit s'allonge → nouveau hash
      const chapitresEtendus = [{ getTitle: () => 'Ch1', getContent: () => chapterJson(MANUSCRIT_ETENDU) }];
      const project = { getChapters: () => chapitresEtendus };

      const useCase = new CheckMetadataFreshnessUseCase(
        metadataRepo([ficheGeneree]) as never,
        projectRepo(project) as never
      );

      const result = await useCase.execute({ ownerId: 'u1', projectId: 'p1' });

      expect(result[0].isStale).toBe(true);
    });

    it('une fiche éditée par l\'auteur n\'est JAMAIS périmée — même si le manuscrit a changé', async () => {
      const ficheEditeeApresGeneration = new ProjectMetadata(
        'm-edited', 'p1', 'characters', 'Personnages', metaContentJson,
        {
          isGenerated: true,
          generatedAt: new Date('2025-01-01T10:00:00Z'),
          lastEdited: new Date('2025-06-01T12:00:00Z'), // édité bien après la génération
          contentHash: 'hash-ancien',                    // manuscrit a changé depuis
          structuredData: '{}',
        }
      );

      const chapitresEtendus = [{ getTitle: () => 'Ch1', getContent: () => chapterJson(MANUSCRIT_ETENDU) }];
      const project = { getChapters: () => chapitresEtendus };

      const useCase = new CheckMetadataFreshnessUseCase(
        metadataRepo([ficheEditeeApresGeneration]) as never,
        projectRepo(project) as never
      );

      const result = await useCase.execute({ ownerId: 'u1', projectId: 'p1' });

      expect(result[0].isStale).toBe(false);
    });

    it('une annexe éditoriale (Dédicace) n\'est jamais marquée périmée', async () => {
      const dedicace = ProjectMetadata.createEmpty('m-dedicace', 'p1', 'dedication', 'Dédicace');

      const chapters = [{ getTitle: () => 'Ch1', getContent: () => chapterJson(MANUSCRIT_ETENDU) }];
      const project = { getChapters: () => chapters };

      const useCase = new CheckMetadataFreshnessUseCase(
        metadataRepo([dedicace]) as never,
        projectRepo(project) as never
      );

      const result = await useCase.execute({ ownerId: 'u1', projectId: 'p1' });

      expect(result[0].isStale).toBe(false);
    });
  });

  describe('Cohérence globale — les deux règles sont compatibles', () => {
    it('la fiche éditée est à la fois exclue de la péremption ET utilise le texte édité dans le contexte', async () => {
      // Même entité testée sous deux angles : staleness + context injection

      const ficheEditee = new ProjectMetadata(
        'm-edited', 'p1', 'characters', 'Personnages', metaContentJson,
        {
          isGenerated: true,
          generatedAt: new Date('2025-01-01T10:00:00Z'),
          lastEdited: new Date('2025-06-01T12:00:00Z'),
          contentHash: 'hash-ancien',
          structuredData: JSON.stringify({
            characterProfiles: [{ name: 'Marguerite', identity: 'yeux bleus' }],
          }),
        }
      );

      // Angle 1 : la fiche n'est pas périmée
      const chapters = [{ getTitle: () => 'Ch1', getContent: () => chapterJson(MANUSCRIT_ETENDU) }];
      const project = { getChapters: () => chapters };
      const freshnessUseCase = new CheckMetadataFreshnessUseCase(
        metadataRepo([ficheEditee]) as never,
        projectRepo(project) as never
      );
      const freshnessResult = await freshnessUseCase.execute({ ownerId: 'u1', projectId: 'p1' });
      expect(freshnessResult[0].isStale).toBe(false);

      // Angle 2 : AIContextBuilder utilise le texte édité (wasEditedSinceGeneration=true car lastEdited > generatedAt)
      const metaMock = makeMetadata({
        structuredData: JSON.stringify({ characterProfiles: [{ name: 'Marguerite', identity: 'yeux bleus' }] }),
        edited: true,
        contentText: 'Marguerite : yeux VIOLETS, injectés de mauve.',
      });
      const builder = new AIContextBuilder(mockMetaRepo([metaMock]) as never);
      const ctx = await builder.buildCompletionContext('u1', 'p1');
      expect(ctx).toContain('VIOLETS');
      expect(ctx).not.toContain('yeux bleus');
    });
  });
});
