import * as z from 'zod';
import { positiveIntegerSchema } from '../api/contract.js';
import type { Context } from './access.js';
import { installationFetch } from './access.js';
import { readGitHubJson, upstream } from './github.js';
import { COMMENT_MARKER, rewriteCommentStatus } from './review.js';

const MAX_COMMENT_PAGES = 10;
const COMMENTS_PER_PAGE = 100;

const commentsSchema = z.array(
	z.object({
		body: z.string().nullish(),
		id: positiveIntegerSchema,
		user: z.object({ login: z.string() }).nullable(),
	}),
);

type Comment = z.infer<typeof commentsSchema>[number];

/** What the sticky comment's status section says, with the note of a decision that has one. */
export interface CommentStatus {
	note?: string | undefined;
	status: string;
}

/** Rewrites the sticky comment's status section. A pull request without one is left alone. */
export async function updateCommentStatus(
	context: Context,
	number: number,
	{ note, status }: CommentStatus,
): Promise<void> {
	const author = `${await context.github.appSlug(context.config)}[bot]`;
	const comment = await findStickyComment(context, number, author);
	const body = comment ? rewriteCommentStatus(comment.body ?? '', status, note) : undefined;
	if (!comment || body === undefined) return;
	const response = await installationFetch(
		context,
		`/repos/${context.config.repository}/issues/comments/${comment.id}`,
		{ body: { body }, method: 'PATCH' },
	);
	if (!response.ok) throw upstream(`GitHub answered ${response.status} to the comment edit.`);
}

/** Reads comment pages in order until the App's marked comment turns up. */
async function findStickyComment(
	context: Context,
	number: number,
	author: string,
): Promise<Comment | undefined> {
	for (let page = 1; page <= MAX_COMMENT_PAGES; page += 1) {
		// Sequential: the next page is read only when this one has no marked comment.
		// oxlint-disable-next-line no-await-in-loop
		const comments = await readCommentPage(context, number, page);
		const comment = comments.find(
			(candidate) => candidate.user?.login === author && candidate.body?.includes(COMMENT_MARKER),
		);
		if (comment || comments.length < COMMENTS_PER_PAGE) return comment;
	}
	return undefined;
}

async function readCommentPage(
	context: Context,
	number: number,
	page: number,
): Promise<Array<Comment>> {
	return readGitHubJson(
		await installationFetch(
			context,
			`/repos/${context.config.repository}/issues/${number}/comments?per_page=${COMMENTS_PER_PAGE}&page=${page}`,
		),
		commentsSchema,
		'comment list',
	);
}
