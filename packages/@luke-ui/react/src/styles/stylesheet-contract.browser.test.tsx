import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/tactile/stylesheet.css';
import { Icon, IconSpritesheetProvider } from '@luke-ui/react/icon';
import { rootClassName } from '@luke-ui/react/theme';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';

const mounted: Array<{ container: HTMLElement; root: Root }> = [];

afterEach(() => {
	for (const { container, root } of mounted) {
		act(() => root.unmount());
		container.remove();
	}
	mounted.length = 0;
});

test('applies the public reset and theme contracts', () => {
	const { container } = mountFixture();
	const resetTarget = container.querySelector('#reset-target');
	if (!(resetTarget instanceof HTMLElement)) throw new Error('Expected reset target.');

	const themeStyles = getComputedStyle(container);
	expect(getComputedStyle(resetTarget).boxSizing).toBe('border-box');
	expect(themeStyles.color).toBe(themeStyles.getPropertyValue('--luke-color-text-primary'));
	expect(themeStyles.fontSize).toBe(themeStyles.getPropertyValue('--luke-font-300-font-size'));
	expect(themeStyles.lineHeight).toBe(themeStyles.getPropertyValue('--luke-font-300-line-height'));
});

function mountFixture() {
	const container = document.body.appendChild(document.createElement('div'));
	container.className = `${rootClassName} ${tactileThemeClassName}`;
	const root = createRoot(container);
	mounted.push({ container, root });

	act(() => {
		root.render(
			<IconSpritesheetProvider href="/spritesheet.svg">
				<div id="reset-target">
					<Icon id="default-icon" name="add" title="Default icon" />
				</div>
			</IconSpritesheetProvider>,
		);
	});

	return { container };
}
