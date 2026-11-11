import * as z from 'zod';
import { preferencesSchema } from './preferences/schema.js';
import { profileSchema } from './profile/schema.js';

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
