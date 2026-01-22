// ABOUTME: ProjectTask entity representing a task within a writing project
// ABOUTME: Supports status, priority, due dates, chapter linking, and tags

import { TaskStatus } from '../value-objects/TaskStatus';
import { TaskPriority } from '../value-objects/TaskPriority';

export interface ProjectTaskProperties {
  id: string;
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

export class ProjectTask {
  private readonly id: string;
  private readonly projectId: string;
  private readonly ownerId: string;
  private title: string;
  private description: string | null;
  private status: TaskStatus;
  private priority: TaskPriority;
  private dueDate: Date | null;
  private linkedChapterId: string | null;
  private tags: string[];
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: ProjectTaskProperties) {
    this.validateTitle(props.title);

    this.id = props.id;
    this.projectId = props.projectId;
    this.ownerId = props.ownerId;
    this.title = props.title;
    this.description = props.description;
    this.status = props.status;
    this.priority = props.priority;
    this.dueDate = props.dueDate;
    this.linkedChapterId = props.linkedChapterId;
    this.tags = [...props.tags];
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Task title cannot be empty');
    }
    if (title.length > 200) {
      throw new Error('Task title cannot exceed 200 characters');
    }
  }

  static create(
    id: string,
    projectId: string,
    ownerId: string,
    title: string,
    options: {
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate?: Date;
      linkedChapterId?: string;
      tags?: string[];
    } = {}
  ): ProjectTask {
    const now = new Date();
    return new ProjectTask({
      id,
      projectId,
      ownerId,
      title: title.trim(),
      description: options.description ?? null,
      status: options.status ?? 'todo',
      priority: options.priority ?? 'medium',
      dueDate: options.dueDate ?? null,
      linkedChapterId: options.linkedChapterId ?? null,
      tags: options.tags ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstruct(props: ProjectTaskProperties): ProjectTask {
    return new ProjectTask(props);
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string | null {
    return this.description;
  }

  getStatus(): TaskStatus {
    return this.status;
  }

  getPriority(): TaskPriority {
    return this.priority;
  }

  getDueDate(): Date | null {
    return this.dueDate;
  }

  getLinkedChapterId(): string | null {
    return this.linkedChapterId;
  }

  getTags(): string[] {
    return [...this.tags];
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business logic
  isOverdue(): boolean {
    if (!this.dueDate || this.status === 'done') return false;
    return new Date() > this.dueDate;
  }

  isDone(): boolean {
    return this.status === 'done';
  }

  isInProgress(): boolean {
    return this.status === 'in_progress';
  }

  getDaysUntilDue(): number | null {
    if (!this.dueDate) return null;
    const now = new Date();
    const diffTime = this.dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag.toLowerCase());
  }

  // Mutations (return new instance)
  updateTitle(newTitle: string): ProjectTask {
    this.validateTitle(newTitle);
    return new ProjectTask({
      ...this.toProperties(),
      title: newTitle.trim(),
      updatedAt: new Date(),
    });
  }

  updateDescription(newDescription: string | null): ProjectTask {
    return new ProjectTask({
      ...this.toProperties(),
      description: newDescription,
      updatedAt: new Date(),
    });
  }

  updateStatus(newStatus: TaskStatus): ProjectTask {
    return new ProjectTask({
      ...this.toProperties(),
      status: newStatus,
      updatedAt: new Date(),
    });
  }

  updatePriority(newPriority: TaskPriority): ProjectTask {
    return new ProjectTask({
      ...this.toProperties(),
      priority: newPriority,
      updatedAt: new Date(),
    });
  }

  updateDueDate(newDueDate: Date | null): ProjectTask {
    return new ProjectTask({
      ...this.toProperties(),
      dueDate: newDueDate,
      updatedAt: new Date(),
    });
  }

  linkToChapter(chapterId: string | null): ProjectTask {
    return new ProjectTask({
      ...this.toProperties(),
      linkedChapterId: chapterId,
      updatedAt: new Date(),
    });
  }

  updateTags(newTags: string[]): ProjectTask {
    return new ProjectTask({
      ...this.toProperties(),
      tags: newTags.map((t) => t.toLowerCase().trim()).filter((t) => t.length > 0),
      updatedAt: new Date(),
    });
  }

  addTag(tag: string): ProjectTask {
    const normalizedTag = tag.toLowerCase().trim();
    if (!normalizedTag || this.tags.includes(normalizedTag)) {
      return this;
    }
    return new ProjectTask({
      ...this.toProperties(),
      tags: [...this.tags, normalizedTag],
      updatedAt: new Date(),
    });
  }

  removeTag(tag: string): ProjectTask {
    const normalizedTag = tag.toLowerCase().trim();
    if (!this.tags.includes(normalizedTag)) {
      return this;
    }
    return new ProjectTask({
      ...this.toProperties(),
      tags: this.tags.filter((t) => t !== normalizedTag),
      updatedAt: new Date(),
    });
  }

  markAsDone(): ProjectTask {
    return this.updateStatus('done');
  }

  markAsInProgress(): ProjectTask {
    return this.updateStatus('in_progress');
  }

  markAsTodo(): ProjectTask {
    return this.updateStatus('todo');
  }

  cycleStatus(): ProjectTask {
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      todo: 'in_progress',
      in_progress: 'done',
      done: 'todo',
    };
    return this.updateStatus(nextStatus[this.status]);
  }

  private toProperties(): ProjectTaskProperties {
    return {
      id: this.id,
      projectId: this.projectId,
      ownerId: this.ownerId,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate,
      linkedChapterId: this.linkedChapterId,
      tags: [...this.tags],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
