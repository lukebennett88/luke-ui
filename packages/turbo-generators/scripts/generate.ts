import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const generatorName = process.argv[2];
if (generatorName !== 'component' && generatorName !== 'primitive') {
	console.error('Usage: tsx scripts/generate.ts <component|primitive> [turbo args...]');
	process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
const rootRequire = createRequire(path.join(root, 'package.json'));
const turboBin = rootRequire.resolve('turbo/bin/turbo');

// pnpm injects npm_config_* / pnpm_config_* when running this script. Turbo (or a dep) runs
// npm, which warns on pnpm-only vars. Strip them so the child never sees them.
const env = Object.fromEntries(
	Object.entries(process.env).filter(([k]) => !/^(npm|pnpm)_config_/i.test(k)),
);

const child = spawn(
	process.execPath,
	[
		turboBin,
		'generate',
		generatorName,
		'--config',
		'packages/turbo-generators/config.ts',
		...process.argv.slice(3),
	],
	{ cwd: root, env, stdio: 'inherit' },
);

child.on('error', () => process.exit(1));
child.on('exit', (code, signal) => {
	if (signal) process.kill(process.pid, signal);
	else process.exit(code ?? 1);
});
