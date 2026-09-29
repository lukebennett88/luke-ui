import { z } from 'zod';

export const colorModeSchema = z.enum(['system', 'light', 'dark']);

export const homeViewSchema = z.enum(['inbox', 'my-issues', 'active', 'board']);

export const firstDaySchema = z.enum(['sunday', 'monday']);

export const fontSizeSchema = z.enum(['small', 'default', 'large']);

const profileSchema = z.object({
	avatarDataUrl: z.string().nullable(),
	displayName: z.string().trim().min(1, 'Name is required').max(80),
	email: z.string().email(),
	username: z
		.string()
		.trim()
		.min(2, 'Username must be at least 2 characters')
		.max(32)
		.regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Use lowercase letters, numbers, and hyphens'),
});

export const profileUpdateSchema = profileSchema.omit({ email: true });
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

export const preferencesSchema = z.object({
	convertEmoticons: z.boolean(),
	displayFullNames: z.boolean(),
	firstDayOfWeek: firstDaySchema,
	homeView: homeViewSchema,
});
export type Preferences = z.infer<typeof preferencesSchema>;

export const interfaceSchema = z.object({
	colorMode: colorModeSchema,
	fontSize: fontSizeSchema,
	pointerCursor: z.boolean(),
	underlineLinks: z.boolean(),
});
export type InterfaceSettings = z.infer<typeof interfaceSchema>;

const accountSchema = z.object({
	createdAt: z.string(),
	plan: z.string(),
	workspace: z.string(),
});

export const settingsSchema = z.object({
	account: accountSchema,
	interface: interfaceSchema,
	preferences: preferencesSchema,
	profile: profileSchema,
});
export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
	account: {
		createdAt: '2024-03-12',
		plan: 'Plus',
		workspace: 'Northwind',
	},
	interface: {
		colorMode: 'system',
		fontSize: 'default',
		pointerCursor: false,
		underlineLinks: false,
	},
	preferences: {
		convertEmoticons: true,
		displayFullNames: false,
		firstDayOfWeek: 'monday',
		homeView: 'inbox',
	},
	profile: {
		avatarDataUrl: null,
		displayName: 'Alex Rivera',
		email: 'alex@northwind.example',
		username: 'alex',
	},
};
