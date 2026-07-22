import '@luke-ui/react/stylesheet.css';
import '@luke-ui/react/themes/tactile.css';
import { Icon, IconSpritesheetProvider } from '@luke-ui/react/icon';
import { themeRootClassName } from '@luke-ui/react/theme';
import { tactileThemeClassName } from '@luke-ui/react/themes';
import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, test } from 'vite-plus/test';

const mounted: Array<{ container: HTMLElement; root: Root }> = [];
const iconCases = [
	{ expectedSize: '24px', id: 'default-icon' },
	{ expectedSize: '16px', id: 'xsmall-icon', size: 'xsmall' },
	{ expectedSize: '20px', id: 'small-icon', size: 'small' },
	{ expectedSize: '24px', id: 'medium-icon', size: 'medium' },
	{ expectedSize: '32px', id: 'large-icon', size: 'large' },
] as const;

afterEach(() => {
	for (const { container, root } of mounted) {
		act(() => root.unmount());
		container.remove();
	}
	mounted.length = 0;
});

test('applies the public reset, theme, and icon-size contracts', () => {
	const { container } = mountFixture();
	const resetTarget = container.querySelector('#reset-target');
	if (!(resetTarget instanceof HTMLElement)) throw new Error('Expected reset target.');

	const themeStyles = getComputedStyle(container);
	expect(getComputedStyle(resetTarget).boxSizing).toBe('border-box');
	expect(themeStyles.color).toBe(themeStyles.getPropertyValue('--luke-color-text-primary'));
	expect(themeStyles.fontSize).toBe(themeStyles.getPropertyValue('--luke-font-300-font-size'));
	expect(themeStyles.lineHeight).toBe(themeStyles.getPropertyValue('--luke-font-300-line-height'));

	for (const iconCase of iconCases) {
		const icon = container.querySelector(`#${iconCase.id}`);
		if (!(icon instanceof SVGElement)) throw new Error('Expected icon.');

		const styles = getComputedStyle(icon);
		expect(styles.blockSize).toBe(iconCase.expectedSize);
		expect(styles.inlineSize).toBe(iconCase.expectedSize);
	}
});

function mountFixture() {
	const container = document.body.appendChild(document.createElement('div'));
	container.className = `${themeRootClassName} ${tactileThemeClassName}`;
	const root = createRoot(container);
	mounted.push({ container, root });

	act(() => {
		root.render(
			<IconSpritesheetProvider href="/spritesheet.svg">
				<div id="reset-target">
					<Icon id="default-icon" name="add" title="Default icon" />
					<Icon id="xsmall-icon" name="add" size="xsmall" title="Extra small icon" />
					<Icon id="small-icon" name="add" size="small" title="Small icon" />
					<Icon id="medium-icon" name="add" size="medium" title="Medium icon" />
					<Icon id="large-icon" name="add" size="large" title="Large icon" />
				</div>
			</IconSpritesheetProvider>,
		);
	});

	return { container };
}
