// ABOUTME: Use case for deleting a user account and all associated data
// ABOUTME: Implements RGPD right to erasure (Article 17)

import { UserRepository } from '@/domain/interfaces/UserRepository';
import { ProjectRepository } from '@/domain/interfaces/ProjectRepository';
import { ProviderRepository } from '@/domain/interfaces/ProviderRepository';
import { MetadataRepository } from '@/domain/interfaces/MetadataRepository';
import { CorrectionHistoryRepository } from '@/domain/interfaces/CorrectionHistoryRepository';

export interface DeleteUserAccountInput {
  userId: string;
  confirmEmail: string;
}

export interface DeleteUserAccountResult {
  projectsDeleted: number;
  providersDeleted: number;
  metadataDeleted: number;
  historyDeleted: number;
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
    private correctionHistoryRepository: CorrectionHistoryRepository
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
    };
  }
}
