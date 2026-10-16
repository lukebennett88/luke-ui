import { expect, test } from 'vite-plus/test';
import { parseTypeDefinitionsPayload } from './type-definition-model.js';

test('parseTypeDefinitionsPayload accepts a valid registry', () => {
	expect(
		parseTypeDefinitionsPayload({
			PressAction: {
				definition: 'type PressAction = () => void | Promise<void>;',
				filePath: 'packages/@luke-ui/react/src/core/use-press-action/use-press-action.ts',
				name: 'PressAction',
			},
		}),
	).toEqual({
		PressAction: {
			definition: 'type PressAction = () => void | Promise<void>;',
			filePath: 'packages/@luke-ui/react/src/core/use-press-action/use-press-action.ts',
			name: 'PressAction',
		},
	});
});

test('parseTypeDefinitionsPayload rejects invalid shapes', () => {
	expect(() => parseTypeDefinitionsPayload(null)).toThrow(/Invalid type definitions payload/);
	expect(() => parseTypeDefinitionsPayload([])).toThrow(/Invalid type definitions payload/);
	expect(() =>
		parseTypeDefinitionsPayload({
			Broken: { definition: 1, name: 'Broken' },
		}),
	).toThrow(/Invalid type definitions payload/);
	expect(() =>
		parseTypeDefinitionsPayload({
			Broken: { definition: 'type Broken = string;', name: '' },
		}),
	).toThrow(/Invalid type definitions payload/);
});
