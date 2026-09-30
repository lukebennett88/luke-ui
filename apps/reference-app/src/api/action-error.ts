import * as z from 'zod';

export type ActionErrorResult = {
	fieldErrors?: Record<string, string>;
	formError?: string;
	ok: false;
};

const actionErrorBodySchema = z.object({
	fieldErrors: z.record(z.string(), z.string()).optional(),
	formError: z.string().optional(),
});

export async function toActionError(error: unknown, fallback: string): Promise<ActionErrorResult> {
	if (error instanceof Response) {
		try {
			const json: unknown = await error.json();
			const parsed = actionErrorBodySchema.safeParse(json);
			if (parsed.success) {
				return { ok: false, ...parsed.data };
			}
		} catch {
			// fall through to fallback
		}
		return { formError: fallback, ok: false };
	}
	if (error instanceof Error) {
		return { formError: error.message, ok: false };
	}
	return { formError: fallback, ok: false };
}
