/**
 * The React consumer: an app the server renders and the browser hydrates, typed usage of every
 * public entrypoint, and one entry per bundle boundary. It needs only `@luke-ui/react`.
 */

import type { ConsumerFixture, Manifest, PackedPackage } from './environment.js';

export interface BundleBoundary {
	/**
	 * Public entrypoints whose components the import renders, apart from its own. Add one only when
	 * the component starts rendering it.
	 */
	composes: Array<string>;
	/** The public entrypoint under test. */
	entry: string;
	exportName: string;
}

/** Small runtime imports, each checked for what it bundles. */
export const bundleBoundaries: Array<BundleBoundary> = [
	{ composes: ['text'], entry: 'blockquote', exportName: 'Blockquote' },
	{
		composes: ['loading-spinner', 'primitives/button', 'text', 'visually-hidden'],
		entry: 'button',
		exportName: 'Button',
	},
	{ composes: [], entry: 'box', exportName: 'Box' },
	{ composes: [], entry: 'theme', exportName: 'vars' },
];

/** The consumer entry, below `entries/`, that imports one bundle boundary. */
export function boundaryEntry({ entry, exportName }: BundleBoundary): string {
	return `${entry.replaceAll('/', '-')}-${exportName}`;
}

/** The consumer entry, below `entries/`, that imports only `defineTheme`. */
export const DEFINE_THEME_ENTRY = 'define-theme';

export function reactFixture({ installSpecs, manifest }: PackedPackage): ConsumerFixture {
	const files: Record<string, string> = {
		'all-entries.ts': allEntriesSource(manifest),
		'app.tsx': TYPED_APP,
		'build-app.mjs': BUILD_APP,
		[`entries/${DEFINE_THEME_ENTRY}.js`]: `export { defineTheme } from '@luke-ui/react/theme/compiler';\n`,
		'index.html': CLIENT_HTML,
		'measure-bundle.mjs': MEASURE_BUNDLE,
		'render.mjs': RENDER,
		'src/app.js': APP,
		'src/entry-client.js': ENTRY_CLIENT,
		'src/entry-server.js': ENTRY_SERVER,
	};
	for (const boundary of bundleBoundaries) {
		files[`entries/${boundaryEntry(boundary)}.js`] =
			`export { ${boundary.exportName} } from '@luke-ui/react/${boundary.entry}';\n`;
	}
	return {
		dependencies: installSpecs,
		devDependencies: {},
		files,
		prepare: [],
		typeChecked: ['all-entries.ts', 'app.tsx'],
	};
}

function allEntriesSource(manifest: Manifest): string {
	const subpaths = Object.entries(manifest.exports)
		.filter(([, target]) => target.endsWith('.js'))
		.map(([subpath]) => subpath.slice(2));
	return [
		...subpaths.map(
			(subpath, index) => `import * as entry${index} from '${manifest.name}/${subpath}';`,
		),
		`export const entries = [${subpaths.map((_, index) => `entry${index}`).join(', ')}];`,
		'',
	].join('\n');
}

const SSR_OUTLET = '<!--ssr-outlet-->';

/** The app the server renders and the browser hydrates. */
const APP = `
import { Blockquote } from '@luke-ui/react/blockquote';
import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { Icon } from '@luke-ui/react/icon';
import { Provider } from '@luke-ui/react/provider';
import spritesheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { SwitchField } from '@luke-ui/react/switch-field';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { createElement as h, useEffect } from 'react';

/** Calls \`onHydrated\` after the first client commit. The server never runs effects. */
export function App({ onHydrated }) {
	useEffect(() => {
		onHydrated?.();
	}, [onHydrated]);
	return h(
		Provider,
		{ spritesheetHref },
		h(
			Box,
			{ display: 'flex', gap: 'sp8' },
			h(Blockquote, null, 'Hello world'),
			h(Icon, { name: 'chevronDown', 'aria-label': 'Expand' }),
			h(TextInputField, { label: 'Name' }),
			h(CheckboxField, { label: 'Example checkbox' }),
			h(SwitchField, { label: 'Example switch' }),
			h(Button, null, 'Save'),
		),
	);
}
`;

/** The hydration entry. It records recoverable errors, then marks the first client commit. */
const ENTRY_CLIENT = `
import '@luke-ui/react/stylesheet.css';
import { createElement as h } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { App } from './app.js';

const recoverableErrors = [];
hydrateRoot(
	document.getElementById('root'),
	h(App, {
		onHydrated: () => {
			window.hydration = { recoverableErrors };
		},
	}),
	{ onRecoverableError: (error) => recoverableErrors.push(String(error)) },
);
`;

const ENTRY_SERVER = `
import { createElement as h } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './app.js';

export function render() {
	return renderToString(h(App));
}
`;

/** The inline script snapshots the server DOM before the deferred module script hydrates it. */
const CLIENT_HTML = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>Luke UI consumer</title>
	</head>
	<body>
		<div id="root">${SSR_OUTLET}</div>
		<script>
			window.serverSnapshot = {
				elements: [...document.querySelectorAll('#root *')],
				text: document.getElementById('root').textContent,
			};
		</script>
		<script type="module" src="/src/entry-client.js"></script>
	</body>
</html>
`;

/** Builds every page at the consumer root, then the server entry, with Vite's JS API. */
const BUILD_APP = `
import { readdirSync } from 'node:fs';
import { build } from 'vite';

const pages = readdirSync('.').filter((name) => name.endsWith('.html'));
await build({
	build: { rollupOptions: { input: Object.fromEntries(pages.map((page) => [page.slice(0, -5), page])) } },
	configFile: false,
	logLevel: 'error',
});
await build({
	build: { outDir: 'dist-server', ssr: 'src/entry-server.js' },
	configFile: false,
	logLevel: 'error',
});
`;

/** Renders the app in Node into a copy of the built page, `dist/ssr.html`, and prints the markup. */
const RENDER = `
import { readFileSync, writeFileSync } from 'node:fs';
import { render } from './dist-server/entry-server.js';

const markup = render();
const template = readFileSync('dist/index.html', 'utf8');
if (!template.includes('${SSR_OUTLET}')) throw new Error('The built page has no SSR outlet.');
writeFileSync('dist/ssr.html', template.replace('${SSR_OUTLET}', markup));
process.stdout.write(markup);
`;

/**
 * Builds one entry with Vite, with React and React DOM external, then prints the packages and the
 * `@luke-ui/*` source files that contribute code. It reads each `@luke-ui/*` dist file's own source
 * map to trace bundled code back to `src/`.
 */
const MEASURE_BUNDLE = `
import { readFileSync } from 'node:fs';
import { SourceMap } from 'node:module';
import path from 'node:path';
import { build } from 'vite';

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
// The last node_modules segment names the package, including inside a pnpm store path.
const PACKAGE_PATH = /^.*node_modules\\/((?:@[^/]+\\/)?[^/]+)\\/(.+)$/;

/** Decodes source map mappings into the original position of each segment. */
function* originalPositions(mappings) {
	let source = 0;
	let line = 0;
	let column = 0;
	for (const group of mappings.split(';')) {
		for (const segment of group.split(',')) {
			const values = [];
			let value = 0;
			let shift = 0;
			for (const character of segment) {
				const digit = BASE64.indexOf(character);
				value += (digit & 31) << shift;
				if (digit & 32) {
					shift += 5;
					continue;
				}
				values.push(value & 1 ? -(value >>> 1) : value >>> 1);
				value = 0;
				shift = 0;
			}
			if (values.length < 4) continue;
			source += values[1];
			line += values[2];
			column += values[3];
			yield { column, line, source };
		}
	}
}

const distMaps = new Map();
function distMap(file) {
	if (!distMaps.has(file)) {
		try {
			distMaps.set(file, new SourceMap(JSON.parse(readFileSync(\`\${file}.map\`, 'utf8'))));
		} catch {
			distMaps.set(file, undefined);
		}
	}
	return distMaps.get(file);
}

const [entry] = process.argv.slice(2);
const output = await build({
	configFile: false,
	logLevel: 'silent',
	build: {
		minify: false,
		rollupOptions: {
			external: (id) => /^(react|react-dom|scheduler)(\\/|$)/.test(id),
			input: path.resolve(entry),
			preserveEntrySignatures: 'exports-only',
		},
		sourcemap: true,
		write: false,
	},
});

const packages = new Set();
const sources = new Set();
for (const chunk of [output].flat().flatMap((result) => result.output)) {
	if (chunk.type !== 'chunk' || !chunk.map) continue;
	const chunkDir = path.resolve('dist', path.dirname(chunk.fileName));
	for (const position of originalPositions(chunk.map.mappings)) {
		const file = path.resolve(chunkDir, chunk.map.sources[position.source]);
		const match = PACKAGE_PATH.exec(file.replaceAll('\\\\', '/'));
		if (!match) continue;
		const [, name, inner] = match;
		if (!name.startsWith('@luke-ui/')) {
			packages.add(name);
			continue;
		}
		const map = distMap(file);
		// Vanilla Extract output maps to its one \`.css.ts\` source without mappings.
		const original =
			map?.findEntry(position.line, position.column)?.originalSource ??
			(map?.payload.sources.length === 1 ? map.payload.sources[0] : undefined);
		const resolved = original ? path.posix.join(path.posix.dirname(inner), original) : inner;
		// A dependency bundled into dist resolves to its own package.
		const bundled = PACKAGE_PATH.exec(resolved);
		packages.add(bundled ? bundled[1] : name);
		if (!bundled) sources.add(\`\${name}/\${resolved}\`);
	}
}
process.stdout.write(JSON.stringify({ packages: [...packages].sort(), sources: [...sources].sort() }));
`;

/** Representative typed usage. \`all-entries.ts\` covers the rest of the declaration graph. */
const TYPED_APP = `
import { Blockquote } from '@luke-ui/react/blockquote';
import { Box, type BoxProps } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Provider } from '@luke-ui/react/provider';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { breakpoints, getThemeClassName, vars } from '@luke-ui/react/theme';
import {
	defineTheme,
	type FontMetrics,
	type ThemeFont,
	type ThemeInput,
	ThemeValidationError,
} from '@luke-ui/react/theme/compiler';
import type { entries } from './all-entries.js';

const metrics = {
	ascent: 1984,
	capHeight: 1490,
	descent: -494,
	familyName: 'Inter',
	lineGap: 0,
	unitsPerEm: 2048,
};
const body: ThemeFont = { family: "'Inter', sans-serif", metrics };
const typography = { fonts: { body } };
const theme: ThemeInput = {
	name: 'fixture',
	color: { accent: '#3355ff', surface: { base: '#fafafa', field: { light: '#ffffff' } } },
	controlFinish: { light: { resting: 'none' } },
	radius: { control: 6 },
	typography,
};
export const css: string = defineTheme(theme);
export const identityClassName: string = getThemeClassName(theme.name);
export const validationIssues: ReadonlyArray<{ message: string; path: string; theme: string }> =
	new ThemeValidationError([]).issues;
export const fullMetrics: Partial<FontMetrics> = metrics;
export const textColor: string = vars.color.text.primary;
export const mobileBreakpoint: number = breakpoints.bp640;

// The 1.0 token contract: retained paths compile, and removed pre-1.0 paths do not.
export const retainedTokens: Array<string> = [
	vars.color.surface.base,
	vars.color.surface.subdued,
	vars.color.surface.field,
	vars.color.surface.overlay,
	vars.color.border.control,
	vars.color.border.controlHover,
	vars.color.border.warning,
	vars.color.background.neutral.subtle.pressed,
	vars.color.text.disabled,
	vars.color.loadingSkeleton,
	vars.controlFinish.raised,
	vars.depth.overlay,
	vars.font.body.lineHeight,
	vars.controlSize.small,
	vars.controlSize.medium,
	vars.radius.full,
	vars.interaction.disabledOpacity,
];
// @ts-expect-error — replaced by color.surface.base
export const removedCanvas = vars.color.surface.canvas;
// @ts-expect-error — removed surface
export const removedRecessed = vars.color.surface.recessed;
// @ts-expect-error — removed surface
export const removedFloating = vars.color.surface.floating;
// @ts-expect-error — renamed to controlFinish
export const removedFinish = vars.actionControlFinish;
// @ts-expect-error — icon sizes are private
export const removedIconSize = vars.iconSize;
// @ts-expect-error — the minimum target is private
export const removedMinTarget = vars.controlSize.minTarget;
// @ts-expect-error — the Combobox action size is private
export const removedComboboxAction = vars.controlSize.comboboxAction;
// @ts-expect-error — Capsize trims are private
export const removedBaselineTrim = vars.font.body.baselineTrim;
// @ts-expect-error — Capsize trims are private
export const removedCapHeightTrim = vars.font.body.capHeightTrim;
export const removedThemeInputs: Array<ThemeInput> = [
	// @ts-expect-error — replaced by color.surface.base
	{ name: 'a', color: { accent: '#3355ff', background: '#ffffff' }, typography },
	// @ts-expect-error — radius takes explicit roles only
	{ name: 'b', color: { accent: '#3355ff' }, radius: { base: 4 }, typography },
	// @ts-expect-error — renamed to controlFinish
	{ name: 'c', color: { accent: '#3355ff' }, actionControlFinish: {}, typography },
	// @ts-expect-error — the curated font enum is replaced by typography.fonts
	{ name: 'd', color: { accent: '#3355ff' }, typography: { ...typography, fontFamily: 'inter' } },
	// @ts-expect-error — a fresh theme needs a body font
	{ name: 'e', color: { accent: '#3355ff' }, typography: { fonts: {} } },
	// @ts-expect-error — the body font is never nullable
	{ name: 'f', color: { accent: '#3355ff' }, typography: { fonts: { body: null } } },
];
// A null display font is how an extending theme removes an inherited one.
export const withoutDisplay: ThemeInput = {
	name: 'g',
	color: { accent: '#3355ff' },
	typography: { fonts: { body, display: null } },
};

// Box values follow the public token contract.
export const retainedBoxValues: Array<BoxProps> = [
	{ backgroundColor: 'surface.field', borderColor: 'controlHover', boxShadow: 'overlay' },
	{ backgroundColor: 'warning.subtle.rest', borderRadius: 'full', gap: 'sp96' },
];
// @ts-expect-error — removed with color.surface.canvas
export const removedBoxSurface: BoxProps['backgroundColor'] = 'surface.canvas';
// @ts-expect-error — removed with color.surface.floating
export const removedBoxFloating: BoxProps['backgroundColor'] = 'surface.floating';

// No public entrypoint exports a private structural constant or the Capsize name helper.
type ExportNames<Entry> = Entry extends unknown ? keyof Entry : never;
type PublicExportName = ExportNames<(typeof entries)[number]>;
type LeakedName = Extract<
	PublicExportName,
	| 'ICON_SIZES'
	| 'MIN_TARGET_SIZE'
	| 'COMBOBOX_ACTION_SIZE'
	| 'CONTROL_SIZE_VALUES'
	| 'capsizeTrimVarName'
>;
export const leakedNames: [LeakedName] extends [never] ? true : LeakedName = true;

const renderRoot: NonNullable<BoxProps['renderRoot']> = (domProps, state) => {
	const emptyState: Record<string, never> = state;
	return <section {...domProps} data-state-keys={Object.keys(emptyState).length} />;
};

// @ts-expect-error — renderRoot owns its element and excludes elementType
export const conflictingRoot: BoxProps = { elementType: 'section', renderRoot };
// @ts-expect-error — Box exposes no public render state properties
export const invalidRenderState: Parameters<typeof renderRoot>[1] = { isHovered: true };

export function App({ spritesheetHref }: { spritesheetHref: string }) {
	return (
		<Provider spritesheetHref={spritesheetHref}>
			<Box display="flex" gap="sp8">
				<Blockquote>Hello</Blockquote>
				<Box padding="sp16" renderRoot={renderRoot}>Owned root</Box>
				<TextInputField label="Name" />
				<Button onPress={() => {}}>Save</Button>
			</Box>
		</Provider>
	);
}
`;
