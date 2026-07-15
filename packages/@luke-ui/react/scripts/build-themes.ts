#!/usr/bin/env tsx

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { buildTheme } from '../src/theme/build-theme.js';
import { paperFoundation, tactileFoundation } from '../src/theme/foundations.js';

const foundations = [tactileFoundation, paperFoundation];

async function main() {
	await Promise.all(
		foundations.map(async (foundation) => {
			const outputPath = fileURLToPath(
				new URL(`../dist/themes/${foundation.name}.css`, import.meta.url),
			);
			await mkdir(dirname(outputPath), { recursive: true });
			await writeFile(outputPath, buildTheme(foundation), 'utf8');
			process.stdout.write(`Generated dist/themes/${foundation.name}.css\n`);
		}),
	);
}

main().catch((err) => {
	const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
	process.stderr.write(`Failed to build themes: ${message}\n`);
	process.exit(1);
});
