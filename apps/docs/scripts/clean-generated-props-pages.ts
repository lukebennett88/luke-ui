import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanGeneratedPropsPages } from '../src/lib/clean-generated-props-pages.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const componentsDir = resolve(scriptDir, '../content/docs/components');

const isMain =
	process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
	const { removedCount } = cleanGeneratedPropsPages(componentsDir);
	// oxlint-disable-next-line no-console
	console.log(
		removedCount > 0
			? `clean-generated-props-pages: removed ${removedCount} stale file(s) from the retired props-page generator.`
			: 'clean-generated-props-pages: nothing to clean.',
	);
}
