import * as z from 'zod';

export const colorModeSchema = z.enum(['system', 'light', 'dark']);
export const fontSizeSchema = z.enum(['small', 'default', 'large']);

const USERNAME_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const AVATAR_DATA_URL_PATTERN = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export const profileSchema = z.object({
	avatarDataUrl: z
		.string()
		.max(1_400_000, 'Choose an image smaller than 1 MB')
		.regex(AVATAR_DATA_URL_PATTERN, 'Choose a PNG, JPEG, or WebP image')
		.nullable(),
	displayName: z.string().trim().min(1, 'Name is required').max(80, 'Use 80 characters or fewer'),
	email: z.email(),
	title: z.string().trim().max(80, 'Use 80 characters or fewer'),
	username: z
		.string()
		.trim()
		.min(2, 'Use at least 2 characters')
		.max(32, 'Use 32 characters or fewer')
		.regex(USERNAME_PATTERN, 'Use lowercase letters, numbers, and hyphens'),
});

export const profileUpdateSchema = z
	.preprocess(omitUndefinedFields, profileSchema.partial().strict())
	.refine((patch) => Object.keys(patch).length > 0, 'No changes to save');
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

const preferencesSchema = z.object({
	colorMode: colorModeSchema,
	fontSize: fontSizeSchema,
	pointerCursor: z.boolean(),
	underlineLinks: z.boolean(),
});
export type Preferences = z.infer<typeof preferencesSchema>;

export const preferenceUpdateSchema = z
	.preprocess(omitUndefinedFields, preferencesSchema.partial().strict())
	.refine((patch) => Object.keys(patch).length > 0, 'No changes to save');

export const settingsSchema = z.object({
	preferences: preferencesSchema,
	profile: profileSchema,
});
export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
	preferences: {
		colorMode: 'system',
		fontSize: 'default',
		pointerCursor: false,
		underlineLinks: false,
	},
	profile: {
		avatarDataUrl: null,
		displayName: 'Boricio Jones',
		email: 'boricio@example.com',
		title: 'Product designer',
		username: 'boricio',
	},
};

function omitUndefinedFields(value: unknown) {
	if (value == null || typeof value !== 'object' || Array.isArray(value)) return value;

	return Object.fromEntries(
		Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
	);
}
