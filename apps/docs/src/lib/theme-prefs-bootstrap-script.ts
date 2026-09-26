/**
 * Pre-hydration theme prefs bootstrap. Migrates legacy localStorage values into
 * cookies (reload when the migrated value differs from the SSR default), then
 * applies the identity class from the cookie before paint.
 *
 * Compiled by `vp pack` (tsdown, IIFE, minified) into
 * `src/generated/theme-prefs-bootstrap-script.iife.js` during `docs#generate`,
 * then inlined via a `?raw` import in `__root.tsx`. Keep this module free of
 * `@luke-ui/*` imports so the IIFE stays self-contained.
 */
import {
	COLOR_MODE_COOKIE_NAME,
	COLOR_MODE_STORAGE_KEY,
	DEFAULT_COLOR_MODE,
	DEFAULT_THEME_IDENTITY,
	THEME_IDENTITY_BOOTSTRAP_CLASS_NAMES,
	THEME_IDENTITY_COOKIE_NAME,
	THEME_PREFS_COOKIE_MAX_AGE_SECONDS,
} from './theme-prefs-constants.js';

bootstrapThemePrefs();

function bootstrapThemePrefs(): void {
	try {
		let needsReload = false;

		if (!readCookie(THEME_IDENTITY_COOKIE_NAME)) {
			const storedIdentity = localStorage.getItem(THEME_IDENTITY_COOKIE_NAME);
			if (storedIdentity === 'paper' || storedIdentity === 'tactile') {
				writeCookie(THEME_IDENTITY_COOKIE_NAME, storedIdentity);
				if (storedIdentity !== DEFAULT_THEME_IDENTITY) needsReload = true;
			}
		}

		if (!readCookie(COLOR_MODE_COOKIE_NAME)) {
			const storedMode = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
			if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
				writeCookie(COLOR_MODE_COOKIE_NAME, storedMode);
				if (storedMode !== DEFAULT_COLOR_MODE) needsReload = true;
			}
		}

		if (needsReload) {
			location.reload();
			return;
		}

		document.documentElement.classList.add(
			readCookie(THEME_IDENTITY_COOKIE_NAME) === 'paper'
				? THEME_IDENTITY_BOOTSTRAP_CLASS_NAMES.paper
				: THEME_IDENTITY_BOOTSTRAP_CLASS_NAMES.tactile,
		);
	} catch {
		// Ignore storage / cookie failures; SSR defaults still apply.
	}
}

function readCookie(name: string): string | null {
	const prefix = `${name}=`;
	for (const part of document.cookie.split('; ')) {
		if (part.startsWith(prefix)) return decodeURIComponent(part.slice(prefix.length));
	}
	return null;
}

function writeCookie(name: string, value: string): void {
	document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${THEME_PREFS_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
