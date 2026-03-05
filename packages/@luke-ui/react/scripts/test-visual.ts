import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const envFilePath = path.join(packageRoot, '.env.local');

function parseEnvFile(content: string): Record<string, string> {
	const values: Record<string, string> = {};

	for (const line of content.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const separatorIndex = trimmed.indexOf('=');
		if (separatorIndex < 1) continue;

		const key = trimmed.slice(0, separatorIndex).trim();
		let value = trimmed.slice(separatorIndex + 1).trim();
		if (!key) continue;

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		values[key] = value;
	}

	return values;
}

if (!process.env.ARGOS_TOKEN && existsSync(envFilePath)) {
	const envContent = readFileSync(envFilePath, 'utf8');
	const parsedValues = parseEnvFile(envContent);

	for (const [key, value] of Object.entries(parsedValues)) {
		if (!(key in process.env)) {
			process.env[key] = value;
		}
	}
}

const env = { ...process.env };
if (env.ARGOS_TOKEN) {
	env.ARGOS_UPLOAD = '1';
}

const result = spawnSync('pnpm', ['exec', 'vitest', 'run', '--project=storybook'], {
	cwd: packageRoot,
	env,
	stdio: 'inherit',
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
