/**
 * Pre-hydration rewrite of the server-rendered editor skeleton. The server can
 * only know the default code (the URL hash never reaches it), so this runs
 * before first paint and reshapes the skeleton rows to the `shape` hash param
 * of shared playground links.
 *
 * Compiled by `vp pack` (tsdown, IIFE, minified) into
 * `src/generated/editor-skeleton-script.iife.js` during `docs#generate`, then
 * inlined via a `?raw` import in `editor-skeleton.tsx` and rendered as an
 * inline script immediately after the skeleton root, which
 * `document.currentScript.previousElementSibling` relies on. The first row is
 * cloned as a template so no row markup is duplicated here, and any unexpected
 * input bails out, keeping the default skeleton. Hydration then renders the
 * same rows from the decoded hash, so React adopts the rewritten DOM without a
 * mismatch — which is also why the bar's style attribute is written as the
 * exact string React serializes.
 */
rewriteSkeletonToShape();

function rewriteSkeletonToShape(): void {
	const shape = /(?:^|&)shape=([\d.,]+)/.exec(location.hash.slice(1))?.[1];
	const root = document.currentScript?.previousElementSibling;
	if (!shape || !root) return;

	const rows = root.querySelectorAll('[data-line]');
	const template = rows[0];
	if (!template?.querySelector('[data-line-bar]')) return;

	const fragment = document.createDocumentFragment();
	for (const [index, entry] of shape.split(',').entries()) {
		const [indentPart, lengthPart] = entry.split('.');
		const indent = Number(indentPart);
		const length = Number(lengthPart);
		if (!Number.isFinite(indent) || !Number.isFinite(length)) return;

		const row = template.cloneNode(true) as Element;
		const lineNumber = row.querySelector('[data-line-number]');
		const bar = row.querySelector('[data-line-bar]');
		if (!lineNumber || !bar) return;

		lineNumber.textContent = String(index + 1);
		if (length > 0) {
			bar.setAttribute('style', `--indent:${indent}ch;--length:${length}ch`);
		} else {
			bar.remove();
		}
		fragment.appendChild(row);
	}

	root.insertBefore(fragment, template);
	for (const row of rows) row.remove();
}
