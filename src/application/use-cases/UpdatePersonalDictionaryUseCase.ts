// ABOUTME: Use case saving the vocabulary a project invented, with the nature the author declared.
// ABOUTME: Compiles the engine dictionary here, on write, so no chapter check ever has to.

import type { GrammarDictionaryCompiler } from '../../domain/interfaces/GrammarDictionaryCompiler';
import type { ProjectSettingsRepository } from '../../domain/interfaces/ProjectSettingsRepository';
import {
  toPersonalDictionaryEntry,
  type PersonalDictionaryEntry,
} from '../../domain/value-objects/PersonalDictionaryEntry';

export interface UpdatePersonalDictionaryInput {
  ownerId: string;
  projectId: string;
  entries: readonly (string | PersonalDictionaryEntry)[];
}

export interface UpdatePersonalDictionaryResult {
  entries: PersonalDictionaryEntry[];
}

export class UpdatePersonalDictionaryUseCase {
  constructor(
    private readonly projectSettingsRepository: ProjectSettingsRepository,
    private readonly dictionaryCompiler: GrammarDictionaryCompiler
  ) {}

  async execute(
    input: UpdatePersonalDictionaryInput
  ): Promise<UpdatePersonalDictionaryResult> {
    const entries = input.entries.map(toPersonalDictionaryEntry);
    assertEachWordAppearsOnce(entries);

    const settings = await this.projectSettingsRepository.findByProjectId(
      input.ownerId,
      input.projectId
    );
    if (!settings) throw new Error('Project settings not found');

    const updated = settings.updateCustomDictionary(
      entries,
      this.dictionaryCompiler.compile(entries)
    );
    await this.projectSettingsRepository.update(input.ownerId, updated);

    return { entries: updated.getCustomDictionary() };
  }
}

/** Two declarations of the same word would leave the engine to pick one. */
function assertEachWordAppearsOnce(entries: readonly PersonalDictionaryEntry[]): void {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.word)) {
      throw new Error(`The word "${entry.word}" is declared twice in the dictionary`);
    }
    seen.add(entry.word);
  }
}
