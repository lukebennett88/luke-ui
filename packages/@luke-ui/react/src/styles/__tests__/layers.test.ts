import { describe, expect, it } from 'vite-plus/test';
import { layers } from '../layers.css.js';

describe('layers', () => {
	it('declares cascade layers from lowest to highest priority', () => {
		expect(Object.keys(layers)).toEqual(['reset', 'theme', 'recipes', 'utilities']);
	});
});
