import { expect, test } from 'vite-plus/test';
import { stripUndefinedMember } from './strip-optional-undefined.js';

test('removes a trailing undefined from a union', () => {
	expect(stripUndefinedMember('"button" | "text" | undefined')).toBe('"button" | "text"');
});

test('removes undefined wherever it sits in the union', () => {
	expect(stripUndefinedMember('undefined | "a" | "b"')).toBe('"a" | "b"');
});

test('unwraps the parentheses of a lone function type', () => {
	expect(stripUndefinedMember('((e: KeyboardEvent) => void) | undefined')).toBe(
		'(e: KeyboardEvent) => void',
	);
});

test('keeps the parentheses of a function type that shares the union', () => {
	expect(stripUndefinedMember('((e: Event) => void) | string | undefined')).toBe(
		'((e: Event) => void) | string',
	);
});

test('leaves undefined nested in generics and parameters alone', () => {
	expect(stripUndefinedMember('Array<string | undefined>')).toBe('Array<string | undefined>');
	expect(stripUndefinedMember('((value: string | undefined) => void) | undefined')).toBe(
		'(value: string | undefined) => void',
	);
	expect(stripUndefinedMember('Record<string, number | undefined> | undefined')).toBe(
		'Record<string, number | undefined>',
	);
});

test('does not treat an arrow as a closing angle bracket', () => {
	expect(stripUndefinedMember('Promise<(a: A) => void> | undefined')).toBe(
		'Promise<(a: A) => void>',
	);
});

test('ignores separators and undefined inside string literals', () => {
	expect(stripUndefinedMember('"a | undefined" | undefined')).toBe('"a | undefined"');
});

test('returns types without a top-level undefined unchanged', () => {
	expect(stripUndefinedMember('string')).toBe('string');
	expect(stripUndefinedMember('(a: string) => void')).toBe('(a: string) => void');
	expect(stripUndefinedMember('undefined')).toBe('undefined');
});
