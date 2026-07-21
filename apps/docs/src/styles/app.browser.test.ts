import './app.css';
import '@luke-ui/react/themes/paper.css';
import '@luke-ui/react/themes/tactile.css';
import { afterEach, expect, test } from 'vite-plus/test';

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
