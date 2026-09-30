import * as z from 'zod';

export const colorModeSchema = z.enum(['system', 'light', 'dark']);

export const homeViewSchema = z.enum(['inbox', 'my-issues', 'active', 'board']);

export const firstDaySchema = z.enum(['sunday', 'monday']);

export const fontSizeSchema = z.enum(['small', 'default', 'large']);

export const displayNamesSchema = z.enum(['full', 'username']);

export const commentSubmitKeySchema = z.enum(['enter', 'cmd-enter']);

const profileSchema = z.object({
	avatarDataUrl: z.string().nullable(),
	displayName: z.string().trim().min(1, 'Name is required').max(80),
	email: z.email(),
	title: z.string().max(80),
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
	assignOnStarted: z.boolean(),
	autoAssignToSelf: z.boolean(),
	colorMode: colorModeSchema,
	commentSubmitKey: commentSubmitKeySchema,
	convertEmoticons: z.boolean(),
	disableAnimatedImages: z.boolean(),
	displayNames: displayNamesSchema,
	firstDayOfWeek: firstDaySchema,
	fontSize: fontSizeSchema,
	homeView: homeViewSchema,
	openInDesktopApp: z.boolean(),
	pointerCursor: z.boolean(),
	underlineLinks: z.boolean(),
});
export type Preferences = z.infer<typeof preferencesSchema>;

const sessionSchema = z.object({
	id: z.string(),
	isCurrent: z.boolean(),
	label: z.string(),
	lastSeen: z.string().nullable(),
	location: z.string(),
});
export type Session = z.infer<typeof sessionSchema>;

const securitySchema = z.object({
	sessions: z.array(sessionSchema),
});

export const settingsSchema = z.object({
	preferences: preferencesSchema,
	profile: profileSchema,
	security: securitySchema,
});
export type Settings = z.infer<typeof settingsSchema>;

export const profileLeaveActionSchema = z.object({
	intent: z.literal('leave'),
});

export const securityActionSchema = z.discriminatedUnion('intent', [
	z.object({ intent: z.literal('logout') }),
	z.object({ intent: z.literal('revokeOthers') }),
	z.object({ intent: z.literal('revoke'), sessionId: z.string().min(1) }),
	z.object({ intent: z.literal('delete') }),
]);

export const DEFAULT_SETTINGS: Settings = {
	preferences: {
		assignOnStarted: false,
		autoAssignToSelf: false,
		colorMode: 'system',
		commentSubmitKey: 'enter',
		convertEmoticons: true,
		disableAnimatedImages: false,
		displayNames: 'username',
		firstDayOfWeek: 'monday',
		fontSize: 'default',
		homeView: 'inbox',
		openInDesktopApp: false,
		pointerCursor: false,
		underlineLinks: false,
	},
	profile: {
		avatarDataUrl: null,
		displayName: 'Alex Rivera',
		email: 'alex@northwind.example',
		title: 'Product designer',
		username: 'alex',
	},
	security: {
		sessions: [
			{
				id: 'current',
				isCurrent: true,
				label: 'Chrome on macOS',
				lastSeen: null,
				location: 'Sydney, NSW, AU',
			},
			{
				id: 'other-1',
				isCurrent: false,
				label: 'Safari on iPhone',
				lastSeen: 'Last seen 3 days ago',
				location: 'Melbourne, VIC, AU',
			},
		],
	},
};
