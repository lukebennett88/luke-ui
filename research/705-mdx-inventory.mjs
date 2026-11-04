import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join(process.cwd(), 'apps/docs/content/docs');
const ticks = String.fromCharCode(96).repeat(3);
function collect(dir) {
	const files = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) files.push(...collect(path));
		else if (entry.isFile() && (path.endsWith('.mdx') || path.endsWith('.md'))) files.push(path);
	}
	return files;
}
const counts = Object.create(null);
let total = 0;
const samples = [];
for (const path of collect(root)) {
	const lines = readFileSync(path, 'utf8').split(String.fromCharCode(10));
	let inFence = false;
	let fenceStart = 0;
	let lang = '';
	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i].trimStart();
		if (!inFence && (line.startsWith(ticks) || line.startsWith('~~~'))) {
			inFence = true;
			fenceStart = i;
			lang = line.slice(3).trim().split(' ')[0].toLowerCase() || '(none)';
		} else if (inFence && (line.startsWith(ticks) || line.startsWith('~~~'))) {
			inFence = false;
			total += 1;
			counts[lang] = (counts[lang] ?? 0) + 1;
			if (samples.length < 20) {
				samples.push({ file: relative(process.cwd(), path), lang, lines: i - fenceStart - 1 });
			}
		}
	}
}
console.log(JSON.stringify({ type: 'mdx-fence-inventory', total, counts, samples }));
