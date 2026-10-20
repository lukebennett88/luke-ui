import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vite-plus/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

interface PackageManifest {
	name?: string;
	scripts?: Record<string, string>;
}

interface TurboConfig {
	tasks?: Record<string, { cache?: boolean; dependsOn?: Array<string> }>;
}

function readJson<T>(filePath: string): T {
	return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function workspaceManifestPaths(): Array<string> {
	const paths: Array<string> = [];
	const groups = [
		path.join(root, 'apps'),
		path.join(root, 'packages'),
		path.join(root, 'packages/@luke-ui'),
	];

	for (const group of groups) {
		if (!existsSync(group)) continue;
		for (const entry of readdirSync(group, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const manifestPath = path.join(group, entry.name, 'package.json');
			if (existsSync(manifestPath)) paths.push(manifestPath);
		}
	}

	const workflowScripts = path.join(root, '.github/scripts/package.json');
	if (existsSync(workflowScripts)) paths.push(workflowScripts);
	return paths;
}

function workspaceManifests(): Array<PackageManifest> {
	return workspaceManifestPaths().map((manifestPath) => readJson<PackageManifest>(manifestPath));
}

function turboConfig(): TurboConfig {
	return readJson<TurboConfig>(path.join(root, 'turbo.json'));
}

function missingFixDependencies(scriptName: string, rootTaskName: string): Array<string> {
	const dependsOn = turboConfig().tasks?.[rootTaskName]?.dependsOn ?? [];
	const missing: Array<string> = [];

	for (const manifest of workspaceManifests()) {
		if (manifest.name === undefined) continue;
		if (manifest.scripts?.[scriptName] === undefined) continue;
		const dependency = `${manifest.name}#${scriptName}`;
		if (!dependsOn.includes(dependency)) missing.push(dependency);
	}

	return missing;
}

test('fix graph includes every package type-aware lint fix', () => {
	expect(missingFixDependencies('fix:lint:types', '//#fix:format')).toEqual([]);
});

test('fix graph includes every package unsafe type-aware lint fix', () => {
	expect(missingFixDependencies('fix:lint:types:unsafe', '//#fix:format:unsafe')).toEqual([]);
});

test('react browser tests build the theme-tactile stylesheet they import', () => {
	const tasks = turboConfig().tasks ?? {};
	expect(tasks['@luke-ui/react#test']?.dependsOn).toContain('@luke-ui/theme-tactile#build');
	expect(tasks['@luke-ui/react#test:browser']?.dependsOn).toContain('@luke-ui/theme-tactile#build');
});

test('react barrel checks wait for the generated dist imports they inspect', () => {
	expect(turboConfig().tasks?.['@luke-ui/react#check:barrels']?.dependsOn).toContain('build');
});

test('tasks named test are never cached', () => {
	const cached: Array<string> = [];

	for (const [taskKey, task] of Object.entries(turboConfig().tasks ?? {})) {
		const taskName = taskKey.slice(taskKey.lastIndexOf('#') + 1);
		if (!taskName.startsWith('test')) continue;
		if (task.cache !== false) cached.push(taskKey);
	}

	expect(cached).toEqual([]);
});
