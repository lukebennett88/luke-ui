/** Layout of one skeleton code line: leading indent and content length, in `ch`. */
export type SkeletonLine = { indent: number; length: number };

// Rows rendered by the editor skeleton are capped; the pane hides overflow anyway.
const MAX_SKELETON_LINES = 60;

// Matches the editor's tabSize option.
const TAB_SIZE = 2;

export function toSkeletonLines(code: string): Array<SkeletonLine> {
	const lines: Array<SkeletonLine> = [];
	for (const line of code.split('\n').slice(0, MAX_SKELETON_LINES)) {
		const expanded = line.replaceAll('\t', ' '.repeat(TAB_SIZE)).trimEnd();
		const content = expanded.trimStart();
		lines.push({ indent: expanded.length - content.length, length: content.length });
	}
	return lines;
}

/**
 * Compact `indent.length` pairs (e.g. `0.44,0.0,2.30`) carried in the URL hash
 * so the pre-hydration script in `editor-skeleton.tsx` can mirror shared code
 * before the decompressor is available.
 */
export function encodeShape(code: string): string {
	return toSkeletonLines(code)
		.map((line) => `${line.indent}.${line.length}`)
		.join(',');
}
