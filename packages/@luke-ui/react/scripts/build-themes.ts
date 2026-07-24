#!/usr/bin/env tsx

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { defineTheme } from '../src/theme/define-theme.js';
import { paperTheme, tactileTheme } from '../src/theme/foundations.js';

const themes = [tactileTheme, paperTheme];

async function main() {
	await Promise.all(
		themes.map(async (theme) => {
			const outputPath = fileURLToPath(
				new URL(`../dist/themes/${theme.name}.css`, import.meta.url),
			);
			await mkdir(dirname(outputPath), { recursive: true });
			await writeFile(outputPath, defineTheme(theme), 'utf8');
			process.stdout.write(`Generated dist/themes/${theme.name}.css\n`);
		}),
	);
}

main().catch((err) => {
	const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
	process.stderr.write(`Failed to build themes: ${message}\n`);
	process.exit(1);
});
