import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { transformSync } from 'oxc-transform-react';
import { expect, test } from 'vite-plus/test';

// Vitest does not run the React Compiler; pack does. This is the compiled-output check.
const REACT_COMPILER_TARGET = '19';

/** Bodies of `memo_cache_sentinel` slots that run once on first render. */
const SENTINEL_GUARDED_SLOT_PATTERN =
	/if \(\$\[\d+\] === Symbol\.for\("react\.memo_cache_sentinel"\)\) \{(?<body>[\s\S]*?)\n\t\} else \{/g;

const sourcePath = fileURLToPath(new URL('./mobile-overlay.tsx', import.meta.url));

test('MobileOverlay does not cache its scroll offset for the component lifetime', async () => {
	const compiled = await compileMobileOverlay();
	const lifetimeCached = sentinelGuardedSlotBodies(compiled);

	// Do not cache `scrollY` or the inline `top` for the component lifetime.
	expect(lifetimeCached).not.toContainEqual(expect.stringContaining('scrollY'));
	expect(lifetimeCached).not.toContainEqual(expect.stringContaining('top:'));
});

async function compileMobileOverlay(): Promise<string> {
	const source = await readFile(sourcePath, 'utf8');
	const result = transformSync(sourcePath, source, {
		jsx: 'preserve',
		lang: 'tsx',
		reactCompiler: { target: REACT_COMPILER_TARGET },
	});

	if (result.fatal) {
		const messages = result.errors.map((error) => error.codeframe ?? error.message);
		throw new Error(`Failed to compile ${sourcePath}:\n\n${messages.join('\n\n')}`);
	}

	return result.code;
}

function sentinelGuardedSlotBodies(compiled: string): Array<string> {
	return [...compiled.matchAll(SENTINEL_GUARDED_SLOT_PATTERN)].flatMap((match) => {
		const body = match.groups?.body;
		if (body == null) return [];
		return [body];
	});
}
