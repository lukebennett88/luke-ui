import { expect, test } from 'vite-plus/test';
import { typeDefinitionsLoadReducer } from './type-definitions-load-state.js';

const data = { A: { definition: 'type A = string;', name: 'A', references: [] } };

test('settles a load that is in flight', () => {
	const loading = typeDefinitionsLoadReducer({ status: 'idle' }, { type: 'load-start' });
	expect(loading).toEqual({ status: 'loading' });
	expect(typeDefinitionsLoadReducer(loading, { data, type: 'load-success' })).toEqual({
		data,
		status: 'ready',
	});
	expect(typeDefinitionsLoadReducer(loading, { message: 'gone', type: 'load-error' })).toEqual({
		message: 'gone',
		status: 'error',
	});
});

test('retries after an error', () => {
	expect(
		typeDefinitionsLoadReducer({ message: 'gone', status: 'error' }, { type: 'load-start' }),
	).toEqual({ status: 'loading' });
});

test('keeps loaded definitions when a later load starts or settles', () => {
	const ready = { data, status: 'ready' } as const;
	expect(typeDefinitionsLoadReducer(ready, { type: 'load-start' })).toBe(ready);
	expect(typeDefinitionsLoadReducer(ready, { message: 'gone', type: 'load-error' })).toBe(ready);
});
