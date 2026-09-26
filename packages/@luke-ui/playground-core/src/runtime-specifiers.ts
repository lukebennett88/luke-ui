/** Specifiers the playground always resolves, besides `@luke-ui/react/*` subpaths. */
export const PLAYGROUND_BASE_SPECIFIERS = [
	'react',
	'react-dom',
	'react-dom/client',
	'react/jsx-runtime',
] as const;

export type PlaygroundRuntimeSpecifierOptions = {
	/** Extra host packages (third-party + docs helpers) beyond React and Luke UI. */
	extraSpecifiers?: ReadonlyArray<string>;
	/** `exports` map from `@luke-ui/react/package.json`. */
	reactExports: Record<string, string>;
};

const IMPORT_SPECIFIER_PATTERN = /\bfrom\s+["']([^"']+)["']/g;
const SIDE_EFFECT_IMPORT_PATTERN = /^import\s+["']([^"']+)["']/gm;

/** `@luke-ui/react/*` specifiers the playground can `require` at runtime. */
export function lukeUiPlaygroundSpecifiers(reactExports: Record<string, string>): Array<string> {
	return Object.keys(reactExports)
		.flatMap((key) => {
			const target = reactExports[key];
			if (key === './package.json' || target === undefined || !target.endsWith('.js')) return [];
			return [`@luke-ui/react/${key.slice(2)}`];
		})
		.sort();
}

/** Specifiers a playground preview `require` can resolve for the given host options. */
export function playgroundRuntimeSpecifierList(
	options: PlaygroundRuntimeSpecifierOptions,
): Array<string> {
	return [
		...lukeUiPlaygroundSpecifiers(options.reactExports),
		...PLAYGROUND_BASE_SPECIFIERS,
		...(options.extraSpecifiers ?? []),
	];
}

export function importSpecifiersFromSource(source: string): Array<string> {
	const specifiers: Array<string> = [];

	for (const match of source.matchAll(IMPORT_SPECIFIER_PATTERN)) {
		const specifier = match[1];
		if (specifier !== undefined) specifiers.push(specifier);
	}

	for (const match of source.matchAll(SIDE_EFFECT_IMPORT_PATTERN)) {
		const specifier = match[1];
		if (specifier !== undefined) specifiers.push(specifier);
	}

	return specifiers;
}

export function canRunInPlayground(source: string, specifiers: ReadonlySet<string>): boolean {
	return importSpecifiersFromSource(source).every((specifier) => specifiers.has(specifier));
}
