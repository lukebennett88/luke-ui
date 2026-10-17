import { useSyncExternalStore } from 'react';
import type { ThemeToken } from '../generated/token-reference.generated.js';
import { subscribeToThemePrefs } from './theme-prefs.js';

/**
 * A token's resolved value in the active theme, written for reading: colours as hex (or `rgba()`
 * with alpha), space and radius lengths as their used value, typography sizes as their used value,
 * durations in milliseconds, easings as `cubic-bezier()`,
 * font families as the first family name, and shadows as a short summary. Returns `null` before
 * hydration, because a static render has no theme to read.
 *
 * Every hook shares one hidden probe element and one set of listeners. Values recompute when the
 * docs theme prefs change, when `<html>` changes its class or `data-color-mode`, and when the
 * system colour scheme changes.
 */
export function useTokenValue(token: ThemeToken): string | null {
	return useSyncExternalStore(
		subscribeToThemeChanges,
		() => readTokenValue(token),
		getServerTokenValue,
	);
}

/** Reads one token's value now. Cached until the theme changes. */
function readTokenValue(token: ThemeToken): string {
	const cached = cache.get(token.path);
	if (cached !== undefined) return cached;
	const value = resolveTokenValue(token);
	cache.set(token.path, value);
	return value;
}

function getServerTokenValue(): null {
	return null;
}

const listeners = new Set<() => void>();
const cache = new Map<string, string>();
let teardown: (() => void) | null = null;

function subscribeToThemeChanges(listener: () => void) {
	listeners.add(listener);
	teardown ??= watchTheme();
	return () => {
		listeners.delete(listener);
		if (listeners.size > 0) return;
		teardown?.();
		teardown = null;
	};
}

function watchTheme() {
	// Values cached while nothing listened may predate a theme change.
	cache.clear();
	const unsubscribePrefs = subscribeToThemePrefs(notifyThemeChange);
	const observer = new MutationObserver(notifyThemeChange);
	observer.observe(document.documentElement, {
		attributeFilter: ['class', 'data-color-mode'],
		attributes: true,
	});
	const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
	colorScheme.addEventListener('change', notifyThemeChange);

	return () => {
		unsubscribePrefs();
		observer.disconnect();
		colorScheme.removeEventListener('change', notifyThemeChange);
		probe?.remove();
		probe = null;
		cache.clear();
	};
}

function notifyThemeChange() {
	cache.clear();
	for (const listener of listeners) listener();
}

type ValueKind =
	| 'color'
	| 'duration'
	| 'easing'
	| 'finish'
	| 'fontFamily'
	| 'usedLength'
	| 'number'
	| 'shadow'
	| 'raw';

/** CSS property used to read a token's used length in the probe. */
function usedLengthPropertyOf(token: ThemeToken): 'fontSize' | 'inlineSize' | 'lineHeight' {
	const leaf = token.path.split('.').at(-1) ?? '';
	if (leaf === 'lineHeight') return 'lineHeight';
	if (token.family === 'font') return 'fontSize';
	return 'inlineSize';
}

/** Which reading a token gets, from its family and last path segment. */
function valueKindOf(token: ThemeToken): ValueKind {
	const leaf = token.path.split('.').at(-1) ?? '';
	switch (token.family) {
		case 'color':
			return 'color';
		case 'depth':
			return 'shadow';
		case 'controlFinish':
			return 'finish';
		case 'radius':
		case 'space':
		case 'controlSize':
			return 'usedLength';
		case 'interaction':
			return 'number';
		case 'motion':
			return token.path.startsWith('motion.duration.') ? 'duration' : 'easing';
		case 'font':
			if (leaf === 'fontFamily' || token.path.startsWith('font.family.')) return 'fontFamily';
			if (leaf === 'fontSize' || leaf === 'lineHeight') return 'usedLength';
			if (leaf === 'fontWeight' || token.path.startsWith('font.weight.')) return 'number';
			return 'raw';
	}
}

let probe: HTMLElement | null = null;

/** One hidden element on `<body>`, so `var()` chains resolve in the page's own theme scope. */
function getProbe(): HTMLElement {
	if (probe?.isConnected) return probe;
	probe = document.createElement('span');
	probe.setAttribute('aria-hidden', 'true');
	probe.dataset.tokenValueProbe = '';
	Object.assign(probe.style, {
		display: 'block',
		insetBlockStart: '0',
		insetInlineStart: '0',
		pointerEvents: 'none',
		position: 'fixed',
		visibility: 'hidden',
	});
	document.body.append(probe);
	return probe;
}

function resolveTokenValue(token: ThemeToken): string {
	const element = getProbe();
	const raw = getComputedStyle(element).getPropertyValue(token.variable).trim();
	if (raw === '') return '';

	switch (valueKindOf(token)) {
		case 'color':
			return readColor(element, token.variable) ?? raw;
		case 'usedLength':
			return readUsedLength(element, token.variable, usedLengthPropertyOf(token));
		case 'duration':
			return describeDuration(raw);
		case 'easing':
			return describeEasing(raw);
		case 'fontFamily':
			return firstFontFamily(raw);
		case 'shadow':
			return describeShadow(raw);
		case 'finish':
			return describeFinish(raw);
		case 'number':
		case 'raw':
			return raw;
	}
}

let colorContext: CanvasRenderingContext2D | null | undefined;

/**
 * Converts a colour in any CSS syntax (such as `oklch()`) to sRGB hex, or `rgba()` with alpha. The
 * probe resolves the `var()` chain, and a one-pixel canvas converts the colour space.
 */
function readColor(element: HTMLElement, variable: string): string | null {
	element.style.color = `var(${variable})`;
	const computed = getComputedStyle(element).color;
	element.style.color = '';

	colorContext ??= document
		.createElement('canvas')
		.getContext('2d', { colorSpace: 'srgb', willReadFrequently: true });
	if (!colorContext) return null;

	colorContext.clearRect(0, 0, 1, 1);
	colorContext.fillStyle = computed;
	colorContext.fillRect(0, 0, 1, 1);
	const [red = 0, green = 0, blue = 0, alpha = 255] = colorContext.getImageData(0, 0, 1, 1).data;

	if (alpha === 255) return `#${[red, green, blue].map(toHexByte).join('')}`;
	return `rgba(${red}, ${green}, ${blue}, ${roundTo(alpha / 255, 2)})`;
}

function toHexByte(value: number) {
	return value.toString(16).padStart(2, '0');
}

/** The used length after the theme resolves the token (for example `4px` or `0.75rem`). */
function readUsedLength(
	element: HTMLElement,
	variable: string,
	property: 'fontSize' | 'inlineSize' | 'lineHeight',
): string {
	element.style[property] = `var(${variable})`;
	const computed = getComputedStyle(element)[property];
	element.style[property] = '';
	return computed;
}

function describeDuration(raw: string): string {
	const match = DURATION_PATTERN.exec(raw);
	if (!match) return raw;
	const [, amount = '', unit] = match;
	const milliseconds = Number.parseFloat(amount) * (unit === 's' ? 1000 : 1);
	return `${roundTo(milliseconds, 2)}ms`;
}

/** The keyword easings as their `cubic-bezier()` equivalents, from the CSS Easing spec. */
const EASING_KEYWORDS: Record<string, string> = {
	ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
	'ease-in': 'cubic-bezier(0.42, 0, 1, 1)',
	'ease-in-out': 'cubic-bezier(0.42, 0, 0.58, 1)',
	'ease-out': 'cubic-bezier(0, 0, 0.58, 1)',
	linear: 'cubic-bezier(0, 0, 1, 1)',
};

function describeEasing(raw: string): string {
	return EASING_KEYWORDS[raw] ?? raw;
}

function firstFontFamily(raw: string): string {
	const [first = raw] = splitTopLevel(raw);
	return first.replaceAll(QUOTE_PATTERN, '').trim();
}

/** `2 layers, 1 inset`, or `none`. */
function describeShadow(raw: string): string {
	if (raw === 'none') return raw;
	const layers = splitTopLevel(raw);
	const insetCount = layers.filter((layer) => INSET_PATTERN.test(layer)).length;
	const layerText = layers.length === 1 ? '1 layer' : `${layers.length} layers`;
	return insetCount === 0 ? layerText : `${layerText}, ${insetCount} inset`;
}

/** `Linear gradient, 3 stops`, or the raw value for anything else. */
function describeFinish(raw: string): string {
	const match = GRADIENT_PATTERN.exec(raw);
	if (!match) return raw;
	const [, kind = 'linear', inner = ''] = match;
	const parts = splitTopLevel(inner);
	const stops = parts.filter((part) => !GRADIENT_DIRECTION_PATTERN.test(part)).length;
	const kindText = `${kind.charAt(0).toUpperCase()}${kind.slice(1)} gradient`;
	return `${kindText}, ${stops} stops`;
}

/** Splits on commas outside parentheses. */
function splitTopLevel(value: string): Array<string> {
	const parts: Array<string> = [];
	let depth = 0;
	let start = 0;
	for (let index = 0; index < value.length; index += 1) {
		const character = value[index];
		if (character === '(') depth += 1;
		else if (character === ')') depth -= 1;
		else if (character === ',' && depth === 0) {
			parts.push(value.slice(start, index).trim());
			start = index + 1;
		}
	}
	parts.push(value.slice(start).trim());
	return parts.filter((part) => part !== '');
}

function roundTo(value: number, places: number) {
	const factor = 10 ** places;
	return Math.round(value * factor) / factor;
}

const DURATION_PATTERN = /^(-?[\d.]+)(ms|s)$/;
const QUOTE_PATTERN = /["']/g;
const INSET_PATTERN = /\binset\b/;
const GRADIENT_PATTERN = /^(linear|radial|conic)-gradient\((.*)\)$/s;
const GRADIENT_DIRECTION_PATTERN =
	/^(to\s|-?[\d.]+(deg|turn|rad|grad)\b|from\s|circle|ellipse|at\s)/;
