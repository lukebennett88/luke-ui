import { THEME_PREFS_COOKIE_MAX_AGE_SECONDS } from './theme-prefs-constants.js';

/** Read a preference cookie from `document.cookie`. */
export function readPrefsCookie(name: string): string | null {
	const prefix = `${name}=`;
	for (const part of document.cookie.split('; ')) {
		if (part.startsWith(prefix)) return decodeURIComponent(part.slice(prefix.length));
	}
	return null;
}

/** Write a preference cookie. Does not throw when the write is ignored. */
export function writePrefsCookie(name: string, value: string): void {
	document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${THEME_PREFS_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

/**
 * Write a preference cookie and confirm it stuck. `document.cookie` assignments can fail
 * without throwing, so callers must not assume success from `writePrefsCookie` alone.
 */
export function writePrefsCookieAndConfirm(name: string, value: string): boolean {
	writePrefsCookie(name, value);
	return readPrefsCookie(name) === value;
}
