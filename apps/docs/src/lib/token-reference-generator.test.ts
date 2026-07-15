import { expect, test } from 'vite-plus/test';
import { generateTokenReference } from '../../scripts/generate-token-reference.js';

test('generates documented leaf token mappings from the public contract', () => {
	const reference = generateTokenReference();

	expect(reference).toContain("'color.surface.canvas': 'var(--luke-color-surface-canvas)';\n");
	expect(reference).toContain('Semantic colours for surfaces, content, borders, loading');
	expect(reference).toContain("'motion.easing.exit': 'var(--luke-motion-easing-exit)';\n");
	expect(reference).not.toContain('MapLeafNodes');
});
