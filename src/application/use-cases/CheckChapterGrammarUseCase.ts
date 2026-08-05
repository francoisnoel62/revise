// ABOUTME: Use case checking one chapter's grammar and positioning each error in the document.
// ABOUTME: Reads the project's rule profile, runs the engine block by block, returns absolute ranges.

import type { ProjectRepository } from '../../domain/interfaces/ProjectRepository';
import type { ProjectSettingsRepository } from '../../domain/interfaces/ProjectSettingsRepository';
import type {
  GrammarChecker,
  GrammarPersonalDictionary,
} from '../../domain/interfaces/GrammarChecker';
import type { ContentNode } from '../../domain/value-objects/ContentNode';
import {
  DEFAULT_FICTION_GRAMMAR_RULE_PROFILE,
  type GrammarRuleProfile,
} from '../../domain/value-objects/GrammarRuleProfile';
import type { TextIssue } from '../../domain/value-objects/TextIssue';
import { mapBlockFragmentOffset } from '../grammar/blockTextOffsets';
import {
  collectDocumentTextBlocks,
  type DocumentTextBlock,
} from '../grammar/collectDocumentTextBlocks';

export interface CheckChapterGrammarInput {
  ownerId: string;
  projectId: string;
  chapterId: string;
}

export interface CheckChapterGrammarResult {
  issues: TextIssue[];
}

/**
 * Checks a chapter's grammar on demand.
 *
 * The engine works one block at a time and reports offsets relative to the
 * block it was given; this use case turns them into absolute ProseMirror
 * positions so the editor can decorate and replace a range without further
 * mapping. Every text block is analysed, chapter titles and quotes included.
 */
export class CheckChapterGrammarUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectSettingsRepository: ProjectSettingsRepository,
    private readonly grammarChecker: GrammarChecker
  ) {}

  async execute(input: CheckChapterGrammarInput): Promise<CheckChapterGrammarResult> {
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );
    if (!project) {
      throw new Error('Project not found');
    }

    const chapter = project.getChapters().find((c) => c.getId() === input.chapterId);
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    const settings = await this.projectSettingsRepository.findByProjectId(
      input.ownerId,
      input.projectId
    );
    const ruleProfile =
      settings?.getGrammarRuleProfile() ?? DEFAULT_FICTION_GRAMMAR_RULE_PROFILE;
    // The project's own vocabulary was turned into an automaton when the author
    // declared it; the check only installs it.
    const personalDictionary = settings?.getGrammarDictionary() ?? undefined;
    const blocks = collectDocumentTextBlocks(parseChapterContent(chapter.getContent()));

    const issues = blocks.flatMap((block) =>
      this.checkBlock(block, ruleProfile, personalDictionary)
    );
    issues.sort((a, b) => a.from - b.from);

    return { issues };
  }

  private checkBlock(
    block: DocumentTextBlock,
    ruleProfile: GrammarRuleProfile,
    personalDictionary: GrammarPersonalDictionary | undefined
  ): TextIssue[] {
    return this.grammarChecker
      .checkParagraph(block.text, { ruleProfile, personalDictionary })
      .map((error) => {
        const from = mapBlockFragmentOffset(
          block.fragments,
          block.textStart,
          error.range.start
        );
        const to = mapBlockFragmentOffset(
          block.fragments,
          block.textStart,
          error.range.end
        );

        return {
          nature: 'grammar' as const,
          from,
          to,
          text: block.text.slice(error.range.start, error.range.end),
          message: error.message,
          suggestions: [...error.suggestions],
          ruleFamily: error.ruleFamily.value,
        };
      });
  }
}

function parseChapterContent(content: string): ContentNode {
  if (!content.trim()) return { type: 'doc', content: [] };

  try {
    return JSON.parse(content) as ContentNode;
  } catch {
    // A chapter that is not a stored document has nothing positionable in it.
    return { type: 'doc', content: [] };
  }
}
