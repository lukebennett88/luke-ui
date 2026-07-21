import { lukeLayerOrder } from '@luke-ui/react/preset';
import { defineConfig } from '@pandacss/dev';
import presetBase from '@pandacss/preset-base';

const [reset, base, tokens, recipes, , utilities] = lukeLayerOrder;

export default defineConfig({
	// Ejected mode: no bundled preset theme/reset/tokens. The docs consume the DS
	// prebuilt stylesheet (`@luke-ui/react/stylesheet.css`) for reset/base/tokens/
	// recipes and author their own atomics with raw `var(--luke-*)` values, so
	// this config must emit ONLY those atomics into `@layer utilities`.
	eject: true,
	presets: [],
	include: ['./src/**/*.{ts,tsx}'],
	exclude: ['./src/**/*.test.{ts,tsx}', './src/**/*.browser.test.{ts,tsx}'],
	layers: { base, recipes, reset, tokens, utilities },
	// Pull in the base utility definitions so css() property names resolve,
	// without bundling a preset theme/reset.
	utilities: { ...presetBase.utilities },
	outdir: 'styled-system',
});
