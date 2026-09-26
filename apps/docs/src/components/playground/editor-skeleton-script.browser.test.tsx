import { encodeCodeHash, toSkeletonLines } from '@luke-ui/playground-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, test } from 'vite-plus/test';
import shapeScript from '../../generated/editor-skeleton-script.iife.js?raw';
import { EditorSkeleton } from './editor-skeleton';

let container: HTMLElement | undefined;

afterEach(() => {
	container?.remove();
	container = undefined;
	// The script writes `location.hash` directly; clear it so it doesn't leak
	// into other tests that read `location.hash`.
	history.replaceState(null, '', location.pathname + location.search);
});

const MULTI_LINE_CODE = 'function greet(name) {\n\treturn `Hi, ${name}`;\n}\n';

// Deliberately a different shape (one row, non-empty) than `MULTI_LINE_CODE`,
// mirroring the real page: the server only ever renders the skeleton for the
// default code, never for the shared hash. If the script silently bailed and
// left the server markup alone, asserting against `MULTI_LINE_CODE`'s shape
// below would fail, proving the rewrite actually ran.
const SERVER_SIDE_CODE = 'const placeholder = true;';

/**
 * Puts server-rendered skeleton markup (for `code`) in a detached container,
 * followed by the compiled pre-hydration script as a real `<script>` element
 * — the script relies on `document.currentScript.previousElementSibling`, and
 * script elements assigned via `innerHTML` never execute, so the script is
 * built with `createElement` and run via `textContent`, matching how
 * `EditorSkeletonShapeScript` inlines it after the skeleton root.
 */
function renderSkeletonThenRunScript(code: string, hash: string): HTMLElement {
	container = document.body.appendChild(document.createElement('div'));
	container.innerHTML = renderToStaticMarkup(<EditorSkeleton code={code} showPill={false} />);
	location.hash = hash;

	const script = document.createElement('script');
	script.textContent = shapeScript;
	container.appendChild(script);

	return container;
}

test('rewrites the skeleton to the decoded shape for a shared link with URL-encoded commas', () => {
	const hash = encodeCodeHash(MULTI_LINE_CODE);
	// `encodeCodeHash` percent-encodes the `shape` param's commas via
	// `URLSearchParams` — assert that assumption stays true, since the whole
	// point of this test is exercising that encoded form.
	expect(hash).toContain('%2C');

	const root = renderSkeletonThenRunScript(SERVER_SIDE_CODE, hash);

	const expectedLines = toSkeletonLines(MULTI_LINE_CODE);
	const rows = root.querySelectorAll('[data-line]');
	expect(rows).toHaveLength(expectedLines.length);

	for (const [index, line] of expectedLines.entries()) {
		const row = rows[index];
		expect(row?.querySelector('[data-line-number]')?.textContent).toBe(String(index + 1));

		const bar = row?.querySelector('[data-line-bar]');
		const expectedStyle =
			line.length > 0 ? `--indent:${line.indent}ch;--length:${line.length}ch` : null;
		expect(bar?.getAttribute('style') ?? null).toBe(expectedStyle);
	}
});
