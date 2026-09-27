import type { Options } from 'prettier';
import type * as EstreePlugin from 'prettier/plugins/estree';
import type * as TypeScriptPlugin from 'prettier/plugins/typescript';
import type * as Prettier from 'prettier/standalone';

/**
 * Prettier options a host passes to {@link formatPlaygroundSource}. The parser
 * and plugins are fixed to TypeScript, so hosts cannot set them.
 */
export type PlaygroundFormatOptions = Omit<Options, 'parser' | 'plugins'>;

/**
 * Formats playground source with Prettier's TypeScript parser and the host's
 * style options. Returns `null` when the source does not parse.
 *
 * Prettier loads on the first call. A failed load rejects and the next call
 * retries it.
 */
export async function formatPlaygroundSource(
	source: string,
	options: PlaygroundFormatOptions,
): Promise<string | null> {
	const { prettier, typescript, estree } = await loadPrettier();
	try {
		return await prettier.format(source, {
			...options,
			parser: 'typescript',
			plugins: [typescript, estree],
		});
	} catch {
		return null;
	}
}

type PrettierModules = {
	estree: typeof EstreePlugin;
	prettier: typeof Prettier;
	typescript: typeof TypeScriptPlugin;
};

let modulesPromise: Promise<PrettierModules> | undefined;

function loadPrettier(): Promise<PrettierModules> {
	if (!modulesPromise) {
		modulesPromise = Promise.all([
			import('prettier/standalone'),
			import('prettier/plugins/typescript'),
			import('prettier/plugins/estree'),
		])
			.then(([prettier, typescript, estree]) => ({ estree, prettier, typescript }))
			.catch((error: unknown) => {
				modulesPromise = undefined;
				throw error;
			});
	}
	return modulesPromise;
}
