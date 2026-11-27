import * as z from 'zod';

const CAPTURE_ID_PATTERN = /^[a-z0-9-]+\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VIEWPORT_PATTERN = /^\d{1,5}x\d{1,5}$/;
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const FINGERPRINT_PATTERN = /^[0-9a-f]{64}$/;

const count = z.number().int().nonnegative();
const viewport = z.string().regex(VIEWPORT_PATTERN);

const resultSchema = z.object({
	actualViewport: viewport.optional(),
	expectedViewport: viewport.optional(),
	fingerprint: z.string().regex(FINGERPRINT_PATTERN).optional(),
	height: count.optional(),
	id: z.string().regex(CAPTURE_ID_PATTERN),
	mismatchedPixels: count.optional(),
	status: z.enum(['added', 'changed', 'removed', 'unchanged']),
	width: count.optional(),
});

const metaSchema = z.object({
	generatedAt: z.string(),
	headSha: z.string().regex(SHA_PATTERN),
	pullRequest: count,
	runAttempt: count,
	runId: count,
});

/**
 * `summary.json` as the comparison writes it locally, and as a pull request publishes it. Only a
 * published report carries `meta`. Unknown keys, such as the local file paths, are dropped.
 */
const reportSchema = z.object({
	counts: z.object({ added: count, changed: count, removed: count, unchanged: count }),
	meta: metaSchema.optional(),
	results: z.array(resultSchema),
});

export type CaptureStatus = 'added' | 'changed' | 'removed';
export type ImageKind = 'actual' | 'diff' | 'expected';

/** A capture that differs from the baseline. */
export type Capture = {
	actualViewport?: string;
	/** The id's first segment, such as `button`. */
	component: string;
	expectedViewport?: string;
	/**
	 * SHA-256 of the expected and actual images, written by the publisher. A report published before
	 * publishers wrote it falls back to its head commit, so the capture counts as changed in the next
	 * commit. A local comparison has none.
	 */
	fingerprint?: string;
	height?: number;
	id: string;
	mismatchedPixels?: number;
	/** The id's second segment, such as `theme-matrix-paper-dark`. */
	name: string;
	status: CaptureStatus;
	width?: number;
};

type ReportMeta = z.infer<typeof metaSchema>;

export type Report = {
	captures: Array<Capture>;
	counts: Record<CaptureStatus | 'unchanged', number>;
	meta?: ReportMeta;
};

/** Validates untrusted report JSON. Throws when it does not match the contract. */
export function parseReport(data: unknown): Report {
	const { counts, meta, results } = reportSchema.parse(data);
	const captures: Array<Capture> = [];
	for (const result of results) {
		if (result.status === 'unchanged') continue;
		const [component = '', name = ''] = result.id.split('/');
		const fingerprint = result.fingerprint ?? (meta ? `commit:${meta.headSha}` : undefined);
		captures.push({
			...result,
			component,
			fingerprint,
			name,
			status: result.status,
		});
	}
	captures.sort((a, b) => a.id.localeCompare(b.id));
	return { captures, counts, meta };
}

export function imageUrl(baseUrl: string, captureId: string, kind: ImageKind): string {
	return `${baseUrl}/diff/${captureId}.${kind}.png`;
}

/**
 * An image's size in pixels, where the report knows it. A report's size is the larger of the
 * expected and actual images, which is always the diff's size. The other two have it unless their
 * sizes differ, and a size change marks every pixel as differing.
 */
export function imageSize(
	capture: Capture,
	kind: ImageKind,
): { height: number; width: number } | undefined {
	const { height, mismatchedPixels, width } = capture;
	if (width === undefined || height === undefined) return undefined;
	if (kind === 'diff') return { height, width };
	if (mismatchedPixels === undefined || mismatchedPixels >= width * height) return undefined;
	return { height, width };
}
