/**
 * Shared Oxfmt options for TypeScript and TSX. Imported by root `vite.config.ts`
 * and the docs Playground browser formatter so both surfaces stay aligned.
 */
export const repoFmtOptions = {
	arrowParens: 'always' as const,
	bracketSameLine: false,
	bracketSpacing: true,
	jsxSingleQuote: false,
	printWidth: 100,
	quoteProps: 'as-needed' as const,
	semi: true,
	singleAttributePerLine: false,
	singleQuote: true,
	sortImports: {
		customGroups: [
			{ elementNamePattern: ['http://**', 'https://**'], groupName: 'url' },
			{ elementNamePattern: ['*:*'], groupName: 'protocol' },
		],
		groups: [
			['side_effect_style', 'side_effect'],
			'url',
			'protocol',
			['builtin', 'external', 'type-builtin', 'type-external'],
			['subpath', 'internal', 'type-subpath', 'type-internal'],
			['parent', 'sibling', 'index', 'type-parent', 'type-sibling', 'type-index'],
			'unknown',
		],
		ignoreCase: false,
		internalPattern: ['@/', '#', '~'],
		newlinesBetween: false,
		sortSideEffects: true,
	},
	tabWidth: 2,
	trailingComma: 'all' as const,
	useTabs: true,
};
