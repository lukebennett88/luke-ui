/**
 * The class-name constants both `core` and `theme` must agree on.
 *
 * `proseScope` is a private implementation marker bridging Prose's StyleX recipe to its retained
 * structural descendant rules and the reset's ordered-list exemption — not a public/documented
 * styling hook.
 */
export const lukeUiClassNames = {
	proseScope: 'luke-ui-prose',
	resetRoot: 'luke-ui-reset',
	themeRoot: 'luke-ui-theme',
} as const;
