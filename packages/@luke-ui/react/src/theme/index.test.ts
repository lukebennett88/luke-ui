import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vite-plus/test';
import * as theme from './index.js';

const themeBarrelSource = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');

describe('public theme barrel', () => {
	it('does not export interactionColor or InteractionState', () => {
		expect(themeBarrelSource).not.toMatch(/interactionColor/);
		expect(themeBarrelSource).not.toMatch(/InteractionState/);
		expect(themeBarrelSource).not.toMatch(/mixInteractionColor/);
		expect('interactionColor' in theme).toBe(false);
		expect('InteractionState' in theme).toBe(false);
		expect('mixInteractionColor' in theme).toBe(false);
	});
});
