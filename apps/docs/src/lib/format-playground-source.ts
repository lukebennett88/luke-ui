import { format } from 'oxfmt';
import { repoFmtOptions } from '../../../../tooling/fmt-options.js';

const PLAYGROUND_FILE = 'index.tsx';

const formatOptions = {
	...repoFmtOptions,
	proseWrap: 'always' as const,
};

/**
 * Formats Playground TSX with the same Oxfmt options as repository formatting.
 * Returns `null` when the source cannot be parsed (incomplete/invalid editor state).
 */
export async function formatPlaygroundSourceWithOxfmt(source: string): Promise<string | null> {
	const { code, errors } = await format(PLAYGROUND_FILE, source, formatOptions);
	if (errors.length > 0) return null;
	return code;
}
