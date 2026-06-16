// ABOUTME: Central AI feature visibility flags
// ABOUTME: Keeps product-level UI deprecations explicit and easy to reverse

/**
 * Long-form chapter generation is deprecated from the primary writing UI.
 * Routes and use cases stay available; this flag only controls default visibility.
 */
export const LONG_FORM_GENERATION_ENABLED = false;

/**
 * Canon-fact context injection into autocompletion.
 * Off by default — enabled behind this flag while its effect is measured
 * (see canonFactsCount on AutocompleteEvent). Flip to true to evaluate locally.
 */
export const CANON_CONTEXT_ENABLED = false;
