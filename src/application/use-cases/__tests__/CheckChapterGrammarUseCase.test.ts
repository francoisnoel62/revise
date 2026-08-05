// ABOUTME: Integration tests for chapter grammar checking against the real French engine.
// ABOUTME: Verifies absolute ProseMirror ranges, the project rule profile, and owner isolation.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { Chapter } from '@/domain/entities/Chapter';
import { Project } from '@/domain/entities/Project';
import { ProjectSettings } from '@/domain/entities/ProjectSettings';
import type { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import type { ProjectSettingsRepository } from '@/domain/interfaces/ProjectSettingsRepository';
import { DEFAULT_FICTION_GRAMMAR_RULE_PROFILE } from '@/domain/value-objects/GrammarRuleProfile';
import type { PersonalDictionaryEntry } from '@/domain/value-objects/PersonalDictionaryEntry';
import { GrammalecteDictionaryCompiler } from '@/infrastructure/grammar/GrammalecteDictionaryCompiler';
import { GrammalecteGrammarChecker } from '@/infrastructure/grammar/GrammalecteGrammarChecker';
import { CheckChapterGrammarUseCase } from '../CheckChapterGrammarUseCase';

const OWNER_ID = 'owner-1';
const PROJECT_ID = 'project-1';
const CHAPTER_ID = 'chapter-1';

// A chapter title with an agreement error, a paragraph with another one, and a
// clean paragraph — the multi-block case the editor has to underline.
const CHAPTER_CONTENT = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Les maison closes' }] },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Les chien de la voisine sont partis.' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'La vieille bibliothèque sentait le bois.' }],
    },
  ],
};

// Minimal schema covering the fixture, used to read the text at a reported range
// exactly as ProseMirror would.
const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { content: 'inline*', group: 'block' },
    heading: { content: 'inline*', group: 'block', attrs: { level: { default: 1 } } },
    text: { group: 'inline' },
  },
});

function textAt(from: number, to: number): string {
  return ProseMirrorNode.fromJSON(schema, CHAPTER_CONTENT).textBetween(from, to);
}

function buildProject(chapters: Chapter[]): Project {
  return new Project(
    PROJECT_ID,
    OWNER_ID,
    'Roman',
    chapters,
    CHAPTER_ID,
    null,
    new Date('2026-01-01T10:00:00Z'),
    new Date('2026-01-02T10:00:00Z')
  );
}

function buildDefaultProject(): Project {
  return buildProject([
    new Chapter(CHAPTER_ID, 'Les maison closes', JSON.stringify(CHAPTER_CONTENT), 0),
  ]);
}

function buildUseCase(options?: {
  settings?: ProjectSettings | null;
  project?: Project;
}): { useCase: CheckChapterGrammarUseCase; loadedOwnerIds: string[] } {
  const loadedOwnerIds: string[] = [];
  const projectRepository = {
    loadProject: async (userId: string, projectId: string) => {
      loadedOwnerIds.push(userId);
      if (userId !== OWNER_ID || projectId !== PROJECT_ID) return null;
      return options?.project ?? buildDefaultProject();
    },
  } as unknown as ProjectRepository;

  const settingsRepository = {
    findByProjectId: async (userId: string) => {
      loadedOwnerIds.push(userId);
      return options?.settings === undefined ? null : options.settings;
    },
  } as unknown as ProjectSettingsRepository;

  return {
    useCase: new CheckChapterGrammarUseCase(
      projectRepository,
      settingsRepository,
      new GrammalecteGrammarChecker()
    ),
    loadedOwnerIds,
  };
}

describe('CheckChapterGrammarUseCase', () => {
  it('reports errors from every text block, headings included', async () => {
    const { useCase } = buildUseCase();

    const { issues } = await useCase.execute({
      ownerId: OWNER_ID,
      projectId: PROJECT_ID,
      chapterId: CHAPTER_ID,
    });

    const flagged = issues.map((issue) => textAt(issue.from, issue.to));
    expect(flagged).toContain('maison');
    expect(flagged).toContain('chien');
  });

  it('positions each error with absolute ProseMirror positions', async () => {
    const { useCase } = buildUseCase();

    const { issues } = await useCase.execute({
      ownerId: OWNER_ID,
      projectId: PROJECT_ID,
      chapterId: CHAPTER_ID,
    });

    const inHeading = issues.find((issue) => issue.text === 'maison');
    const inParagraph = issues.find((issue) => issue.text === 'chien');

    // The heading's text starts at 1; the second block's at 20.
    expect(inHeading).toMatchObject({ from: 5, to: 11 });
    expect(inParagraph).toMatchObject({ from: 24, to: 29 });
  });

  it('carries the rule family, the message and the suggestions of each error', async () => {
    const { useCase } = buildUseCase();

    const { issues } = await useCase.execute({
      ownerId: OWNER_ID,
      projectId: PROJECT_ID,
      chapterId: CHAPTER_ID,
    });

    expect(issues.find((issue) => issue.text === 'chien')).toMatchObject({
      nature: 'grammar',
      ruleFamily: 'gn',
      suggestions: ['chiens'],
    });
    expect(issues.find((issue) => issue.text === 'chien')?.message).toContain('pluriel');
  });

  it('returns issues in document order', async () => {
    const { useCase } = buildUseCase();

    const { issues } = await useCase.execute({
      ownerId: OWNER_ID,
      projectId: PROJECT_ID,
      chapterId: CHAPTER_ID,
    });

    const positions = issues.map((issue) => issue.from);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it('applies the project rule profile, silencing a disabled family', async () => {
    const settings = ProjectSettings.create(
      'settings-1',
      PROJECT_ID,
      OWNER_ID,
      'Roman'
    ).updateGrammarRuleProfile({ ...DEFAULT_FICTION_GRAMMAR_RULE_PROFILE, gn: false });
    const { useCase } = buildUseCase({ settings });

    const { issues } = await useCase.execute({
      ownerId: OWNER_ID,
      projectId: PROJECT_ID,
      chapterId: CHAPTER_ID,
    });

    expect(issues.map((issue) => issue.ruleFamily)).not.toContain('gn');
  });

  it('falls back to the fiction profile when the project has no settings', async () => {
    const { useCase } = buildUseCase({ settings: null });

    const { issues } = await useCase.execute({
      ownerId: OWNER_ID,
      projectId: PROJECT_ID,
      chapterId: CHAPTER_ID,
    });

    expect(issues.map((issue) => issue.ruleFamily)).toContain('gn');
  });

  it('reads the project and its settings for the requesting owner only', async () => {
    const { useCase, loadedOwnerIds } = buildUseCase();

    await useCase.execute({
      ownerId: OWNER_ID,
      projectId: PROJECT_ID,
      chapterId: CHAPTER_ID,
    });

    expect(loadedOwnerIds).toEqual([OWNER_ID, OWNER_ID]);
  });

  it('refuses a project owned by someone else', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({
        ownerId: 'intruder',
        projectId: PROJECT_ID,
        chapterId: CHAPTER_ID,
      })
    ).rejects.toThrow('Project not found');
  });

  it('rejects an unknown chapter', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({
        ownerId: OWNER_ID,
        projectId: PROJECT_ID,
        chapterId: 'missing',
      })
    ).rejects.toThrow('Chapter not found');
  });

  describe("the project's own vocabulary", () => {
    const INVENTED_CONTENT = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Vhardun est parti.' }] },
      ],
    };

    function buildInventedUseCase(entries: readonly PersonalDictionaryEntry[]) {
      const compiler = new GrammalecteDictionaryCompiler();
      const settings = ProjectSettings.create(
        'settings-1',
        PROJECT_ID,
        OWNER_ID,
        'Roman'
      ).updateCustomDictionary([...entries], compiler.compile(entries));

      return buildUseCase({
        settings,
        project: buildProject([
          new Chapter(CHAPTER_ID, 'Vhardun', JSON.stringify(INVENTED_CONTENT), 0),
        ]),
      }).useCase;
    }

    it('flags an agreement mistake on an invented proper noun', async () => {
      const useCase = buildInventedUseCase([
        { word: 'Vhardun', nature: 'proper-noun', gender: 'feminine' },
      ]);

      const { issues } = await useCase.execute({
        ownerId: OWNER_ID,
        projectId: PROJECT_ID,
        chapterId: CHAPTER_ID,
      });

      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        nature: 'grammar',
        ruleFamily: 'ppas',
        text: 'parti',
        suggestions: ['partie'],
      });
    });

    it('says nothing about a word the author listed without describing it', async () => {
      const useCase = buildInventedUseCase([{ word: 'Vhardun' }]);

      const { issues } = await useCase.execute({
        ownerId: OWNER_ID,
        projectId: PROJECT_ID,
        chapterId: CHAPTER_ID,
      });

      expect(issues).toEqual([]);
    });

    it('installs the automaton built on write instead of building its own', () => {
      const source = readFileSync(
        resolve(process.cwd(), 'src/application/use-cases/CheckChapterGrammarUseCase.ts'),
        'utf8'
      );

      expect(source).toMatch(/getGrammarDictionary\(\)/);
      expect(source).not.toMatch(/Compiler|compile\(/);
    });
  });

  it('returns no issue for a chapter whose content is not a document', async () => {
    const project = buildProject([new Chapter(CHAPTER_ID, 'Vide', '', 0)]);
    const { useCase } = buildUseCase({ project });

    const { issues } = await useCase.execute({
      ownerId: OWNER_ID,
      projectId: PROJECT_ID,
      chapterId: CHAPTER_ID,
    });

    expect(issues).toEqual([]);
  });
});
