// ABOUTME: Use case for deleting a user account and all associated data
// ABOUTME: Implements RGPD right to erasure (Article 17)

import { UserRepository } from '@/domain/interfaces/UserRepository';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import { MetadataRepository } from '@/domain/interfaces/MetadataRepository';
import { CorrectionHistoryRepository } from '@/domain/interfaces/CorrectionHistoryRepository';
import { ProjectSettingsRepository } from '@/domain/interfaces/ProjectSettingsRepository';
import { WordCountSnapshotRepository } from '@/domain/interfaces/WordCountSnapshotRepository';
import { WritingQuotaRepository } from '@/domain/interfaces/WritingQuotaRepository';
import { WritingGoalRepository } from '@/domain/interfaces/WritingGoalRepository';
import { CharacterRepository } from '@/domain/interfaces/CharacterRepository';
import { ProjectTaskRepository } from '@/domain/interfaces/ProjectTaskRepository';
import { AIUsageRepository } from '@/domain/interfaces/AIUsageRepository';
import { AIExchangeRepository } from '@/domain/interfaces/AIExchangeRepository';

export interface DeleteUserAccountInput {
  userId: string;
  confirmEmail: string;
}

export interface DeleteUserAccountResult {
  projectsDeleted: number;
  providersDeleted: number;
  metadataDeleted: number;
  historyDeleted: number;
  settingsDeleted: number;
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export class EmailMismatchError extends Error {
  constructor() {
    super('Email confirmation does not match');
    this.name = 'EmailMismatchError';
  }
}

export class DeleteUserAccountUseCase {
  constructor(
    private userRepository: UserRepository,
    private projectRepository: ProjectRepository,
    private providerRepository: ProviderRepository,
    private metadataRepository: MetadataRepository,
    private correctionHistoryRepository: CorrectionHistoryRepository,
    private projectSettingsRepository: ProjectSettingsRepository,
    private wordCountSnapshotRepository?: WordCountSnapshotRepository,
    private writingQuotaRepository?: WritingQuotaRepository,
    private writingGoalRepository?: WritingGoalRepository,
    private characterRepository?: CharacterRepository,
    private projectTaskRepository?: ProjectTaskRepository,
    private aiUsageRepository?: AIUsageRepository,
    private aiExchangeRepository?: AIExchangeRepository
  ) {}

  async execute(input: DeleteUserAccountInput): Promise<DeleteUserAccountResult> {
    // 1. Verify user exists
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError(input.userId);
    }

    // 2. Verify email confirmation matches
    if (user.email.toLowerCase() !== input.confirmEmail.toLowerCase()) {
      throw new EmailMismatchError();
    }

    // 3. Delete all user data in order (dependent data first)
    // Delete correction history first (depends on projects/chapters)
    const historyDeleted = await this.correctionHistoryRepository.deleteAllByOwner(input.userId);

    // Delete metadata (depends on projects)
    const metadataDeleted = await this.metadataRepository.deleteAllByOwner(input.userId);

    // Delete project settings (depends on projects)
    await this.projectSettingsRepository.deleteAllByOwner(input.userId);
    const settingsDeleted = 0; // deleteAllByOwner returns void, count not available

    // Delete word count snapshots (depends on projects)
    await this.wordCountSnapshotRepository?.deleteAllByOwner(input.userId);

    // Delete recurring writing quotas (depends on projects)
    await this.writingQuotaRepository?.deleteAllByOwner(input.userId);

    // Delete writing goals, characters, tasks, and AI usage (all depend on projects)
    await this.writingGoalRepository?.deleteAllByOwner(input.userId);
    await this.characterRepository?.deleteAllByOwner(input.userId);
    await this.projectTaskRepository?.deleteAllByOwner(input.userId);
    await this.aiUsageRepository?.deleteAllByOwner(input.userId);
    await this.aiExchangeRepository?.deleteAllByOwner(input.userId);

    // Delete projects
    const projectsDeleted = await this.projectRepository.deleteAllByOwner(input.userId);

    // Delete providers
    const providersDeleted = await this.providerRepository.deleteAllByOwner(input.userId);

    // 4. Delete the user account
    await this.userRepository.deleteUser(input.userId);

    return {
      projectsDeleted,
      providersDeleted,
      metadataDeleted,
      historyDeleted,
      settingsDeleted,
    };
  }
}
