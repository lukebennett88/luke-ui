import type * as EstreePlugin from 'prettier/plugins/estree';
import type * as TypeScriptPlugin from 'prettier/plugins/typescript';
import type * as Prettier from 'prettier/standalone';

type PrettierModules = {
	estree: typeof EstreePlugin;
	prettier: typeof Prettier;
	typescript: typeof TypeScriptPlugin;
};

function createPrettierLoader(
	load: () => Promise<PrettierModules>,
): () => Promise<PrettierModules> {
	let modulesPromise: Promise<PrettierModules> | undefined;
	return () => {
		if (!modulesPromise) {
			modulesPromise = load().catch((error: unknown) => {
				modulesPromise = undefined;
				throw error;
			});
		}
		return modulesPromise;
	};
}

const loadPrettier = createPrettierLoader(async () => {
	const [prettier, typescript, estree] = await Promise.all([
		import('prettier/standalone'),
		import('prettier/plugins/typescript'),
		import('prettier/plugins/estree'),
	]);
	return { estree, prettier, typescript };
});

export async function formatPlaygroundSource(source: string): Promise<string | null> {
	const { prettier, typescript, estree } = await loadPrettier();
	try {
		return await prettier.format(source, {
			arrowParens: 'always',
			bracketSameLine: false,
			bracketSpacing: true,
			jsxSingleQuote: false,
			parser: 'typescript',
			plugins: [typescript, estree],
			printWidth: 100,
			quoteProps: 'as-needed',
			semi: true,
			singleAttributePerLine: false,
			singleQuote: true,
			tabWidth: 2,
			trailingComma: 'all',
			useTabs: true,
		});
	} catch {
		return null;
	}
}
