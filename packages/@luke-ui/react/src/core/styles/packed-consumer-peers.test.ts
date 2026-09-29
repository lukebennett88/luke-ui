import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';

const packageRoot = fileURLToPath(new URL('../../..', import.meta.url));
const rainbowPackageRoot = fileURLToPath(new URL('../../../../rainbow-sprinkles', import.meta.url));

/**
 * Proves the packed packages install and typecheck against the minimum peer versions implied by
 * the published peer ranges, and that declarations resolve under that TypeScript floor.
 *
 * Optional env for registry reuse later (#710 / #721):
 * `LUKE_UI_REACT_SPEC` and `LUKE_UI_RAINBOW_SPEC` replace the local `file:` tarball specs.
 */
test(
	'installs minimum React peer floors and typechecks packed declarations',
	{ timeout: 180_000 },
	async () => {
		const workDir = await mkdtemp(path.join(tmpdir(), 'luke-ui-react-peers-'));
		const tarballDir = path.join(workDir, 'pack');
		const consumerDir = path.join(workDir, 'consumer');
		try {
			await writeFile(path.join(workDir, 'package.json'), JSON.stringify({ private: true }));
			execFileSync('mkdir', ['-p', tarballDir, consumerDir]);

			const rainbowTarballPath = path.join(
				tarballDir,
				packWorkspacePackage(rainbowPackageRoot, tarballDir),
			);
			const reactTarballPath = path.join(tarballDir, packWorkspacePackage(packageRoot, tarballDir));
			const packedReactJson = readPackedPackageJson(reactTarballPath);
			const peers = packedReactJson.peerDependencies;
			if (peers === undefined) {
				throw new Error('Expected packed @luke-ui/react to declare peerDependencies.');
			}

			const reactFloor = peerVersionFloor(peers.react);
			const reactDomFloor = peerVersionFloor(peers['react-dom']);
			const racFloor = peerVersionFloor(peers['react-aria-components']);

			const reactSpec = process.env.LUKE_UI_REACT_SPEC ?? `file:${reactTarballPath}`;
			const rainbowSpec = process.env.LUKE_UI_RAINBOW_SPEC ?? `file:${rainbowTarballPath}`;

			await writeFile(
				path.join(consumerDir, 'package.json'),
				JSON.stringify(
					{
						name: 'packed-consumer-peers-fixture',
						private: true,
						type: 'module',
						dependencies: {
							'@luke-ui/rainbow-sprinkles': rainbowSpec,
							'@luke-ui/react': reactSpec,
							react: reactFloor,
							'react-aria-components': racFloor,
							'react-dom': reactDomFloor,
						},
						devDependencies: {
							'@types/react': reactFloor,
							'@types/react-dom': reactDomFloor,
							typescript: '7.0.2',
						},
					},
					null,
					2,
				),
			);

			execFileSync('npm', ['install', '--ignore-scripts'], {
				cwd: consumerDir,
				encoding: 'utf8',
				env: {
					PATH: process.env.PATH ?? '',
					HOME: process.env.HOME ?? '',
					npm_config_cache: process.env.npm_config_cache,
					npm_config_registry: process.env.npm_config_registry,
				},
				stdio: ['ignore', 'pipe', 'pipe'],
			});

			expect(readInstalledVersion(consumerDir, 'react')).toBe(reactFloor);
			expect(readInstalledVersion(consumerDir, 'react-dom')).toBe(reactDomFloor);
			expect(readInstalledVersion(consumerDir, 'react-aria-components')).toBe(racFloor);

			const installedReactRoot = realpathSync(
				path.join(consumerDir, 'node_modules', '@luke-ui', 'react'),
			);
			expect(installedReactRoot.startsWith(consumerDir)).toBe(true);
			expect(installedReactRoot.includes(`${path.sep}packages${path.sep}`)).toBe(false);

			const probeScript = path.join(consumerDir, 'probe.mjs');
			await writeFile(probeScript, MIN_PEER_PROBE_SCRIPT);
			const output = execFileSync('node', [probeScript], {
				cwd: consumerDir,
				encoding: 'utf8',
				env: { PATH: process.env.PATH ?? '' },
			});
			const parsed: unknown = JSON.parse(output);
			if (!isRecord(parsed)) {
				throw new Error('Expected peer probe to return a JSON object.');
			}
			expect(parsed.markup).toEqual(expect.stringContaining('<blockquote'));
			expect(parsed.markup).toEqual(expect.stringContaining('Hello world'));

			await writeFile(
				path.join(consumerDir, 'tsconfig.json'),
				JSON.stringify(
					{
						compilerOptions: {
							module: 'nodenext',
							moduleResolution: 'nodenext',
							strict: true,
							jsx: 'react-jsx',
							skipLibCheck: false,
							noEmit: true,
							types: ['react', 'react-dom'],
						},
						include: ['consumer.ts'],
					},
					null,
					2,
				),
			);
			await writeFile(
				path.join(consumerDir, 'consumer.ts'),
				[
					"import type { ComponentProps } from 'react';",
					"import { Blockquote } from '@luke-ui/react/blockquote';",
					"import { createSprinkles } from '@luke-ui/react/styles';",
					'',
					'type BlockquoteProps = ComponentProps<typeof Blockquote>;',
					'export const props: BlockquoteProps = { children: "Hello" };',
					'export const layout = createSprinkles({ display: "flex" });',
					'',
				].join('\n'),
			);

			execFileSync(
				path.join(consumerDir, 'node_modules', '.bin', 'tsc'),
				['--project', 'tsconfig.json'],
				{
					cwd: consumerDir,
					encoding: 'utf8',
					env: { PATH: process.env.PATH ?? '' },
				},
			);
		} finally {
			await rm(workDir, { force: true, recursive: true });
		}
	},
);

const MIN_PEER_PROBE_SCRIPT = `
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Blockquote } from '@luke-ui/react/blockquote';

const markup = renderToString(createElement(Blockquote, null, 'Hello world'));
process.stdout.write(JSON.stringify({ markup }));
`;

function packWorkspacePackage(cwd: string, destination: string): string {
	const output = execFileSync('pnpm', ['pack', '--pack-destination', destination], {
		cwd,
		encoding: 'utf8',
	});
	const match = /[a-z0-9@._-]+\.tgz/i.exec(output);
	if (match === null) {
		throw new Error(`Expected pnpm pack to print a tarball name, received:\n${output}`);
	}
	return match[0];
}

function readPackedPackageJson(tarballPath: string): {
	peerDependencies?: Record<string, string>;
} {
	const raw = execFileSync('tar', ['-xOf', tarballPath, 'package/package.json'], {
		encoding: 'utf8',
	});
	const parsed: unknown = JSON.parse(raw);
	if (!isRecord(parsed)) {
		throw new Error('Expected packed package.json to be an object.');
	}
	return {
		peerDependencies: isRecord(parsed.peerDependencies)
			? (parsed.peerDependencies as Record<string, string>)
			: undefined,
	};
}

/** Lowest concrete version implied by a caret/tilde/exact peer range. */
function peerVersionFloor(range: string | undefined): string {
	if (range === undefined || range.length === 0) {
		throw new Error('Expected a peer dependency range.');
	}
	const match = /(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/.exec(range);
	if (match === null) {
		throw new Error(`Expected a semver version inside peer range "${range}".`);
	}
	return match[1]!;
}

function readInstalledVersion(consumerDir: string, name: string): string {
	const packageJsonPath = path.join(
		consumerDir,
		'node_modules',
		...name.split('/'),
		'package.json',
	);
	const parsed: unknown = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
	if (!isRecord(parsed) || typeof parsed.version !== 'string') {
		throw new Error(`Expected installed ${name} to declare a version.`);
	}
	return parsed.version;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
