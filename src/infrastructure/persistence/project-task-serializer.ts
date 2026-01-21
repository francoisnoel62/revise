// ABOUTME: Serialization utilities for ProjectTask entity to/from MongoDB documents
// ABOUTME: Handles Date conversions and type safety

import { ProjectTask, ProjectTaskProperties } from '@/domain/entities/ProjectTask';
import { TaskStatus } from '@/domain/value-objects/TaskStatus';
import { TaskPriority } from '@/domain/value-objects/TaskPriority';
import { ObjectId } from 'mongodb';

export interface ProjectTaskDocument {
  _id: ObjectId;
  projectId: string;
  ownerId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  linkedChapterId: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function serializeProjectTask(task: ProjectTask): ProjectTaskDocument {
  return {
    _id: new ObjectId(task.getId()),
    projectId: task.getProjectId(),
    ownerId: task.getOwnerId(),
    title: task.getTitle(),
    description: task.getDescription(),
    status: task.getStatus(),
    priority: task.getPriority(),
    dueDate: task.getDueDate(),
    linkedChapterId: task.getLinkedChapterId(),
    tags: task.getTags(),
    createdAt: task.getCreatedAt(),
    updatedAt: task.getUpdatedAt(),
  };
}

export function deserializeProjectTask(doc: ProjectTaskDocument): ProjectTask {
  const props: ProjectTaskProperties = {
    id: doc._id.toHexString(),
    projectId: doc.projectId,
    ownerId: doc.ownerId,
    title: doc.title,
    description: doc.description,
    status: doc.status,
    priority: doc.priority,
    dueDate: doc.dueDate,
    linkedChapterId: doc.linkedChapterId,
    tags: doc.tags,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  return ProjectTask.reconstruct(props);
}
