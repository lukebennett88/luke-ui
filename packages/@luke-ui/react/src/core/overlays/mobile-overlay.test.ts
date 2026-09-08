import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { transformSync } from 'oxc-transform-react';
import { expect, test } from 'vite-plus/test';

// `vite.config.ts` compiles every source module with these options when it packs the package.
// Vitest does not run the compiler, so this is the only place a compiled-output regression can
// be caught.
const REACT_COMPILER_TARGET = '19';

/**
 * A cache slot whose guard is the memo sentinel is evaluated exactly once, on the component's
 * first render, and reused for the rest of its lifetime.
 */
const SENTINEL_GUARDED_SLOT_PATTERN =
	/if \(\$\[\d+\] === Symbol\.for\("react\.memo_cache_sentinel"\)\) \{(?<body>[\s\S]*?)\n\t\} else \{/g;

const sourcePath = fileURLToPath(new URL('./mobile-overlay.tsx', import.meta.url));

test('MobileOverlay does not cache its scroll offset for the component lifetime', async () => {
	const compiled = await compileMobileOverlay();
	const lifetimeCached = sentinelGuardedSlotBodies(compiled);

	// The tray's scroll offset has to be re-read every time the tray opens. A read hoisted into a
	// sentinel-guarded slot runs once while the tray is still closed, so a consumer who scrolls
	// before opening gets the tray positioned at the offset the page had on first render.
	expect(lifetimeCached).not.toContainEqual(expect.stringContaining('scrollY'));
	// The same applies to the overlay's inline `top`, which is what carries the offset onto the DOM.
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
