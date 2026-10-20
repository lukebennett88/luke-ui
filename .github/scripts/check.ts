import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Compare contents, including pre-existing edits, rather than requiring a clean checkout. */
export function snapshotTrackedFiles(cwd: string): Map<string, string> {
	const files = spawnSync('git', ['ls-files', '-z'], { cwd, encoding: 'utf8' });
	if (files.status !== 0) throw new Error(files.stderr || 'Unable to list tracked files.');
	return new Map(
		files.stdout
			.split('\0')
			.filter(Boolean)
			.map((file) => {
				try {
					return [
						file,
						createHash('sha256')
							.update(readFileSync(resolve(cwd, file)))
							.digest('hex'),
					];
				} catch (error) {
					if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
					return [file, 'deleted'];
				}
			}),
	);
}

export function changedTrackedFiles(
	before: Map<string, string>,
	after: Map<string, string>,
): Array<string> {
	// Only files listed in both snapshots: staging or unstaging a file during
	// the run changes the index, not the file contents checks must preserve.
	return [...before.keys()].filter(
		(file) => after.has(file) && before.get(file) !== after.get(file),
	);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const cwd = process.cwd();
	const before = snapshotTrackedFiles(cwd);
	const check = spawnSync(
		'turbo',
		[
			'run',
			'//#check:source',
			'check:barrels',
			'check:docs',
			'check:llms',
			'check:types',
			'check:lint:types',
			'//#check:cycles:run',
			'//#check:unused:run',
		],
		{ cwd, stdio: 'inherit' },
	);
	const changed = changedTrackedFiles(before, snapshotTrackedFiles(cwd));
	if (changed.length) {
		process.stderr.write(`Checks changed tracked files:\n${changed.join('\n')}\n`);
	}
	if (check.error) process.stderr.write(`${check.error.message}\n`);
	process.exitCode = changed.length ? 1 : (check.status ?? 1);
}
