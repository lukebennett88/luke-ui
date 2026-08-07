import '../styles/app.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { rootClassName } from '@luke-ui/react/theme';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import { cx } from '@luke-ui/react/utils';
import { act } from 'react';
import type { ReactNode } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';
import ColorModeOverride from '../examples/theming/color-mode-override';
import SemanticVariables from '../examples/theming/semantic-variables';

let container: HTMLElement | undefined;
let root: Root | undefined;

afterEach(() => {
	if (root) act(() => root?.unmount());
	container?.remove();
	document.documentElement.removeAttribute('class');
	container = undefined;
	root = undefined;
});

function renderInDocsThemeRoot(children: ReactNode) {
	container = document.body.appendChild(document.createElement('div'));
	container.className = `luke-ui-theme ${tactileThemeClassName}`;
	root = createRoot(container);
	act(() => {
		root?.render(children);
	});
}

/**
 * Every identity class starts with this prefix, emitted by the theme layer's internal
 * `themeClassName` helper. It is the marker for a supported identity boundary, so a nested
 * identity is caught without depending on any single bundled theme name or on that helper, which
 * is not part of the public API.
 */
const IDENTITY_CLASS_PREFIX = 'luke-ui-theme-';

// A literal identity class rather than an import: the same shape `themeClassName('product')`
// used to produce, kept as a string now that helper is internal to the theme package.
const NESTED_IDENTITY_CLASS_NAME = 'luke-ui-theme-product';

function nestedIdentityElementsWithin(themeRoot: Element): Array<Element> {
	const nested: Array<Element> = [];
	for (const element of themeRoot.querySelectorAll('*')) {
		if (Array.from(element.classList).some((token) => token.startsWith(IDENTITY_CLASS_PREFIX))) {
			nested.push(element);
		}
	}
	return nested;
}

test('detects a supported identity class nested beneath the docs identity root', () => {
	renderInDocsThemeRoot(
		<div data-color-mode="dark">
			Docs themed example
			<section className={cx(rootClassName, NESTED_IDENTITY_CLASS_NAME)} data-color-mode="light">
				Nested application root
			</section>
		</div>,
	);

	const host = container;
	if (!host) throw new Error('Expected the docs theme root');

	const nested = nestedIdentityElementsWithin(host);
	expect(nested).toHaveLength(1);
	expect(nested[0]?.className).toContain(NESTED_IDENTITY_CLASS_NAME);
});

test('detects a nested identity when the docs identity sits on <html>', () => {
	// Mirrors `DocsThemeRoot`'s topology: the docs identity now lives on `<html>`, not on a `div`
	// the docs own. An application root rendered anywhere in the document with its own identity
	// class is nested beneath it, and is now structurally easier to hit.
	document.documentElement.classList.add(tactileThemeClassName);

	container = document.body.appendChild(document.createElement('div'));
	root = createRoot(container);
	act(() => {
		root?.render(
			<section className={cx(rootClassName, NESTED_IDENTITY_CLASS_NAME)} data-color-mode="light">
				Nested application root
			</section>,
		);
	});

	const nested = nestedIdentityElementsWithin(document.documentElement);
	expect(nested).toHaveLength(1);
	expect(nested[0]?.className).toContain(NESTED_IDENTITY_CLASS_NAME);
});

test('rendering the theming examples under the docs identity root adds no nested identity', () => {
	renderInDocsThemeRoot(
		<>
			<ColorModeOverride />
			<SemanticVariables />
		</>,
	);

	const host = container;
	if (!host) throw new Error('Expected the docs theme root');

	expect(nestedIdentityElementsWithin(host)).toEqual([]);
});
