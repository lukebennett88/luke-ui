/**
 * The theme consumer: the documented compile script, themes the consumer compiles from the packed
 * theme packages, and one page per theme for the font checks. It needs the workspace theme packages.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { ConsumerFixture, PackedPackage } from './environment.js';
import { readManifest, repoRoot } from './environment.js';

/** Lora's metrics, as the display fixture theme authors them. */
export const LORA_METRICS = {
	ascent: 1006,
	capHeight: 700,
	descent: -274,
	lineGap: 0,
	unitsPerEm: 1000,
};

/** Stylesheets the consumer compiles with `defineTheme`, keyed by theme name. */
export const COMPILED_THEMES = {
	'display-fixture': 'generated/display.css',
	product: 'generated/product.css',
	reference: 'generated/reference.css',
};

const require = createRequire(import.meta.url);

/** The consumer entry, below `entries/`, that imports one theme package's root entry. */
export function themeRootEntry(name: string): string {
	return `${name.slice('@luke-ui/'.length)}-themeClassName`;
}

export function themeFixture(themes: Array<PackedPackage>): ConsumerFixture {
	const files: Record<string, string> = {
		// The docs' samples, verbatim, so the documented command runs exactly as written.
		'compile-theme.ts': readRepoFile('apps/docs/src/samples/theming/compile-theme.ts'),
		'compile-themes.ts': COMPILE_THEMES,
		'display-theme.ts': DISPLAY_THEME,
		'display.html': themePage('display-fixture', 'display', DISPLAY_PAGE_BODY),
		'product-theme.ts': PRODUCT_THEME,
		'product.html': themePage('product', 'product', PRODUCT_PAGE_BODY),
		'reference-theme.ts': readRepoFile('apps/reference-app/src/theme/input.ts'),
		'src/display.js': DISPLAY_ENTRY,
		'src/product.js': PRODUCT_ENTRY,
		'src/tactile.js': TACTILE_ENTRY,
		'tactile.html': themePage('tactile', 'tactile', TACTILE_PAGE_BODY),
		'theme-app.ts': THEME_APP,
		'theme.ts': readRepoFile('apps/docs/src/samples/theming/theme.ts'),
	};
	for (const { manifest } of themes) {
		files[`entries/${themeRootEntry(manifest.name)}.js`] =
			`export { themeClassName } from '${manifest.name}';\n`;
	}
	return {
		dependencies: Object.assign({}, ...themes.map((theme) => theme.installSpecs)),
		// The versions the workspace installs, so the fixtures match the workspace's own checks.
		devDependencies: {
			'@capsizecss/metrics': readManifest(require.resolve('@capsizecss/metrics/package.json'))
				.version,
			'@fontsource/lora': readManifest(require.resolve('@fontsource/lora/package.json')).version,
		},
		files,
		prepare: [['node', 'compile-themes.ts']],
		typeChecked: ['theme-app.ts'],
	};
}

function readRepoFile(file: string): string {
	return readFileSync(path.join(repoRoot, file), 'utf8');
}

/** A page themed by one theme's identity class on `<html>`. */
function themePage(themeName: string, entry: string, body: string): string {
	return `<!doctype html>
<html lang="en" class="luke-ui-theme-${themeName}">
	<head>
		<meta charset="utf-8" />
		<title>${themeName}</title>
	</head>
	<body>
		${body}
		<script type="module" src="/src/${entry}.js"></script>
	</body>
</html>
`;
}

/** Compiles the fixture themes before the build, the same way as the documented script. */
const COMPILE_THEMES = `
import { mkdir, writeFile } from 'node:fs/promises';
import { defineTheme } from '@luke-ui/react/theme/compiler';
import { displayTheme } from './display-theme.ts';
import { productTheme } from './product-theme.ts';
import { referenceThemeInput } from './reference-theme.ts';

await mkdir('generated', { recursive: true });
await writeFile('${COMPILED_THEMES['display-fixture']}', defineTheme(displayTheme));
await writeFile('${COMPILED_THEMES.product}', defineTheme(productTheme));
await writeFile('${COMPILED_THEMES.reference}', defineTheme(referenceThemeInput));
`;

/** A product theme that starts from Paper. It loads Paper's fonts but not Paper's stylesheet. */
const PRODUCT_THEME = `
import type { ExtendingThemeInput } from '@luke-ui/react/theme/compiler';
import { theme as paperTheme } from '@luke-ui/theme-paper/input';

export const productTheme: ExtendingThemeInput = {
	color: { accent: '#3b82f6' },
	extends: paperTheme,
	name: 'product',
};
`;

/** Tactile with Lora, a 1000-units-per-em serif, as its display font. */
const DISPLAY_THEME = `
import type { ExtendingThemeInput } from '@luke-ui/react/theme/compiler';
import { theme as tactileTheme } from '@luke-ui/theme-tactile/input';

export const displayTheme: ExtendingThemeInput = {
	extends: tactileTheme,
	name: 'display-fixture',
	typography: {
		fonts: {
			display: {
				family: "'Lora', serif",
				metrics: { ...${JSON.stringify(LORA_METRICS)}, familyName: 'Lora' },
			},
		},
	},
};
`;

/** Typed usage of the theme packages through their published declarations. */
const THEME_APP = `
import { defineTheme, type ExtendingThemeInput, type ThemeInput } from '@luke-ui/react/theme/compiler';
import { themeClassName as paperClassName } from '@luke-ui/theme-paper';
import { theme as paperTheme } from '@luke-ui/theme-paper/input';
import { themeClassName as tactileClassName } from '@luke-ui/theme-tactile';
import { theme as tactileTheme } from '@luke-ui/theme-tactile/input';

export const classNames: Array<string> = [paperClassName, tactileClassName];
export const inputs: Array<ThemeInput> = [paperTheme, tactileTheme];
const product: ExtendingThemeInput = { extends: paperTheme, name: 'product' };
export const css: string = defineTheme(product);
`;

/** Tactile as the Installation page loads it: the package stylesheet and its `fonts.css`. */
const TACTILE_ENTRY = `
import '@luke-ui/react/stylesheet.css';
import '@luke-ui/theme-tactile/stylesheet.css';
import '@luke-ui/theme-tactile/fonts.css';
`;

const TACTILE_PAGE_BODY = `<p id="body-text" style="font-family: var(--luke-font-body-font-family)">
	Tactile body text
</p>`;

const PRODUCT_ENTRY = `
import '@luke-ui/react/stylesheet.css';
import '../generated/product.css';
import '@luke-ui/theme-paper/fonts.css';
`;

const DISPLAY_ENTRY = `
import '@luke-ui/react/stylesheet.css';
import '../generated/display.css';
import '@luke-ui/theme-tactile/fonts.css';
import '@fontsource/lora/latin-400.css';
`;

const PRODUCT_PAGE_BODY = `<p id="body-text" style="font-family: var(--luke-font-body-font-family)">
	Product body text
</p>`;

const DISPLAY_PAGE_BODY = `<p id="body-text" style="font-family: var(--luke-font-body-font-family)">
	Display fixture body text
</p>
<h1
	id="display-text"
	style="font-family: var(--luke-font-display-font-family); font-weight: 400"
>
	Display fixture heading
</h1>`;
