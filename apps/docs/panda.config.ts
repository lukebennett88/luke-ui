import { lukeLayerOrder } from '@luke-ui/react/preset';
import { defineConfig } from '@pandacss/dev';

const [reset, base, tokens, recipes, , utilities] = lukeLayerOrder;

export default defineConfig({
	include: ['./src/**/*.{ts,tsx}'],
	exclude: ['./src/**/*.test.{ts,tsx}', './src/**/*.browser.test.{ts,tsx}'],
	layers: { base, recipes, reset, tokens, utilities },
	outdir: 'styled-system',
});
