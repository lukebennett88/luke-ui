import * as z from 'zod';

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

export const profileUpdateSchema = profileSchema.partial().strict();
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
