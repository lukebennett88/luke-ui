import { expect, test } from 'vite-plus/test';
import { improveGeneratedDocTypes, stripOuterUndefined } from './improve-generated-doc-types.js';

test('stripOuterUndefined removes only a trailing optional | undefined', () => {
	expect(stripOuterUndefined('AliasOfUnion | undefined')).toBe('AliasOfUnion');
	expect(stripOuterUndefined('string | number | undefined')).toBe('string | number');
	expect(stripOuterUndefined('RequiredInitialResponsiveValue<string | undefined>')).toBe(
		'RequiredInitialResponsiveValue<string | undefined>',
	);
	expect(stripOuterUndefined('AliasOfUnion')).toBe('AliasOfUnion');
});

test('improveGeneratedDocTypes restores optional alias-of-union and leaves controls alone', () => {
	const improved = improveGeneratedDocTypes({
		description: undefined,
		entries: [
			{
				deprecated: false,
				description: '',
				name: 'aliased',
				required: false,
				simplifiedType: 'union',
				tags: [],
				type: 'AliasOfUnion | undefined',
			},
			{
				deprecated: false,
				description: '',
				name: 'label',
				required: false,
				simplifiedType: 'string',
				tags: [],
				type: 'string | undefined',
			},
			{
				deprecated: false,
				description: '',
				name: 'requiredAliased',
				required: true,
				simplifiedType: 'AliasOfUnion',
				tags: [],
				type: 'AliasOfUnion',
			},
			{
				deprecated: false,
				description: '',
				name: 'requiredUnion',
				required: true,
				simplifiedType: 'union',
				tags: [],
				type: 'string | number',
			},
		],
		id: 'fixture',
		name: 'OptionalAliasDocProps',
	});

	expect(improved.entries).toEqual([
		expect.objectContaining({
			name: 'aliased',
			simplifiedType: 'AliasOfUnion',
			type: 'AliasOfUnion',
		}),
		expect.objectContaining({
			name: 'label',
			simplifiedType: 'string',
			type: 'string',
		}),
		expect.objectContaining({
			name: 'requiredAliased',
			simplifiedType: 'AliasOfUnion',
			type: 'AliasOfUnion',
		}),
		expect.objectContaining({
			name: 'requiredUnion',
			simplifiedType: 'union',
			type: 'string | number',
		}),
	]);
});
