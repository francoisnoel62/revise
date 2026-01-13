// ABOUTME: Central export for all test helpers.
// ABOUTME: Provides convenient access to testing utilities.

// Custom render and RTL utilities
export {
  customRender,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  createDeferred,
  waitForCondition,
  flushPromises,
  delay,
  createDelayedMock,
  createDelayedErrorMock,
} from './render';

// TipTap-specific helpers
export {
  waitForTipTapEditor,
  waitForTipTapContent,
  waitForEmptyEditor,
  getTipTapContent,
  isEditorEditable,
  waitForEditableEditor,
  typeInEditor,
  clearEditor,
  getPlaceholder,
  isShowingPlaceholder,
  selectText,
  getSelectedText,
} from './tiptap';
