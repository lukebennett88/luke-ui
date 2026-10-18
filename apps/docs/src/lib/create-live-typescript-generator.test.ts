import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFileSystemGeneratorCache } from 'fumadocs-typescript';
import { expect, test } from 'vite-plus/test';
import { createComponentPropsGenerator } from './create-component-props-generator.js';
import { createLiveTypescriptGenerator } from './create-live-typescript-generator.js';
import { hashTypescriptSourceGraph } from './typescript-source-graph.js';

const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const buttonRel = 'packages/@luke-ui/react/src/core/button/button.tsx';
const buttonPath = resolve(repoRoot, buttonRel);
const pressRel = 'packages/@luke-ui/react/src/core/use-press-action/use-press-action.ts';
const pressPath = resolve(repoRoot, pressRel);
const tsconfigPath = resolve(repoRoot, 'apps/docs/tsconfig.json');
const timeout = 60_000;

const pendingNeedle = '\t\tisPending?: boolean;';
const pendingInjection = '\t\tpapercutProp?: string;\n\t\tisPending?: boolean;';

test('source graph hash changes when a relative import changes', () => {
	const original = readFileSync(buttonPath, 'utf8');
	const pressOriginal = readFileSync(pressPath, 'utf8');
	const before = hashTypescriptSourceGraph(buttonPath, original);

	writeFileSync(pressPath, `${pressOriginal}\n`);
	try {
		expect(hashTypescriptSourceGraph(buttonPath, original)).not.toBe(before);
	} finally {
		writeFileSync(pressPath, pressOriginal);
	}
});

test(
	'live generator picks up a new prop after a disk edit without a new process',
	async () => {
		const cacheDir = mkdtempSync(join(tmpdir(), 'luke-live-ts-'));
		const original = readFileSync(buttonPath, 'utf8');
		const edited = original.replace(pendingNeedle, pendingInjection);
		expect(edited).toContain('papercutProp');

		const generator = createLiveTypescriptGenerator({
			cache: createFileSystemGeneratorCache(cacheDir),
			tsconfigPath,
		});

		const before = await generator.generateTypeTable(
			{ path: buttonRel, name: 'ButtonProps' },
			{ basePath: repoRoot },
		);
		expect(before[0]?.entries.some((entry) => entry.name === 'papercutProp')).toBe(false);

		writeFileSync(buttonPath, edited);
		try {
			const after = await generator.generateTypeTable(
				{ path: buttonRel, name: 'ButtonProps' },
				{ basePath: repoRoot },
			);
			expect(after[0]?.entries.some((entry) => entry.name === 'papercutProp')).toBe(true);
		} finally {
			writeFileSync(buttonPath, original);
			rmSync(cacheDir, { recursive: true, force: true });
		}
	},
	timeout,
);

test(
	'component props generator keeps a new prop after a disk edit on the same instance',
	async () => {
		const cacheDir = mkdtempSync(join(tmpdir(), 'luke-live-props-'));
		const original = readFileSync(buttonPath, 'utf8');
		const edited = original.replace(pendingNeedle, pendingInjection);

		const generator = createComponentPropsGenerator({
			cache: createFileSystemGeneratorCache(cacheDir),
			tsconfigPath,
		});

		const before = await generator.generateTypeTable(
			{ path: buttonRel, name: 'ButtonProps' },
			{ basePath: repoRoot },
		);
		expect(before[0]?.entries.some((entry) => entry.name === 'papercutProp')).toBe(false);

		writeFileSync(buttonPath, edited);
		try {
			const after = await generator.generateTypeTable(
				{ path: buttonRel, name: 'ButtonProps' },
				{ basePath: repoRoot },
			);
			expect(after[0]?.entries.some((entry) => entry.name === 'papercutProp')).toBe(true);
		} finally {
			writeFileSync(buttonPath, original);
			rmSync(cacheDir, { recursive: true, force: true });
		}
	},
	timeout,
);

test(
	'live generator invalidates when an imported type file changes',
	async () => {
		const cacheDir = mkdtempSync(join(tmpdir(), 'luke-live-dep-'));
		const original = readFileSync(pressPath, 'utf8');
		const edited = original.replace(
			/export type PressAction\s*=\s*[^;]+;/,
			'export type PressAction = ((value: string) => void | Promise<void>) | undefined;',
		);
		expect(edited).not.toBe(original);

		const generator = createLiveTypescriptGenerator({
			cache: createFileSystemGeneratorCache(cacheDir),
			tsconfigPath,
		});

		const before = await generator.generateTypeTable(
			{ path: buttonRel, name: 'ButtonProps' },
			{ basePath: repoRoot },
		);
		const typeBefore = before[0]?.entries.find((entry) => entry.name === 'pressAction')?.type;

		writeFileSync(pressPath, edited);
		try {
			const after = await generator.generateTypeTable(
				{ path: buttonRel, name: 'ButtonProps' },
				{ basePath: repoRoot },
			);
			const typeAfter = after[0]?.entries.find((entry) => entry.name === 'pressAction')?.type;
			expect(typeAfter).not.toBe(typeBefore);
		} finally {
			writeFileSync(pressPath, original);
			rmSync(cacheDir, { recursive: true, force: true });
		}
	},
	timeout,
);
