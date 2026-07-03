import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

const execFileAsync = promisify(execFile);
const packageJsonPath = fileURLToPath(new URL('../../package.json', import.meta.url));
const packageRoot = fileURLToPath(new URL('../../', import.meta.url));
const docsDir = fileURLToPath(new URL('../../docs/', import.meta.url));
const staleDocsPath = fileURLToPath(
	new URL('../../docs/use-synchronize-animations.md', import.meta.url),
);
const turboJsonPath = fileURLToPath(new URL('../../../../../turbo.json', import.meta.url));
const packageJsonSchema = z.object({
	scripts: z.record(z.string(), z.string()),
});
const turboJsonSchema = z.object({
	tasks: z.record(
		z.string(),
		z.object({
			dependsOn: z.array(z.string()).optional(),
		}),
	),
});

describe('package scripts', () => {
	it('lets Turbo order build before package docs generation', async () => {
		const packageJson = packageJsonSchema.parse(
			JSON.parse(await readFile(packageJsonPath, 'utf8')),
		);
		const turboJson = turboJsonSchema.parse(JSON.parse(await readFile(turboJsonPath, 'utf8')));

		expect(packageJson.scripts.build).toBe('pnpm run build:tsdown');
		expect(packageJson.scripts.generate).toBe('pnpm run generate:assets');
		expect(turboJson.tasks['@luke-ui/react#generate:docs']?.dependsOn).toContain('build');
		expect(turboJson.tasks['docs#dev']?.dependsOn).toContain('@luke-ui/react#generate:docs');
	});

	it('removes stale generated package docs before writing current pages', async () => {
		await mkdir(docsDir, { recursive: true });
		await writeFile(staleDocsPath, '# stale page\n', 'utf8');

		try {
			await execFileAsync('pnpm', ['exec', 'tsx', 'scripts/generate-docs.ts'], {
				cwd: packageRoot,
			});

			await expect(access(staleDocsPath)).rejects.toMatchObject({ code: 'ENOENT' });
		} finally {
			await rm(staleDocsPath, { force: true });
		}
	});
});
