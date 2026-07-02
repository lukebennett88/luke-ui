import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

const packageJsonPath = fileURLToPath(new URL('../../../package.json', import.meta.url));
const turboJsonPath = fileURLToPath(new URL('../../../../../../turbo.json', import.meta.url));
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
});
