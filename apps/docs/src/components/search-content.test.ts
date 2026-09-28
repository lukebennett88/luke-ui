import { expect, test } from 'vite-plus/test';
import { plainText } from './search-content.js';

test('plainText strips search mark tags and markdown emphasis', () => {
	expect(plainText('Use the <mark>Button</mark> component')).toBe('Use the Button component');
	expect(plainText('**bold** and __bold__ and `code`')).toBe('bold and bold and code');
});

test('plainText preserves JSX and generic syntax from documentation', () => {
	expect(plainText('Render a <Button> with props')).toBe('Render a <Button> with props');
	expect(plainText('Accepts Array<T> and ReadonlyArray<T>')).toBe(
		'Accepts Array<T> and ReadonlyArray<T>',
	);
	expect(plainText('Prefer <T> over any')).toBe('Prefer <T> over any');
	expect(plainText('Highlighted <mark><Button></mark> stays')).toBe('Highlighted <Button> stays');
	expect(plainText('Generic <mark>Array<T></mark> stays')).toBe('Generic Array<T> stays');
});

test('plainText leaves unsafe markup as text rather than stripping angle brackets', () => {
	// React text nodes escape this; stripping every <...> would also destroy legitimate JSX.
	expect(plainText('Safe <script>alert(1)</script> copy')).toBe(
		'Safe <script>alert(1)</script> copy',
	);
});
