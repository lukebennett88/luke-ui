import type { Preferences } from '../api/schemas.js';
import { colorModeSchema, fontSizeSchema } from '../api/schemas.js';

type SelectOption = { label: string; value: string };

type SelectPref = {
	[K in 'colorMode' | 'fontSize']: {
		hint?: string;
		id: string;
		key: K;
		kind: 'select';
		label: string;
		options: ReadonlyArray<SelectOption>;
		parse: (value: string) => Preferences[K];
	};
}['colorMode' | 'fontSize'];

type SwitchPref = {
	hint: string;
	id: string;
	key: 'pointerCursor' | 'underlineLinks';
	kind: 'switch';
	label: string;
};

export type PrefRow = SelectPref | SwitchPref;

export const INTERFACE_PREFS = [
	{
		id: 'color-mode',
		key: 'colorMode',
		kind: 'select',
		label: 'Theme',
		options: [
			{ label: 'System', value: 'system' },
			{ label: 'Light', value: 'light' },
			{ label: 'Dark', value: 'dark' },
		],
		parse: (value: string) => colorModeSchema.parse(value),
	},
	{
		id: 'font-size',
		key: 'fontSize',
		kind: 'select',
		label: 'Text size',
		options: [
			{ label: 'Small', value: 'small' },
			{ label: 'Default', value: 'default' },
			{ label: 'Large', value: 'large' },
		],
		parse: (value: string) => fontSizeSchema.parse(value),
	},
	{
		hint: 'Show a pointer over buttons and other controls.',
		id: 'pointer-cursor',
		key: 'pointerCursor',
		kind: 'switch',
		label: 'Pointer cursor',
	},
	{
		hint: 'Keep links underlined.',
		id: 'underline-links',
		key: 'underlineLinks',
		kind: 'switch',
		label: 'Underline links',
	},
] as const satisfies ReadonlyArray<PrefRow>;
