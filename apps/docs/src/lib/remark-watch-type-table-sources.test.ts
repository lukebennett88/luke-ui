import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFileSystemGeneratorCache, generateHash } from 'fumadocs-typescript';
import { createServer } from 'vite-plus';
import type { ViteDevServer } from 'vite-plus';
import { expect, test } from 'vite-plus/test';
import { findComponentPropsTableTags } from './component-props-table-tags.js';
import { createComponentPropsGenerator } from './create-component-props-generator.js';
import { createLiveTypescriptGenerator } from './create-live-typescript-generator.js';
import { remarkWatchTypeTableSources } from './remark-watch-type-table-sources.js';
import type { EnrichedGeneratedDoc } from './type-definition-model.js';
import { typeTokensToText } from './type-tokens.js';
import { collectTypescriptSourceGraph } from './typescript-source-graph.js';

const timeout = 60_000;

const buttonSource = `import type { PressAction } from './press-action';

export interface ButtonProps {
	onPress?: PressAction;
	isPending?: boolean;
}
`;

const pressActionSource = 'export type PressAction = () => void | Promise<void>;\n';

interface WatchFixture {
	root: string;
	buttonRel: string;
	buttonPath: string;
	pressPath: string;
	guidePath: string;
	guideRel: string;
	tsconfigPath: string;
	cleanup: () => void;
}

function createWatchFixture(): WatchFixture {
	const root = mkdtempSync(join(tmpdir(), 'luke-type-table-watch-'));
	const docsDir = join(root, 'apps', 'docs');
	const fixtureDir = join(root, 'packages', '@luke-ui', 'react', 'src', 'core', 'fixture');
	const pressDir = join(fixtureDir, 'press-action');
	const contentDir = join(docsDir, 'content');
	mkdirSync(docsDir, { recursive: true });
	mkdirSync(pressDir, { recursive: true });
	mkdirSync(contentDir, { recursive: true });

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
	const guideRel = 'apps/docs/content/guide.mdx';
	const guidePath = join(root, guideRel);
	writeFileSync(
		guidePath,
		`## API

<component-props-table path="${buttonRel}" name="ButtonProps" />
`,
	);

	return {
		root,
		buttonRel,
		buttonPath: join(root, buttonRel),
		pressPath: join(pressDir, 'index.ts'),
		guidePath,
		guideRel,
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

function typeTableTreeFromMdx(source: string) {
	return {
		type: 'root' as const,
		children: findComponentPropsTableTags(source).map((tag) => ({
			type: 'mdxJsxFlowElement' as const,
			name: 'component-props-table',
			attributes: [
				{ type: 'mdxJsxAttribute' as const, name: 'path', value: tag.path },
				{ type: 'mdxJsxAttribute' as const, name: 'name', value: tag.name },
			],
		})),
	};
}

test('remark watch plugin registers the entry file and relative imports with the compiler', () => {
	const fixture = createWatchFixture();
	try {
		const dependencies: Array<string> = [];
		remarkWatchTypeTableSources({ basePath: fixture.root })(
			typeTableTreeFromMdx(readFileSync(fixture.guidePath, 'utf8')),
			{
				data: {
					_compiler: {
						addDependency: (filePath: string) => {
							dependencies.push(normalize(filePath));
						},
					},
				},
			},
		);

		expect(dependencies).toContain(normalize(fixture.buttonPath));
		expect(dependencies).toContain(normalize(fixture.pressPath));
	} finally {
		fixture.cleanup();
	}
});

test('remark watch plugin is a no-op when the MDX compiler has no addDependency', () => {
	const fixture = createWatchFixture();
	try {
		expect(() =>
			remarkWatchTypeTableSources({ basePath: fixture.root })(
				typeTableTreeFromMdx(readFileSync(fixture.guidePath, 'utf8')),
				{ data: {} },
			),
		).not.toThrow();
	} finally {
		fixture.cleanup();
	}
});

test(
	'live generator cache key includes the installed fumadocs-typescript version',
	async () => {
		const fixture = createWatchFixture();
		const cacheDir = mkdtempSync(join(tmpdir(), 'luke-live-version-'));
		try {
			const generator = createLiveTypescriptGenerator({
				cache: createFileSystemGeneratorCache(cacheDir),
				tsconfigPath: fixture.tsconfigPath,
			});

			await generator.generateTypeTable(
				{ path: fixture.buttonRel, name: 'ButtonProps' },
				{ basePath: fixture.root },
			);

			const version = fumadocsTypescriptVersion();
			const graphHash = collectTypescriptSourceGraph(fixture.buttonPath, buttonSource).hash;
			const expectedKey = generateHash(
				`${fixture.buttonPath}:ButtonProps:${graphHash}:${version}:1`,
			);
			const withoutVersion = generateHash(`${fixture.buttonPath}:ButtonProps:${graphHash}:1`);

			expect(readdirSync(cacheDir)).toContain(`${expectedKey}.json`);
			expect(readdirSync(cacheDir)).not.toContain(`${withoutVersion}.json`);
		} finally {
			rmSync(cacheDir, { recursive: true, force: true });
			fixture.cleanup();
		}
	},
	timeout,
);

test(
	'Vite recompiles MDX when a type-table TypeScript source changes without editing MDX',
	async () => {
		const fixture = createWatchFixture();
		const cacheDir = mkdtempSync(join(tmpdir(), 'luke-vite-type-table-'));
		const generator = createLiveTypescriptGenerator({
			cache: createFileSystemGeneratorCache(cacheDir),
			tsconfigPath: fixture.tsconfigPath,
		});

		const server = await createServer({
			configFile: false,
			plugins: [
				{
					name: 'luke-type-table-watch-regression',
					async transform(this: { addWatchFile: (id: string) => void }, code, id) {
						if (!id.endsWith('guide.mdx')) return null;

						remarkWatchTypeTableSources({ basePath: fixture.root })(typeTableTreeFromMdx(code), {
							data: {
								_compiler: {
									addDependency: (filePath: string) => {
										this.addWatchFile(filePath);
									},
								},
							},
						});

						const [tag] = findComponentPropsTableTags(code);
						if (tag === undefined) throw new Error('expected a component-props-table tag');
						const docs = await generator.generateTypeTable(
							{ path: tag.path, name: tag.name },
							{ basePath: fixture.root },
						);
						const names = docs[0]?.entries.map((entry) => entry.name) ?? [];
						return {
							code: `export default ${JSON.stringify(names)};\n`,
							map: null,
						};
					},
				},
			],
			root: fixture.root,
			server: {
				watch: {
					// Polling keeps the regression stable under tmpdir watchers in CI/VMs.
					interval: 50,
					usePolling: true,
				},
			},
		});

		try {
			await server.listen();
			// Let chokidar finish its initial scan before the first transform registers watches.
			await settleWatcher();
			const moduleId = '/apps/docs/content/guide.mdx';

			const before = await server.transformRequest(moduleId);
			expect(before?.code).toBeDefined();
			expect(before?.code).not.toContain('papercutProp');
			expect(before?.code).toContain('isPending');
			expectTypeTableWatchLink(server, fixture.buttonPath, fixture.guidePath);

			const change = waitForWatchedChange(server, fixture.buttonPath);
			writeFileSync(fixture.buttonPath, injectPapercutProp(buttonSource));
			await change;
			// Headless transformRequest does not always flush the same HMR reload path as a browser
			// tab; invalidate the watched TypeScript module so its MDX importers re-transform.
			invalidateModulesForFile(server, fixture.buttonPath);

			const after = await server.transformRequest(moduleId);
			expect(after?.code).toContain('papercutProp');
			expect(after?.code).toContain('isPending');
		} finally {
			await server.close();
			rmSync(cacheDir, { recursive: true, force: true });
			fixture.cleanup();
		}
	},
	timeout,
);

test(
	'Vite recompiles MDX when an imported type file changes without editing MDX',
	async () => {
		const fixture = createWatchFixture();
		const cacheDir = mkdtempSync(join(tmpdir(), 'luke-vite-type-table-dep-'));
		const generator = createComponentPropsGenerator({
			cache: createFileSystemGeneratorCache(cacheDir),
			tsconfigPath: fixture.tsconfigPath,
		});

		const server = await createServer({
			configFile: false,
			plugins: [
				{
					name: 'luke-type-table-watch-dep-regression',
					async transform(this: { addWatchFile: (id: string) => void }, code, id) {
						if (!id.endsWith('guide.mdx')) return null;

						remarkWatchTypeTableSources({ basePath: fixture.root })(typeTableTreeFromMdx(code), {
							data: {
								_compiler: {
									addDependency: (filePath: string) => {
										this.addWatchFile(filePath);
									},
								},
							},
						});

						const [tag] = findComponentPropsTableTags(code);
						if (tag === undefined) throw new Error('expected a component-props-table tag');
						const docs = (await generator.generateTypeTable(
							{ path: tag.path, name: tag.name },
							{ basePath: fixture.root },
						)) as Array<EnrichedGeneratedDoc | undefined>;
						return {
							code: `export default ${JSON.stringify(pressActionDefinitionText(docs[0]))};\n`,
							map: null,
						};
					},
				},
			],
			root: fixture.root,
			server: {
				watch: {
					interval: 50,
					usePolling: true,
				},
			},
		});

		try {
			await server.listen();
			await settleWatcher();
			const moduleId = '/apps/docs/content/guide.mdx';

			const before = await server.transformRequest(moduleId);
			expect(before?.code).toBeDefined();
			expect(before?.code).not.toContain('(value: string)');
			expectTypeTableWatchLink(server, fixture.pressPath, fixture.guidePath);

			const change = waitForWatchedChange(server, fixture.pressPath);
			writeFileSync(
				fixture.pressPath,
				'export type PressAction = (value: string) => void | Promise<void>;\n',
			);
			await change;
			invalidateModulesForFile(server, fixture.pressPath);

			const after = await server.transformRequest(moduleId);
			expect(after?.code).toContain('(value: string)');
		} finally {
			await server.close();
			rmSync(cacheDir, { recursive: true, force: true });
			fixture.cleanup();
		}
	},
	timeout,
);

function settleWatcher(): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, 150);
	});
}

function expectTypeTableWatchLink(
	server: ViteDevServer,
	sourcePath: string,
	mdxPath: string,
): void {
	const modules = server.moduleGraph.getModulesByFile(sourcePath);
	expect(modules?.size).toBeGreaterThan(0);
	const importers = [...(modules ?? [])].flatMap((mod) => [...mod.importers]);
	expect(importers.some((importer) => importer.id === mdxPath)).toBe(true);
}

function invalidateModulesForFile(server: ViteDevServer, filePath: string): void {
	for (const mod of server.moduleGraph.getModulesByFile(filePath) ?? []) {
		server.moduleGraph.invalidateModule(mod);
		for (const importer of mod.importers) {
			server.moduleGraph.invalidateModule(importer);
		}
	}
}

function waitForWatchedChange(server: ViteDevServer, filePath: string): Promise<void> {
	const target = normalize(filePath);
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			server.watcher.off('change', onChange);
			reject(new Error(`Timed out waiting for Vite to watch change to ${target}`));
		}, 10_000);

		function onChange(changedPath: string) {
			if (normalize(changedPath) !== target) return;
			clearTimeout(timer);
			server.watcher.off('change', onChange);
			resolve();
		}

		server.watcher.on('change', onChange);
	});
}

function pressActionDefinitionText(doc: EnrichedGeneratedDoc | undefined) {
	const tokens = doc?.typeDefinitions?.PressAction?.definition;
	if (tokens === undefined) return undefined;
	return typeTokensToText(tokens, { multiline: true });
}

function fumadocsTypescriptVersion(): string {
	const entryUrl = import.meta.resolve('fumadocs-typescript');
	let dir = dirname(fileURLToPath(entryUrl));
	for (;;) {
		try {
			const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
				name?: string;
				version?: string;
			};
			if (pkg.name === 'fumadocs-typescript' && typeof pkg.version === 'string') {
				return pkg.version;
			}
		} catch {
			// Keep walking toward the package root.
		}
		const parent = dirname(dir);
		if (parent === dir) {
			throw new Error('Could not resolve fumadocs-typescript package version');
		}
		dir = parent;
	}
}
