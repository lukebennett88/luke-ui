import { readdir } from 'node:fs/promises';

/**
 * Counts `.png` files anywhere under `directory`, replacing the workflows'
 * `find … -name '*.png' | wc -l`. A missing directory counts as zero rather than
 * throwing: "nothing was rendered" and "the output directory was never created"
 * are the same failure to the caller, and both are reported by the caller with a
 * message that says what to do about it.
 */
export async function countPngs(directory: string): Promise<number> {
	const entries = await readdir(directory, { recursive: true, withFileTypes: true }).catch(
		() => [],
	);

	let count = 0;
	for (const entry of entries) {
		if (entry.isFile() && entry.name.endsWith('.png')) count += 1;
	}
	return count;
}
