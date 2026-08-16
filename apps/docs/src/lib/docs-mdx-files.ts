import { readdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';

/** Absolute paths of every `.mdx` file under `contentDir`, sorted. */
export function findMdxFiles(contentDir: string): Array<string> {
	return walkMdxFiles(resolve(contentDir)).sort();
}

function walkMdxFiles(directory: string): Array<string> {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = resolve(directory, entry.name);
		if (entry.isDirectory()) return walkMdxFiles(path);
		return extname(entry.name) === '.mdx' ? [path] : [];
	});
}
