// ABOUTME: TipTap-specific test helpers for async editor testing.
// ABOUTME: Provides utilities to wait for TipTap rendering and content updates.

import { waitFor } from '@testing-library/react';

/**
 * Wait for TipTap editor to be fully initialized.
 * TipTap renders asynchronously, so we need to wait for the ProseMirror element.
 */
export async function waitForTipTapEditor(): Promise<HTMLElement> {
  return waitFor(() => {
    const editor = document.querySelector('.ProseMirror');
    if (!editor) {
      throw new Error('TipTap editor not found');
    }
    return editor as HTMLElement;
  });
}

/**
 * Wait for TipTap editor to contain specific text.
 * @param expectedText Text to wait for
 * @param timeout Maximum wait time in ms (default: 5000)
 */
export async function waitForTipTapContent(
  expectedText: string,
  timeout = 5000
): Promise<void> {
  await waitFor(
    () => {
      const editor = document.querySelector('.ProseMirror');
      if (!editor) {
        throw new Error('TipTap editor not found');
      }
      const content = editor.textContent || '';
      if (!content.includes(expectedText)) {
        throw new Error(`Expected content "${expectedText}" not found in editor. Current content: "${content}"`);
      }
    },
    { timeout }
  );
}

/**
 * Wait for TipTap editor content to be empty.
 */
export async function waitForEmptyEditor(): Promise<void> {
  await waitFor(() => {
    const editor = document.querySelector('.ProseMirror');
    if (!editor) {
      throw new Error('TipTap editor not found');
    }
    const content = (editor.textContent || '').trim();
    if (content !== '') {
      throw new Error(`Expected empty editor, but found: "${content}"`);
    }
  });
}

/**
 * Get the current text content of the TipTap editor.
 */
export function getTipTapContent(): string {
  const editor = document.querySelector('.ProseMirror');
  return editor?.textContent || '';
}

/**
 * Check if TipTap editor is currently editable.
 */
export function isEditorEditable(): boolean {
  const editor = document.querySelector('.ProseMirror');
  return editor?.getAttribute('contenteditable') === 'true';
}

/**
 * Wait for editor to be editable.
 */
export async function waitForEditableEditor(): Promise<void> {
  await waitFor(() => {
    if (!isEditorEditable()) {
      throw new Error('Editor is not editable');
    }
  });
}

/**
 * Simulate typing in TipTap editor.
 * Note: This is a simplified version. For complex typing scenarios,
 * use userEvent or fireEvent with keyboard events.
 */
export async function typeInEditor(
  text: string,
  element?: HTMLElement
): Promise<void> {
  const editor = element || document.querySelector('.ProseMirror');
  if (!editor) {
    throw new Error('TipTap editor not found');
  }

  // Focus the editor
  (editor as HTMLElement).focus();

  // Create and dispatch input event
  const inputEvent = new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertText',
    data: text,
  });

  editor.dispatchEvent(inputEvent);
}

/**
 * Clear all content in the TipTap editor.
 */
export async function clearEditor(): Promise<void> {
  const editor = document.querySelector('.ProseMirror');
  if (!editor) {
    throw new Error('TipTap editor not found');
  }

  // Select all and delete
  (editor as HTMLElement).focus();

  const selectAllEvent = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'a',
    ctrlKey: true,
  });
  editor.dispatchEvent(selectAllEvent);

  const deleteEvent = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Backspace',
  });
  editor.dispatchEvent(deleteEvent);
}

/**
 * Get the placeholder text from TipTap editor.
 */
export function getPlaceholder(): string | null {
  const editor = document.querySelector('.ProseMirror');
  if (!editor) return null;

  // Check for data-placeholder attribute
  const placeholder = editor.getAttribute('data-placeholder');
  if (placeholder) return placeholder;

  // Check for placeholder element inside
  const placeholderEl = editor.querySelector('[data-placeholder]');
  return placeholderEl?.getAttribute('data-placeholder') || null;
}

/**
 * Check if editor is showing placeholder.
 */
export function isShowingPlaceholder(): boolean {
  const editor = document.querySelector('.ProseMirror');
  if (!editor) return false;

  // TipTap shows placeholder when content is empty and has is-empty class
  return editor.classList.contains('is-empty') ||
         editor.classList.contains('is-editor-empty');
}

/**
 * Simulate text selection in TipTap editor.
 * @param start Start position
 * @param end End position
 */
export function selectText(start: number, end: number): void {
  const editor = document.querySelector('.ProseMirror');
  if (!editor) {
    throw new Error('TipTap editor not found');
  }

  // Get the text node
  const walker = document.createTreeWalker(
    editor,
    NodeFilter.SHOW_TEXT,
    null
  );

  let charCount = 0;
  let startNode: Node | null = null;
  let endNode: Node | null = null;
  let startOffset = 0;
  let endOffset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const nodeLength = node.textContent?.length || 0;

    if (!startNode && charCount + nodeLength >= start) {
      startNode = node;
      startOffset = start - charCount;
    }

    if (!endNode && charCount + nodeLength >= end) {
      endNode = node;
      endOffset = end - charCount;
      break;
    }

    charCount += nodeLength;
  }

  if (startNode && endNode) {
    const selection = window.getSelection();
    selection?.removeAllRanges();

    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    selection?.addRange(range);
  }
}

/**
 * Get current selection text in editor.
 */
export function getSelectedText(): string {
  const selection = window.getSelection();
  return selection?.toString() || '';
}
