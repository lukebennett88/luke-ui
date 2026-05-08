import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

export async function renderLlmsFull(docsDir: string, slugs: Array<string>): Promise<string> {
	const header =
		'# Luke UI — full documentation\n\n> Concatenated per-export documentation for AI consumption.\n';
	const contents = await Promise.all(
		slugs.map((slug) => readFile(join(docsDir, `${slug}.md`), 'utf8')),
	);
	return [header, ...contents].join('\n\n---\n\n');
}
