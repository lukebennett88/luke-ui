import { describe, expect, it } from 'vite-plus/test';
import { ZodError } from 'zod';
import { parseComponentAnswers } from '../config.js';

const validAnswers = {
	docsGroup: 'feedback',
	name: 'StatusBadge',
	styling: 'recipe',
	tier: 'atom',
};

describe('parseComponentAnswers', () => {
	it('rejects invalid tier answers', () => {
		expect(() => parseComponentAnswers({ ...validAnswers, tier: 'molecule' })).toThrow(ZodError);
	});

	it('rejects invalid styling answers', () => {
		expect(() => parseComponentAnswers({ ...validAnswers, styling: 'css' })).toThrow(ZodError);
	});

	it('rejects invalid docs group answers', () => {
		expect(() => parseComponentAnswers({ ...validAnswers, docsGroup: 'layout' })).toThrow(ZodError);
	});
});
