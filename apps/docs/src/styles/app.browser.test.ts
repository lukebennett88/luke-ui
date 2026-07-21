import './app.css';
import '@luke-ui/react/themes/paper.css';
import '@luke-ui/react/themes/tactile.css';
import { afterEach, expect, test } from 'vite-plus/test';
import { css } from '../../styled-system/css';

let themeRoot: HTMLDivElement | undefined;

afterEach(() => {
	themeRoot?.remove();
	themeRoot = undefined;
});

test('keeps Luke UI base typography and reset rules with Tailwind and Fumadocs loaded', () => {
	themeRoot = document.createElement('div');
	themeRoot.className = 'luke-ui-reset luke-ui-theme luke-ui-theme-tactile';

	const heading = document.createElement('h1');
	heading.textContent = 'Heading';
	const button = document.createElement('button');
	button.textContent = 'Button';
	themeRoot.append(heading, button);
	document.body.append(themeRoot);

	const rootStyles = getComputedStyle(themeRoot);
	const headingStyles = getComputedStyle(heading);
	const buttonStyles = getComputedStyle(button);

	expect(rootStyles.fontFamily).toContain('Inter');
	expect(rootStyles.fontSize).toBe('16px');
	expect(headingStyles.marginBlockStart).toBe('0px');
	expect(buttonStyles.paddingInlineStart).toBe('0px');
	expect(buttonStyles.fontFamily).toBe(rootStyles.fontFamily);
});

test('gives the Fumadocs page title the DS font-700 line-height via a docs css() atomic', () => {
	themeRoot = document.createElement('div');
	themeRoot.className = 'luke-ui-reset luke-ui-theme luke-ui-theme-tactile';

	// Mirror Fumadocs' DocsTitle: font-size 1.75em (= the DS font-700 step) with
	// no line-height, plus the docs css() atomic that restores font-700's height.
	const heading = document.createElement('h1');
	heading.className = `text-[1.75em] font-semibold ${css({ lineHeight: 'var(--luke-font-700-line-height)' })}`;
	heading.textContent = 'Page title';
	themeRoot.append(heading);
	document.body.append(themeRoot);

	const headingStyles = getComputedStyle(heading);

	// The atomic only resolves to 36px if the Panda PostCSS pass ran through the
	// vitest CSS pipeline — this is the end-to-end proof the plugin is wired.
	expect(headingStyles.lineHeight).toBe('36px');
	expect(headingStyles.lineHeight).not.toBe('24px');
});
