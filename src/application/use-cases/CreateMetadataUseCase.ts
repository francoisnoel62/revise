// ABOUTME: Use case for creating a new project metadata document
// ABOUTME: Validates project ownership and prevents duplicate types

import {
  ProjectMetadata,
  MetadataRepository,
  ProjectRepository,
  IdGenerator,
  isValidMetadataType,
  getMetadataType,
} from '../../domain';

export interface CreateMetadataInput {
  ownerId: string;
  projectId: string;
  typeKey: string;
  title?: string; // Optional, defaults to type name
}

export interface CreateMetadataResult {
  metadata: ProjectMetadata;
}

export class CreateMetadataUseCase {
  constructor(
    private readonly metadataRepository: MetadataRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: CreateMetadataInput): Promise<CreateMetadataResult> {
    // 1. Validate input
    if (!input.ownerId || input.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!input.projectId || input.projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }

    if (!input.typeKey || input.typeKey.trim().length === 0) {
      throw new Error('Metadata type key is required');
    }

    if (!isValidMetadataType(input.typeKey)) {
      throw new Error(`Invalid metadata type: ${input.typeKey}`);
    }

    // 2. Verify project exists and is owned by user
    const project = await this.projectRepository.loadProject(
      input.ownerId,
      input.projectId
    );

    if (!project) {
      throw new Error('Project not found');
    }

    // 3. Check if metadata of this type already exists for this project
    const existing = await this.metadataRepository.findByProjectAndType(
      input.ownerId,
      input.projectId,
      input.typeKey
    );

    if (existing) {
      throw new Error(`Metadata of type "${input.typeKey}" already exists for this project`);
    }

    // 4. Determine title (use provided or default to type name)
    const typeDefinition = getMetadataType(input.typeKey);
    const title = input.title?.trim() || typeDefinition?.name || input.typeKey;

    // 5. Create metadata entity
    const metadata = ProjectMetadata.createEmpty(
      this.idGenerator.generate(),
      input.projectId,
      input.typeKey,
      title
    );

    // 6. Persist to repository
    await this.metadataRepository.create(input.ownerId, metadata);

    return { metadata };
  }
}
