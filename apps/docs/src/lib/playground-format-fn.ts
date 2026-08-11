import { createServerFn } from '@tanstack/react-start';
import { staticFunctionMiddleware } from '@tanstack/start-static-server-functions';
import * as z from 'zod';
import { formatPlaygroundSourceWithOxfmt } from './format-playground-source.js';

const sourceSchema = z.object({ source: z.string() });

export type FormatPlaygroundCodeResult =
	| { ok: true; code: string }
	| { ok: false; reason: 'parse' | 'unchanged' };

export const formatPlaygroundCode = createServerFn({ method: 'POST' })
	.validator((data) => sourceSchema.parse(data))
	.middleware(import.meta.env.PROD ? [staticFunctionMiddleware] : [])
	.handler(async ({ data }): Promise<FormatPlaygroundCodeResult> => {
		const formatted = await formatPlaygroundSourceWithOxfmt(data.source);
		if (formatted === null) return { ok: false, reason: 'parse' };
		if (formatted === data.source) return { ok: false, reason: 'unchanged' };
		return { ok: true, code: formatted };
	});
