import { expect, test } from 'vite-plus/test';
import { typeDefinitionsLoadReducer } from './type-definitions-load-state.js';

const definitionA = {
	definition: 'type A = string;',
	name: 'A',
};
const definitionB = {
	definition: 'type B = number;',
	name: 'B',
};

test('records a successful load for the in-flight href', () => {
	let state = typeDefinitionsLoadReducer(
		{ status: 'idle' },
		{ href: '/a.json', type: 'load-start' },
	);
	state = typeDefinitionsLoadReducer(state, {
		data: { A: definitionA },
		href: '/a.json',
		type: 'load-success',
	});
	expect(state).toEqual({
		data: { A: definitionA },
		href: '/a.json',
		status: 'ready',
	});
});

test('ignores a stale success after a newer request completed', () => {
	let state = typeDefinitionsLoadReducer(
		{ status: 'idle' },
		{ href: '/a.json', type: 'load-start' },
	);
	state = typeDefinitionsLoadReducer(state, { href: '/b.json', type: 'load-start' });
	state = typeDefinitionsLoadReducer(state, {
		data: { B: definitionB },
		href: '/b.json',
		type: 'load-success',
	});
	expect(state).toEqual({
		data: { B: definitionB },
		href: '/b.json',
		status: 'ready',
	});

	state = typeDefinitionsLoadReducer(state, {
		data: { A: definitionA },
		href: '/a.json',
		type: 'load-success',
	});
	expect(state).toEqual({
		data: { B: definitionB },
		href: '/b.json',
		status: 'ready',
	});
});

test('ignores a stale success while a different href is still loading', () => {
	let state = typeDefinitionsLoadReducer(
		{ status: 'idle' },
		{ href: '/a.json', type: 'load-start' },
	);
	state = typeDefinitionsLoadReducer(state, { href: '/b.json', type: 'load-start' });
	state = typeDefinitionsLoadReducer(state, {
		data: { A: definitionA },
		href: '/a.json',
		type: 'load-success',
	});
	expect(state).toEqual({ href: '/b.json', status: 'loading' });
});

test('ignores a stale error after reset', () => {
	let state = typeDefinitionsLoadReducer(
		{ status: 'idle' },
		{ href: '/a.json', type: 'load-start' },
	);
	state = typeDefinitionsLoadReducer(state, { type: 'reset' });
	state = typeDefinitionsLoadReducer(state, {
		href: '/a.json',
		message: 'gone',
		type: 'load-error',
	});
	expect(state).toEqual({ status: 'idle' });
});
