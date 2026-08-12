import { describe, expect, it } from 'vite-plus/test';
import { ZodError } from 'zod';
import { parseComponentAnswers } from '../config.js';

const validAnswers = {
	docsGroup: 'feedback',
	name: 'StatusBadge',
};

describe('parseComponentAnswers', () => {
	it('rejects invalid docs group answers', () => {
		expect(() => parseComponentAnswers({ ...validAnswers, docsGroup: 'layout' })).toThrow(ZodError);
	});

	it('defaults test applicability for existing callers', () => {
		expect(parseComponentAnswers(validAnswers)).toMatchObject({
			conformanceTier: 'universal',
			integrationTripwire: false,
			visualCoverage: true,
		});
	});
});
