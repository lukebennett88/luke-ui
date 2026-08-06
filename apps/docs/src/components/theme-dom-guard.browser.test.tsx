import '../styles/app.css';
import '@luke-ui/react/themes/tactile.css';
import { themeClassName, themeRootClassName } from '@luke-ui/react/theme';
import { tactileThemeClassName } from '@luke-ui/react/themes';
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
 * Every identity class starts with this prefix, emitted by `themeClassName`. It is the
 * theme-layer marker for a supported identity boundary, so a nested identity is caught without
 * depending on any single bundled theme name.
 */
const IDENTITY_CLASS_PREFIX = 'luke-ui-theme-';

function nestedIdentityElementsWithin(themeRoot: HTMLElement): Array<HTMLElement> {
	const nested: Array<HTMLElement> = [];
	for (const element of themeRoot.querySelectorAll<HTMLElement>('*')) {
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
			<section
				className={cx(themeRootClassName, themeClassName('product'))}
				data-color-mode="light"
			>
				Nested application root
			</section>
		</div>,
	);

	const host = container;
	if (!host) throw new Error('Expected the docs theme root');

	const nested = nestedIdentityElementsWithin(host);
	expect(nested).toHaveLength(1);
	expect(nested[0]?.className).toContain(themeClassName('product'));
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
