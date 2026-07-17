#!/usr/bin/env tsx

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { buildTokenMapping } from '../src/theme/panda-tokens.js';

async function main() {
	const outputPath = fileURLToPath(new URL('../src/theme/token-map.json', import.meta.url));
	await mkdir(dirname(outputPath), { recursive: true });
	const mapping = buildTokenMapping();
	await writeFile(outputPath, `${JSON.stringify(mapping, null, '\t')}\n`, 'utf8');
	process.stdout.write('Generated src/theme/token-map.json\n');
}

main().catch((err) => {
	const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
	process.stderr.write(`Failed to build token map: ${message}\n`);
	process.exit(1);
});
