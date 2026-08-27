/** The class-name constants both `core` and `theme` must agree on. */
export const lukeUiClassNames = {
	resetRoot: 'luke-ui-reset',
	themeRoot: 'luke-ui-theme',
} as const;

/**
 * Marks a `Prose` root so the reset can leave typed ordered-list markers alone inside it. Author
 * `list-style` would override HTML presentational hints, and Chromium/Safari cannot restate `type`
 * case-sensitively in CSS.
 */
export const lukeUiProseRootAttribute = 'data-luke-ui-prose';
