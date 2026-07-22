import { lukeLayerOrder, lukePreset } from '@luke-ui/react/preset';
import { defineConfig } from '@pandacss/dev';
import presetBase from '@pandacss/preset-base';

const [reset, base, tokens, recipes, , utilities] = lukeLayerOrder;

export default defineConfig({
	// Ejected mode: the docs consume the DS prebuilt stylesheet for reset, themes,
	// and recipes. `lukePreset` supplies only token aliases for docs atomics.
	eject: true,
	presets: [lukePreset],
	include: ['./src/**/*.{ts,tsx}'],
	exclude: ['./src/**/*.test.{ts,tsx}', './src/**/*.browser.test.{ts,tsx}'],
	layers: { base, recipes, reset, tokens, utilities },
	// Pull in the base utility definitions without its reset, globals, or theme.
	utilities: { ...presetBase.utilities },
	outdir: 'styled-system',
});
