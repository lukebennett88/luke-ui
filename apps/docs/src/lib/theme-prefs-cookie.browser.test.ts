import { afterEach, expect, test, vi } from 'vite-plus/test';
import { readPrefsCookie, writePrefsCookieAndConfirm } from './theme-prefs-cookie.js';

afterEach(() => {
	clearAllCookies();
	vi.restoreAllMocks();
});

test('writePrefsCookieAndConfirm returns true when the cookie persists', () => {
	expect(writePrefsCookieAndConfirm('luke-ui-docs-theme', 'paper')).toBe(true);
	expect(readPrefsCookie('luke-ui-docs-theme')).toBe('paper');
});

test('writePrefsCookieAndConfirm returns false when the cookie write is ignored', () => {
	const setSpy = vi.spyOn(document, 'cookie', 'set').mockImplementation(() => {});
	const getSpy = vi.spyOn(document, 'cookie', 'get').mockReturnValue('');

	try {
		expect(writePrefsCookieAndConfirm('luke-ui-docs-theme', 'paper')).toBe(false);
	} finally {
		setSpy.mockRestore();
		getSpy.mockRestore();
	}
});

function clearAllCookies() {
	for (const part of document.cookie.split('; ')) {
		const name = part.split('=')[0];
		if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
	}
}
