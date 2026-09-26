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
} from './theme-prefs-constants.js';
import { readPrefsCookie, writePrefsCookieAndConfirm } from './theme-prefs-cookie.js';

bootstrapThemePrefs();

function bootstrapThemePrefs(): void {
	try {
		let needsReload = false;

		if (!readPrefsCookie(THEME_IDENTITY_COOKIE_NAME)) {
			const storedIdentity = localStorage.getItem(THEME_IDENTITY_COOKIE_NAME);
			if (storedIdentity === 'paper' || storedIdentity === 'tactile') {
				const persisted = writePrefsCookieAndConfirm(THEME_IDENTITY_COOKIE_NAME, storedIdentity);
				if (persisted && storedIdentity !== DEFAULT_THEME_IDENTITY) needsReload = true;
			}
		}

		if (!readPrefsCookie(COLOR_MODE_COOKIE_NAME)) {
			const storedMode = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
			if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
				const persisted = writePrefsCookieAndConfirm(COLOR_MODE_COOKIE_NAME, storedMode);
				if (persisted && storedMode !== DEFAULT_COLOR_MODE) needsReload = true;
			}
		}

		if (needsReload) {
			location.reload();
			return;
		}

		document.documentElement.classList.add(
			readPrefsCookie(THEME_IDENTITY_COOKIE_NAME) === 'paper'
				? THEME_IDENTITY_BOOTSTRAP_CLASS_NAMES.paper
				: THEME_IDENTITY_BOOTSTRAP_CLASS_NAMES.tactile,
		);
	} catch {
		// Ignore storage / cookie failures; SSR defaults still apply.
	}
}
