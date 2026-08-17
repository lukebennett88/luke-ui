import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createComponent } from '../src/apply-component-creation-plan.js';
import { parseGenerateArgs } from '../src/generate-component-args.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');
const rootRequire = createRequire(path.join(root, 'package.json'));
const turboBin = rootRequire.resolve('turbo/bin/turbo');
const argv = process.argv.slice(2);

// pnpm injects npm_config_* / pnpm_config_* when running this script. Turbo (or a dep) runs
// npm, which warns on pnpm-only vars. Strip them so the child never sees them.
const env = Object.fromEntries(
	Object.entries(process.env).filter(([k]) => !/^(npm|pnpm)_config_/i.test(k)),
);

async function main(): Promise<void> {
	const parsed = parseGenerateArgs(argv);
	if (parsed.kind === 'args') {
		const plan = await createComponent(root, parsed.answers);
		process.stdout.write(`Created ${plan.expected.packageExportPath}\n`);
		return;
	}

	const child = spawn(
		process.execPath,
		[turboBin, 'generate', 'component', '--config', 'packages/turbo-generators/config.ts', ...argv],
		{ cwd: root, env, stdio: 'inherit' },
	);

	await new Promise<void>((resolve, reject) => {
		child.on('error', reject);
		child.on('exit', (code, signal) => {
			if (signal) {
				process.kill(process.pid, signal);
				return;
			}
			if (code === 0) {
				resolve();
				return;
			}
			process.exit(code ?? 1);
		});
	});
}

await main();
