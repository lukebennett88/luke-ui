import type { Preferences } from '../api/schemas.js';
import {
	colorModeSchema,
	commentSubmitKeySchema,
	displayNamesSchema,
	firstDaySchema,
	fontSizeSchema,
	homeViewSchema,
} from '../api/schemas.js';

export const INTERFACE_KEYS = [
	'colorMode',
	'disableAnimatedImages',
	'fontSize',
	'pointerCursor',
	'underlineLinks',
] as const satisfies ReadonlyArray<keyof Preferences>;

type SelectOption = { label: string; value: string };

type SelectPref = {
	hint?: string;
	id: string;
	key: keyof Preferences;
	kind: 'select';
	label: string;
	options: ReadonlyArray<SelectOption>;
	parse: (value: string) => Preferences[keyof Preferences];
};

type SwitchPref = {
	hint?: string;
	id: string;
	key: keyof Preferences;
	kind: 'switch';
	label: string;
};

export type PrefRow = SelectPref | SwitchPref;

export const GENERAL_PREFS = [
	{
		hint: 'Select which view to display when launching Linear',
		id: 'home-view',
		key: 'homeView',
		kind: 'select',
		label: 'Default home view',
		options: [
			{ label: 'Inbox', value: 'inbox' },
			{ label: 'My issues', value: 'my-issues' },
			{ label: 'Active', value: 'active' },
			{ label: 'Board', value: 'board' },
		],
		parse: (value: string) => homeViewSchema.parse(value),
	},
	{
		hint: 'Select how names are displayed in the Linear interface',
		id: 'display-names',
		key: 'displayNames',
		kind: 'select',
		label: 'Display names',
		options: [
			{ label: 'Full name', value: 'full' },
			{ label: 'Username', value: 'username' },
		],
		parse: (value: string) => displayNamesSchema.parse(value),
	},
	{
		hint: 'Used for date pickers',
		id: 'first-day',
		key: 'firstDayOfWeek',
		kind: 'select',
		label: 'First day of the week',
		options: [
			{ label: 'Monday', value: 'monday' },
			{ label: 'Sunday', value: 'sunday' },
		],
		parse: (value: string) => firstDaySchema.parse(value),
	},
	{
		hint: 'Strings like :) will be converted to 🙂',
		id: 'convert-emoticons',
		key: 'convertEmoticons',
		kind: 'switch',
		label: 'Convert text emoticons into emojis',
	},
	{
		hint: 'Choose which key press is used to submit comments',
		id: 'comment-submit-key',
		key: 'commentSubmitKey',
		kind: 'select',
		label: 'Send comments on…',
		options: [
			{ label: 'Enter', value: 'enter' },
			{ label: '⌘ + Enter', value: 'cmd-enter' },
		],
		parse: (value: string) => commentSubmitKeySchema.parse(value),
	},
] as const satisfies ReadonlyArray<PrefRow>;

export const INTERFACE_PREFS = [
	{
		hint: 'Adjust the size of text across the app',
		id: 'font-size',
		key: 'fontSize',
		kind: 'select',
		label: 'Font size',
		options: [
			{ label: 'Small', value: 'small' },
			{ label: 'Default', value: 'default' },
			{ label: 'Large', value: 'large' },
		],
		parse: (value: string) => fontSizeSchema.parse(value),
	},
	{
		hint: 'Change the cursor to a pointer when hovering over any interactive elements',
		id: 'pointer-cursor',
		key: 'pointerCursor',
		kind: 'switch',
		label: 'Use pointer cursors',
	},
	{
		hint: 'Always underline links in text content',
		id: 'underline-links',
		key: 'underlineLinks',
		kind: 'switch',
		label: 'Underline links',
	},
	{
		hint: 'When enabled, GIFs and animated emojis will be static by default and animate only on hover.',
		id: 'disable-animated-images',
		key: 'disableAnimatedImages',
		kind: 'switch',
		label: 'Disable animated images & emoji',
	},
	{
		hint: 'Select or customize your interface color scheme',
		id: 'color-mode',
		key: 'colorMode',
		kind: 'select',
		label: 'Interface theme',
		options: [
			{ label: 'System preference', value: 'system' },
			{ label: 'Light', value: 'light' },
			{ label: 'Dark', value: 'dark' },
		],
		parse: (value: string) => colorModeSchema.parse(value),
	},
] as const satisfies ReadonlyArray<PrefRow>;

export const DESKTOP_PREFS = [
	{
		hint: 'Automatically open links in desktop app when possible',
		id: 'open-in-desktop-app',
		key: 'openInDesktopApp',
		kind: 'switch',
		label: 'Open in desktop app',
	},
] as const satisfies ReadonlyArray<PrefRow>;

export const AUTOMATION_PREFS = [
	{
		hint: 'When creating new issues, always assign them to yourself by default',
		id: 'auto-assign-to-self',
		key: 'autoAssignToSelf',
		kind: 'switch',
		label: 'Auto-assign to self',
	},
	{
		hint: 'When you move an unassigned issue to started, it will be automatically assigned to you',
		id: 'assign-on-started',
		key: 'assignOnStarted',
		kind: 'switch',
		label: 'On move to started status, assign to yourself',
	},
] as const satisfies ReadonlyArray<PrefRow>;
