// ABOUTME: Tests for ProjectTask entity
// ABOUTME: Covers creation, validation, business logic, and mutations

import { describe, it, expect } from 'vitest';
import { ProjectTask } from '../ProjectTask';

describe('ProjectTask', () => {
  describe('create', () => {
    it('creates a task with minimal parameters', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Write chapter 1');

      expect(task.getId()).toBe('task-1');
      expect(task.getProjectId()).toBe('project-1');
      expect(task.getOwnerId()).toBe('user-1');
      expect(task.getTitle()).toBe('Write chapter 1');
      expect(task.getDescription()).toBeNull();
      expect(task.getStatus()).toBe('todo');
      expect(task.getPriority()).toBe('medium');
      expect(task.getDueDate()).toBeNull();
      expect(task.getLinkedChapterId()).toBeNull();
      expect(task.getTags()).toEqual([]);
    });

    it('creates a task with all options', () => {
      const dueDate = new Date('2025-12-31');
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Research topic', {
        description: 'Deep dive into historical context',
        status: 'in_progress',
        priority: 'high',
        dueDate,
        linkedChapterId: 'chapter-3',
        tags: ['research', 'history'],
      });

      expect(task.getDescription()).toBe('Deep dive into historical context');
      expect(task.getStatus()).toBe('in_progress');
      expect(task.getPriority()).toBe('high');
      expect(task.getDueDate()).toEqual(dueDate);
      expect(task.getLinkedChapterId()).toBe('chapter-3');
      expect(task.getTags()).toEqual(['research', 'history']);
    });

    it('trims the title', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', '  Trim me  ');

      expect(task.getTitle()).toBe('Trim me');
    });

    it('throws error for empty title', () => {
      expect(() =>
        ProjectTask.create('task-1', 'project-1', 'user-1', '')
      ).toThrow('Task title cannot be empty');
    });

    it('throws error for whitespace-only title', () => {
      expect(() =>
        ProjectTask.create('task-1', 'project-1', 'user-1', '   ')
      ).toThrow('Task title cannot be empty');
    });

    it('throws error for title exceeding 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      expect(() =>
        ProjectTask.create('task-1', 'project-1', 'user-1', longTitle)
      ).toThrow('Task title cannot exceed 200 characters');
    });
  });

  describe('isOverdue', () => {
    it('returns false when no due date', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');

      expect(task.isOverdue()).toBe(false);
    });

    it('returns true when due date has passed', () => {
      const pastDate = new Date('2020-01-01');
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        dueDate: pastDate,
      });

      expect(task.isOverdue()).toBe(true);
    });

    it('returns false when due date is in future', () => {
      const futureDate = new Date('2030-12-31');
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        dueDate: futureDate,
      });

      expect(task.isOverdue()).toBe(false);
    });

    it('returns false when task is done even if past due', () => {
      const pastDate = new Date('2020-01-01');
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        dueDate: pastDate,
        status: 'done',
      });

      expect(task.isOverdue()).toBe(false);
    });
  });

  describe('getDaysUntilDue', () => {
    it('returns null when no due date', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');

      expect(task.getDaysUntilDue()).toBeNull();
    });

    it('returns negative number when overdue', () => {
      const pastDate = new Date('2020-01-01');
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        dueDate: pastDate,
      });

      expect(task.getDaysUntilDue()).toBeLessThan(0);
    });
  });

  describe('isDone', () => {
    it('returns true when status is done', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        status: 'done',
      });

      expect(task.isDone()).toBe(true);
    });

    it('returns false when status is not done', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');

      expect(task.isDone()).toBe(false);
    });
  });

  describe('isInProgress', () => {
    it('returns true when status is in_progress', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        status: 'in_progress',
      });

      expect(task.isInProgress()).toBe(true);
    });

    it('returns false when status is not in_progress', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');

      expect(task.isInProgress()).toBe(false);
    });
  });

  describe('hasTag', () => {
    it('returns true when tag exists', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        tags: ['research', 'urgent'],
      });

      expect(task.hasTag('research')).toBe(true);
    });

    it('returns false when tag does not exist', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        tags: ['research'],
      });

      expect(task.hasTag('urgent')).toBe(false);
    });

    it('is case insensitive', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        tags: ['research'],
      });

      expect(task.hasTag('RESEARCH')).toBe(true);
    });
  });

  describe('updateTitle', () => {
    it('returns new instance with updated title', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Old title');

      const updated = task.updateTitle('New title');

      expect(updated.getTitle()).toBe('New title');
      expect(task.getTitle()).toBe('Old title'); // Original unchanged
    });

    it('throws error for invalid title', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Title');

      expect(() => task.updateTitle('')).toThrow();
    });
  });

  describe('updateDescription', () => {
    it('returns new instance with updated description', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');

      const updated = task.updateDescription('New description');

      expect(updated.getDescription()).toBe('New description');
      expect(task.getDescription()).toBeNull(); // Original unchanged
    });

    it('can set description to null', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        description: 'Original description',
      });

      const updated = task.updateDescription(null);

      expect(updated.getDescription()).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('returns new instance with updated status', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');

      const updated = task.updateStatus('in_progress');

      expect(updated.getStatus()).toBe('in_progress');
      expect(task.getStatus()).toBe('todo');
    });
  });

  describe('updatePriority', () => {
    it('returns new instance with updated priority', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');

      const updated = task.updatePriority('high');

      expect(updated.getPriority()).toBe('high');
      expect(task.getPriority()).toBe('medium');
    });
  });

  describe('updateDueDate', () => {
    it('returns new instance with updated due date', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');
      const newDate = new Date('2025-06-15');

      const updated = task.updateDueDate(newDate);

      expect(updated.getDueDate()).toEqual(newDate);
      expect(task.getDueDate()).toBeNull();
    });

    it('can set due date to null', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        dueDate: new Date('2025-06-15'),
      });

      const updated = task.updateDueDate(null);

      expect(updated.getDueDate()).toBeNull();
    });
  });

  describe('markAsDone', () => {
    it('changes status to done', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');

      const updated = task.markAsDone();

      expect(updated.getStatus()).toBe('done');
    });
  });

  describe('markAsInProgress', () => {
    it('changes status to in_progress', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');

      const updated = task.markAsInProgress();

      expect(updated.getStatus()).toBe('in_progress');
    });
  });

  describe('markAsTodo', () => {
    it('changes status to todo', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        status: 'done',
      });

      const updated = task.markAsTodo();

      expect(updated.getStatus()).toBe('todo');
    });
  });

  describe('cycleStatus', () => {
    it('cycles from todo to in_progress', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        status: 'todo',
      });

      const updated = task.cycleStatus();

      expect(updated.getStatus()).toBe('in_progress');
    });

    it('cycles from in_progress to done', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        status: 'in_progress',
      });

      const updated = task.cycleStatus();

      expect(updated.getStatus()).toBe('done');
    });

    it('cycles from done to todo', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        status: 'done',
      });

      const updated = task.cycleStatus();

      expect(updated.getStatus()).toBe('todo');
    });
  });

  describe('addTag', () => {
    it('adds a new tag', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        tags: ['existing'],
      });

      const updated = task.addTag('new');

      expect(updated.getTags()).toEqual(['existing', 'new']);
    });

    it('normalizes tag to lowercase', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');

      const updated = task.addTag('UPPERCASE');

      expect(updated.getTags()).toEqual(['uppercase']);
    });

    it('does not add duplicate tag', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        tags: ['existing'],
      });

      const updated = task.addTag('existing');

      expect(updated.getTags()).toEqual(['existing']);
      expect(updated).toBe(task); // Same instance returned
    });

    it('does not add empty tag', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');

      const updated = task.addTag('');

      expect(updated.getTags()).toEqual([]);
      expect(updated).toBe(task);
    });
  });

  describe('removeTag', () => {
    it('removes an existing tag', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        tags: ['keep', 'remove'],
      });

      const updated = task.removeTag('remove');

      expect(updated.getTags()).toEqual(['keep']);
    });

    it('returns same instance when tag does not exist', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        tags: ['existing'],
      });

      const updated = task.removeTag('nonexistent');

      expect(updated).toBe(task);
    });
  });

  describe('updateTags', () => {
    it('replaces all tags', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        tags: ['old1', 'old2'],
      });

      const updated = task.updateTags(['new1', 'new2', 'new3']);

      expect(updated.getTags()).toEqual(['new1', 'new2', 'new3']);
    });

    it('normalizes tags to lowercase and trims', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');

      const updated = task.updateTags(['  TAG1  ', 'TAG2', '']);

      expect(updated.getTags()).toEqual(['tag1', 'tag2']);
    });
  });

  describe('linkToChapter', () => {
    it('links task to a chapter', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task');

      const updated = task.linkToChapter('chapter-5');

      expect(updated.getLinkedChapterId()).toBe('chapter-5');
    });

    it('unlinks task from chapter with null', () => {
      const task = ProjectTask.create('task-1', 'project-1', 'user-1', 'Task', {
        linkedChapterId: 'chapter-5',
      });

      const updated = task.linkToChapter(null);

      expect(updated.getLinkedChapterId()).toBeNull();
    });
  });

  describe('reconstruct', () => {
    it('reconstructs from properties', () => {
      const createdAt = new Date('2024-01-15');
      const updatedAt = new Date('2024-01-20');
      const task = ProjectTask.reconstruct({
        id: 'task-1',
        projectId: 'project-1',
        ownerId: 'user-1',
        title: 'Reconstructed task',
        description: 'Description',
        status: 'done',
        priority: 'high',
        dueDate: new Date('2024-02-01'),
        linkedChapterId: 'chapter-2',
        tags: ['tag1', 'tag2'],
        createdAt,
        updatedAt,
      });

      expect(task.getId()).toBe('task-1');
      expect(task.getCreatedAt()).toEqual(createdAt);
      expect(task.getUpdatedAt()).toEqual(updatedAt);
    });
  });
});
