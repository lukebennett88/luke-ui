import { themeClassName as paperThemeClassName } from '@luke-ui/react/themes/paper';
import { themeClassName as tactileThemeClassName } from '@luke-ui/react/themes/tactile';

export type ThemeIdentity = 'paper' | 'tactile';
export type ColorModePreference = 'light' | 'dark' | 'system';

export interface ThemePrefs {
	colorMode: ColorModePreference;
	themeIdentity: ThemeIdentity;
}

/** Cookie + legacy localStorage key for Paper/Tactile identity. */
export const THEME_IDENTITY_COOKIE_NAME = 'luke-ui-docs-theme';

/** Cookie for the docs colour-mode preference. */
export const COLOR_MODE_COOKIE_NAME = 'luke-ui-docs-color-mode';

/** next-themes default `storageKey`; dual-written so its bootstrap script stays in sync. */
export const COLOR_MODE_STORAGE_KEY = 'theme';

export const DEFAULT_THEME_IDENTITY = 'tactile' satisfies ThemeIdentity;
export const DEFAULT_COLOR_MODE = 'system' satisfies ColorModePreference;

export const DEFAULT_THEME_PREFS = {
	colorMode: DEFAULT_COLOR_MODE,
	themeIdentity: DEFAULT_THEME_IDENTITY,
} as const satisfies ThemePrefs;

const THEME_IDENTITY_CLASS_NAMES = {
	paper: paperThemeClassName,
	tactile: tactileThemeClassName,
} as const satisfies Record<ThemeIdentity, string>;

const THEME_IDENTITY_CHANGE_EVENT = 'luke-ui-docs-theme-change';
const COLOR_MODE_CHANGE_EVENT = 'luke-ui-docs-color-mode-change';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function parseThemeIdentity(value: string | null | undefined): ThemeIdentity {
	return value === 'paper' ? 'paper' : DEFAULT_THEME_IDENTITY;
}

export function parseColorMode(value: string | null | undefined): ColorModePreference {
	return value === 'light' || value === 'dark' || value === 'system' ? value : DEFAULT_COLOR_MODE;
}

export function themeIdentityClassName(themeIdentity: ThemeIdentity): string {
	return THEME_IDENTITY_CLASS_NAMES[themeIdentity];
}

function readDocumentCookie(name: string): string | undefined {
	const prefix = `${name}=`;
	for (const part of document.cookie.split('; ')) {
		if (part.startsWith(prefix)) return decodeURIComponent(part.slice(prefix.length));
	}
	return undefined;
}

export function readThemeIdentityPreference(): ThemeIdentity {
	return parseThemeIdentity(readDocumentCookie(THEME_IDENTITY_COOKIE_NAME));
}

export function readColorModePreference(): ColorModePreference {
	return parseColorMode(readDocumentCookie(COLOR_MODE_COOKIE_NAME));
}

export function writeThemeIdentityPreference(themeIdentity: ThemeIdentity) {
	writeDocumentCookie(THEME_IDENTITY_COOKIE_NAME, themeIdentity);
	window.dispatchEvent(new Event(THEME_IDENTITY_CHANGE_EVENT));
}

export function writeColorModePreference(colorMode: ColorModePreference) {
	writeDocumentCookie(COLOR_MODE_COOKIE_NAME, colorMode);
	// Keep next-themes' blocking script aligned with the cookie the server reads.
	localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
	window.dispatchEvent(new Event(COLOR_MODE_CHANGE_EVENT));
}

export function subscribeToThemeIdentityPreference(onStoreChange: () => void) {
	window.addEventListener(THEME_IDENTITY_CHANGE_EVENT, onStoreChange);
	return () => {
		window.removeEventListener(THEME_IDENTITY_CHANGE_EVENT, onStoreChange);
	};
}

export function subscribeToColorModePreference(onStoreChange: () => void) {
	window.addEventListener(COLOR_MODE_CHANGE_EVENT, onStoreChange);
	return () => {
		window.removeEventListener(COLOR_MODE_CHANGE_EVENT, onStoreChange);
	};
}

/**
 * Blocking head script: migrate legacy localStorage prefs into cookies (reload when needed), then
 * apply the identity class from the cookie before paint.
 */
export const themePrefsBootstrapScript = `(function(){try{var idName=${JSON.stringify(THEME_IDENTITY_COOKIE_NAME)};var modeName=${JSON.stringify(COLOR_MODE_COOKIE_NAME)};var modeStorage=${JSON.stringify(COLOR_MODE_STORAGE_KEY)};var paper=${JSON.stringify(THEME_IDENTITY_CLASS_NAMES.paper)};var tactile=${JSON.stringify(THEME_IDENTITY_CLASS_NAMES.tactile)};var defaultIdentity=${JSON.stringify(DEFAULT_THEME_IDENTITY)};var defaultMode=${JSON.stringify(DEFAULT_COLOR_MODE)};function read(n){var p=n+'=';var parts=document.cookie.split('; ');for(var i=0;i<parts.length;i++){if(parts[i].indexOf(p)===0)return decodeURIComponent(parts[i].slice(p.length))}return null}function write(n,v){document.cookie=n+'='+encodeURIComponent(v)+'; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax'}var needsReload=false;if(!read(idName)){var storedId=localStorage.getItem(idName);if(storedId==='paper'||storedId==='tactile'){write(idName,storedId);if(storedId!==defaultIdentity)needsReload=true}}if(!read(modeName)){var storedMode=localStorage.getItem(modeStorage);if(storedMode==='light'||storedMode==='dark'||storedMode==='system'){write(modeName,storedMode);if(storedMode!==defaultMode)needsReload=true}}if(needsReload){location.reload();return}document.documentElement.classList.add(read(idName)==='paper'?paper:tactile)}catch(e){}})();`;

function writeDocumentCookie(name: string, value: string) {
	document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}
