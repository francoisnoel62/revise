import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from './projectStore';
import { Project } from '@/domain/entities/Project';
import { Chapter } from '@/domain/entities/Chapter';

describe('projectStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useProjectStore.setState({
      project: new Project(),
      activeContent: JSON.stringify({ type: 'doc', content: [] }),
      hasUnsavedChanges: false,
    });
  });

  const createMockChapter = (id: string, title: string, order: number): Chapter => {
    const content = JSON.stringify({ type: 'doc', content: [] });
    return new Chapter(id, title, content, order);
  };

  describe('setProject', () => {
    it('should set project and active content', () => {
      const chapter = createMockChapter('id-1', 'Chapter 1', 0);
      const project = new Project([chapter]);

      useProjectStore.getState().setProject(project);

      const state = useProjectStore.getState();
      expect(state.project).toBe(project);
      expect(state.activeContent).toBe(chapter.getContent());
      expect(state.hasUnsavedChanges).toBe(false);
    });

    it('should handle empty project', () => {
      const project = new Project();

      useProjectStore.getState().setProject(project);

      const state = useProjectStore.getState();
      expect(state.project).toBe(project);
      expect(state.activeContent).toBe(JSON.stringify({ type: 'doc', content: [] }));
    });
  });

  describe('updateActiveContent', () => {
    it('should update content and mark as unsaved', () => {
      const newContent = JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [] }],
      });

      useProjectStore.getState().updateActiveContent(newContent);

      const state = useProjectStore.getState();
      expect(state.activeContent).toBe(newContent);
      expect(state.hasUnsavedChanges).toBe(true);
    });
  });

  describe('addChapter', () => {
    it('should add new chapter to project', () => {
      const initialCount = useProjectStore.getState().project.getChapterCount();

      useProjectStore.getState().addChapter();

      const newCount = useProjectStore.getState().project.getChapterCount();
      expect(newCount).toBe(initialCount + 1);
    });
  });

  describe('removeChapter', () => {
    it('should remove chapter from project', () => {
      const chapters = [
        createMockChapter('id-1', 'Chapter 1', 0),
        createMockChapter('id-2', 'Chapter 2', 1),
      ];
      const project = new Project(chapters);
      useProjectStore.getState().setProject(project);

      useProjectStore.getState().removeChapter('id-1');

      const state = useProjectStore.getState();
      expect(state.project.getChapterCount()).toBe(1);
      expect(state.project.getChapter('id-1')).toBeNull();
    });

    it('should throw error when removing last chapter', () => {
      const chapter = createMockChapter('id-1', 'Chapter 1', 0);
      const project = new Project([chapter]);
      useProjectStore.getState().setProject(project);

      expect(() => {
        useProjectStore.getState().removeChapter('id-1');
      }).toThrow('Cannot remove the last chapter');
    });
  });

  describe('saveCurrentChapter', () => {
    it('should save active content to chapter', () => {
      const chapter = createMockChapter('id-1', 'Chapter 1', 0);
      const project = new Project([chapter]);
      useProjectStore.getState().setProject(project);

      const newContent = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'New content' }],
          },
        ],
      });

      useProjectStore.getState().updateActiveContent(newContent);
      useProjectStore.getState().saveCurrentChapter();

      const savedChapter = project.getChapter('id-1');
      expect(savedChapter!.getContent()).toBe(newContent);
      expect(useProjectStore.getState().hasUnsavedChanges).toBe(false);
    });

    it('should handle no active chapter gracefully', () => {
      const project = new Project();
      useProjectStore.getState().setProject(project);

      // Should not throw
      expect(() => {
        useProjectStore.getState().saveCurrentChapter();
      }).not.toThrow();
    });
  });

  describe('setActiveChapter', () => {
    it('should switch active chapter', () => {
      const chapters = [
        createMockChapter('id-1', 'Chapter 1', 0),
        createMockChapter('id-2', 'Chapter 2', 1),
      ];
      const project = new Project(chapters);
      useProjectStore.getState().setProject(project);

      useProjectStore.getState().setActiveChapter('id-2');

      const state = useProjectStore.getState();
      expect(state.project.getActiveChapterId()).toBe('id-2');
    });

    it('should save content before switching if unsaved', () => {
      const chapters = [
        createMockChapter('id-1', 'Chapter 1', 0),
        createMockChapter('id-2', 'Chapter 2', 1),
      ];
      const project = new Project(chapters);
      useProjectStore.getState().setProject(project);

      const newContent = JSON.stringify({
        type: 'doc',
        content: [{ type: 'paragraph', content: [] }],
      });

      useProjectStore.getState().updateActiveContent(newContent);
      useProjectStore.getState().setActiveChapter('id-2');

      const chapter1 = project.getChapter('id-1');
      expect(chapter1!.getContent()).toBe(newContent);
    });
  });

  describe('reorderChapters', () => {
    it('should reorder chapters correctly', () => {
      const chapters = [
        createMockChapter('id-1', 'Chapter 1', 0),
        createMockChapter('id-2', 'Chapter 2', 1),
        createMockChapter('id-3', 'Chapter 3', 2),
      ];
      const project = new Project(chapters);
      useProjectStore.getState().setProject(project);

      useProjectStore.getState().reorderChapters(0, 2);

      const reorderedChapters = project.getChapters();
      expect(reorderedChapters[0].getId()).toBe('id-2');
      expect(reorderedChapters[2].getId()).toBe('id-1');
    });
  });

  describe('updateChapterTitle', () => {
    it('should update chapter title', () => {
      const chapter = createMockChapter('id-1', 'Old Title', 0);
      const project = new Project([chapter]);
      useProjectStore.getState().setProject(project);

      useProjectStore.getState().updateChapterTitle('id-1', 'New Title');

      expect(project.getChapter('id-1')!.getTitle()).toBe('New Title');
    });
  });

  // Note: Import/Export are handled via Server Actions, not in the store
  // The store receives the Project after import and provides data for export
});
