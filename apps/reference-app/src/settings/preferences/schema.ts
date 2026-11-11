import * as z from 'zod';

export const colorModeSchema = z.enum(['system', 'light', 'dark']);
export const fontSizeSchema = z.enum(['small', 'default', 'large']);

export const preferencesSchema = z.object({
	colorMode: colorModeSchema,
	fontSize: fontSizeSchema,
	pointerCursor: z.boolean(),
	underlineLinks: z.boolean(),
});
export type Preferences = z.infer<typeof preferencesSchema>;

export const preferenceUpdateSchema = preferencesSchema.partial().strict();
