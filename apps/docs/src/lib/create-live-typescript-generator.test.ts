import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFileSystemGeneratorCache } from 'fumadocs-typescript';
import { expect, test } from 'vite-plus/test';
import { createComponentPropsGenerator } from './create-component-props-generator.js';
import { createLiveTypescriptGenerator } from './create-live-typescript-generator.js';
import type { EnrichedGeneratedDoc } from './type-definition-model.js';
import { typeTokensToText } from './type-tokens.js';
import { hashTypescriptSourceGraph } from './typescript-source-graph.js';

const timeout = 60_000;

const buttonSource = `import type { PressAction } from './press-action';

export interface ButtonProps {
	onPress?: PressAction;
	isPending?: boolean;
}

export interface LinkProps {
	href: string;
	isPending?: boolean;
}
`;

const pressActionSource = 'export type PressAction = () => void | Promise<void>;\n';

interface LiveFixture {
	root: string;
	buttonRel: string;
	buttonPath: string;
	pressPath: string;
	tsconfigPath: string;
	cleanup: () => void;
}

function createLiveFixture(options: { pathSegment?: string } = {}): LiveFixture {
	const segment = options.pathSegment ?? 'luke-live-';
	const root = mkdtempSync(join(tmpdir(), segment));
	const docsDir = join(root, 'apps', 'docs');
	const fixtureDir = join(root, 'packages', '@luke-ui', 'react', 'src', 'core', 'fixture');
	const pressDir = join(fixtureDir, 'press-action');
	mkdirSync(docsDir, { recursive: true });
	mkdirSync(pressDir, { recursive: true });

	writeFileSync(
		join(docsDir, 'tsconfig.json'),
		`${JSON.stringify(
			{
				compilerOptions: {
					jsx: 'react-jsx',
					module: 'ESNext',
					moduleResolution: 'bundler',
					noEmit: true,
					skipLibCheck: true,
					strict: true,
					target: 'ESNext',
				},
				include: ['**/*.ts', '**/*.tsx'],
			},
			null,
			'\t',
		)}\n`,
	);
	writeFileSync(join(pressDir, 'index.ts'), pressActionSource);
	writeFileSync(join(fixtureDir, 'button.tsx'), buttonSource);

	const buttonRel = 'packages/@luke-ui/react/src/core/fixture/button.tsx';
	return {
		root,
		buttonRel,
		buttonPath: join(root, buttonRel),
		pressPath: join(pressDir, 'index.ts'),
		tsconfigPath: join(docsDir, 'tsconfig.json'),
		cleanup: () => {
			rmSync(root, { recursive: true, force: true });
		},
	};
}

function injectPapercutProp(source: string): string {
	return source.replace(
		'\tisPending?: boolean;',
		'\tpapercutProp?: string;\n\tisPending?: boolean;',
	);
}

test('source graph hash changes when a relative import changes', () => {
	const fixture = createLiveFixture();
	try {
		const before = hashTypescriptSourceGraph(fixture.buttonPath, buttonSource);
		writeFileSync(fixture.pressPath, `${pressActionSource}\n`);
		expect(hashTypescriptSourceGraph(fixture.buttonPath, buttonSource)).not.toBe(before);
	} finally {
		fixture.cleanup();
	}
});

test(
	'live generator picks up a new prop after a disk edit without a new process',
	async () => {
		const fixture = createLiveFixture();
		const cacheDir = mkdtempSync(join(tmpdir(), 'luke-live-ts-'));
		try {
			const generator = createLiveTypescriptGenerator({
				cache: createFileSystemGeneratorCache(cacheDir),
				tsconfigPath: fixture.tsconfigPath,
			});

			const before = await generator.generateTypeTable(
				{ path: fixture.buttonRel, name: 'ButtonProps' },
				{ basePath: fixture.root },
			);
			expect(before[0]?.entries.some((entry) => entry.name === 'papercutProp')).toBe(false);

			writeFileSync(fixture.buttonPath, injectPapercutProp(buttonSource));
			const after = await generator.generateTypeTable(
				{ path: fixture.buttonRel, name: 'ButtonProps' },
				{ basePath: fixture.root },
			);
			expect(after[0]?.entries.some((entry) => entry.name === 'papercutProp')).toBe(true);
		} finally {
			rmSync(cacheDir, { recursive: true, force: true });
			fixture.cleanup();
		}
	},
	timeout,
);

test(
	'component props generator keeps a new prop after a disk edit on the same instance',
	async () => {
		const fixture = createLiveFixture();
		const cacheDir = mkdtempSync(join(tmpdir(), 'luke-live-props-'));
		try {
			const generator = createComponentPropsGenerator({
				cache: createFileSystemGeneratorCache(cacheDir),
				tsconfigPath: fixture.tsconfigPath,
			});

			const before = await generator.generateTypeTable(
				{ path: fixture.buttonRel, name: 'ButtonProps' },
				{ basePath: fixture.root },
			);
			expect(before[0]?.entries.some((entry) => entry.name === 'papercutProp')).toBe(false);

			writeFileSync(fixture.buttonPath, injectPapercutProp(buttonSource));
			const after = await generator.generateTypeTable(
				{ path: fixture.buttonRel, name: 'ButtonProps' },
				{ basePath: fixture.root },
			);
			expect(after[0]?.entries.some((entry) => entry.name === 'papercutProp')).toBe(true);
		} finally {
			rmSync(cacheDir, { recursive: true, force: true });
			fixture.cleanup();
		}
	},
	timeout,
);

test(
	'component props generator refreshes an imported type definition after a disk edit',
	async () => {
		const fixture = createLiveFixture();
		const cacheDir = mkdtempSync(join(tmpdir(), 'luke-live-dep-'));
		try {
			const generator = createComponentPropsGenerator({
				cache: createFileSystemGeneratorCache(cacheDir),
				tsconfigPath: fixture.tsconfigPath,
			});

			const before = await generator.generateTypeTable(
				{ path: fixture.buttonRel, name: 'ButtonProps' },
				{ basePath: fixture.root },
			);
			const definitionBefore = pressActionDefinitionText(before[0]);
			expect(definitionBefore).toBeTruthy();
			expect(definitionBefore).not.toContain('(value: string)');

			writeFileSync(
				fixture.pressPath,
				'export type PressAction = (value: string) => void | Promise<void>;\n',
			);
			const after = await generator.generateTypeTable(
				{ path: fixture.buttonRel, name: 'ButtonProps' },
				{ basePath: fixture.root },
			);
			const definitionAfter = pressActionDefinitionText(after[0]);
			expect(definitionAfter).toContain('(value: string)');
			expect(definitionAfter).not.toBe(definitionBefore);
		} finally {
			rmSync(cacheDir, { recursive: true, force: true });
			fixture.cleanup();
		}
	},
	timeout,
);

test(
	'live generator serves simultaneous cold-cache requests without resetting under each other',
	async () => {
		const fixture = createLiveFixture();
		const cacheDir = mkdtempSync(join(tmpdir(), 'luke-live-concurrent-'));
		try {
			const generator = createLiveTypescriptGenerator({
				cache: createFileSystemGeneratorCache(cacheDir),
				tsconfigPath: fixture.tsconfigPath,
			});

			const [buttonDocs, linkDocs, buttonAgain] = await Promise.all([
				generator.generateTypeTable(
					{ path: fixture.buttonRel, name: 'ButtonProps' },
					{ basePath: fixture.root },
				),
				generator.generateTypeTable(
					{ path: fixture.buttonRel, name: 'LinkProps' },
					{ basePath: fixture.root },
				),
				generator.generateTypeTable(
					{ path: fixture.buttonRel, name: 'ButtonProps' },
					{ basePath: fixture.root },
				),
			]);

			expect(buttonDocs[0]?.entries.some((entry) => entry.name === 'onPress')).toBe(true);
			expect(linkDocs[0]?.entries.some((entry) => entry.name === 'href')).toBe(true);
			expect(buttonAgain[0]?.entries.some((entry) => entry.name === 'onPress')).toBe(true);
		} finally {
			rmSync(cacheDir, { recursive: true, force: true });
			fixture.cleanup();
		}
	},
	timeout,
);

test(
	'live generator invalidates concurrent requests after a source change',
	async () => {
		const fixture = createLiveFixture();
		const cacheDir = mkdtempSync(join(tmpdir(), 'luke-live-invalidate-'));
		try {
			const generator = createLiveTypescriptGenerator({
				cache: createFileSystemGeneratorCache(cacheDir),
				tsconfigPath: fixture.tsconfigPath,
			});

			const warmed = await generator.generateTypeTable(
				{ path: fixture.buttonRel, name: 'ButtonProps' },
				{ basePath: fixture.root },
			);
			expect(warmed[0]?.entries.some((entry) => entry.name === 'papercutProp')).toBe(false);

			writeFileSync(fixture.buttonPath, injectPapercutProp(buttonSource));
			const [first, second] = await Promise.all([
				generator.generateTypeTable(
					{ path: fixture.buttonRel, name: 'ButtonProps' },
					{ basePath: fixture.root },
				),
				generator.generateTypeTable(
					{ path: fixture.buttonRel, name: 'ButtonProps' },
					{ basePath: fixture.root },
				),
			]);

			expect(first[0]?.entries.some((entry) => entry.name === 'papercutProp')).toBe(true);
			expect(second[0]?.entries.some((entry) => entry.name === 'papercutProp')).toBe(true);
		} finally {
			rmSync(cacheDir, { recursive: true, force: true });
			fixture.cleanup();
		}
	},
	timeout,
);

test(
	'component props generator invalidates visibility when the repo path contains spaces',
	async () => {
		const fixture = createLiveFixture({ pathSegment: 'luke live space ' });
		const cacheDir = mkdtempSync(join(tmpdir(), 'luke-live-space-'));
		try {
			expect(fixture.root).toContain(' ');
			const generator = createComponentPropsGenerator({
				cache: createFileSystemGeneratorCache(cacheDir),
				tsconfigPath: fixture.tsconfigPath,
			});

			const before = await generator.generateTypeTable(
				{ path: fixture.buttonRel, name: 'ButtonProps' },
				{ basePath: fixture.root },
			);
			expect(before[0]?.entries.some((entry) => entry.name === 'papercutProp')).toBe(false);

			writeFileSync(fixture.buttonPath, injectPapercutProp(buttonSource));
			const after = await generator.generateTypeTable(
				{ path: fixture.buttonRel, name: 'ButtonProps' },
				{ basePath: fixture.root },
			);
			expect(after[0]?.entries.some((entry) => entry.name === 'papercutProp')).toBe(true);
		} finally {
			rmSync(cacheDir, { recursive: true, force: true });
			fixture.cleanup();
		}
	},
	timeout,
);

function pressActionDefinitionText(doc: EnrichedGeneratedDoc | undefined) {
	const tokens = doc?.typeDefinitions?.PressAction?.definition;
	if (tokens === undefined) return undefined;
	return typeTokensToText(tokens, { multiline: true });
}
