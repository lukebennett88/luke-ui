import { defineConfig } from '@pandacss/dev';
import baseConfig from './panda.config.js';

// Extract source-authored recipes separately. Panda emits source cva/sva CSS
// through its utilities slot, so this isolated output is the only file the
// assembler may re-layer as recipes.
export default defineConfig({
	...baseConfig,
	exclude: [],
	include: ['src/**/*.{ts,tsx}'],
	outdir: 'styled-system',
	staticCss: {},
});
