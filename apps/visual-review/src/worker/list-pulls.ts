import * as z from 'zod';
import type { PullsResponse, Review } from '../api/contract.js';
import { positiveIntegerSchema, shaSchema } from '../api/contract.js';
import type { Context } from './access.js';
import { installationFetch } from './access.js';
import { cachedJson } from './edge-cache.js';
import { readGitHubJson } from './github.js';
import { newest } from './repo-reads.js';
import { CHECK_NAME, reviewFromCheckRun } from './review.js';

export const PULLS_PATH = '/api/pulls';
const PULLS_CACHE_SECONDS = 30;

const OPEN_PULL_REQUESTS_QUERY = `query OpenPullRequests($owner: String!, $name: String!, $appId: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequests(states: OPEN, first: 100, orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes {
        number
        title
        url
        isDraft
        headRefName
        headRefOid
        author { login }
        commits(last: 1) {
          nodes {
            commit {
              oid
              checkSuites(first: 5, filterBy: { appId: $appId }) {
                nodes {
                  checkRuns(first: 10, filterBy: { checkName: "${CHECK_NAME}", checkType: ALL }) {
                    nodes { databaseId conclusion externalId title url }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

const graphqlCheckRunSchema = z.object({
	conclusion: z.string().nullable(),
	databaseId: positiveIntegerSchema,
	externalId: z.string().nullable(),
	title: z.string().nullable(),
	url: z.string(),
});

const graphqlPullSchema = z.object({
	author: z.object({ login: z.string() }).nullable(),
	commits: z.object({
		nodes: z.array(
			z
				.object({
					commit: z.object({
						checkSuites: z
							.object({
								nodes: z.array(
									z
										.object({
											checkRuns: z
												.object({ nodes: z.array(graphqlCheckRunSchema.nullable()) })
												.nullable(),
										})
										.nullable(),
								),
							})
							.nullable(),
						oid: shaSchema,
					}),
				})
				.nullable(),
		),
	}),
	headRefName: z.string(),
	headRefOid: shaSchema,
	isDraft: z.boolean(),
	number: positiveIntegerSchema,
	title: z.string(),
	url: z.string(),
});

const graphqlPullsSchema = z.object({
	data: z.object({
		repository: z.object({
			pullRequests: z.object({ nodes: z.array(graphqlPullSchema.nullable()) }),
		}),
	}),
});

/** `GET /api/pulls`: every open pull request with its head commit's review. Cached for 30 s. */
export function listPulls(context: Context): Promise<Response> {
	return cachedJson(context, PULLS_PATH, PULLS_CACHE_SECONDS, () => readPulls(context));
}

async function readPulls(context: Context): Promise<PullsResponse> {
	const [owner = '', name = ''] = context.config.repository.split('/');
	const result = await readGitHubJson(
		await installationFetch(context, '/graphql', {
			body: {
				query: OPEN_PULL_REQUESTS_QUERY,
				variables: { appId: context.config.appId, name, owner },
			},
			method: 'POST',
		}),
		graphqlPullsSchema,
		'pull request list',
	);
	const pulls = result.data.repository.pullRequests.nodes.flatMap((pull) => {
		if (!pull) return [];
		return [
			{
				author: pull.author?.login ?? null,
				draft: pull.isDraft,
				headRef: pull.headRefName,
				headSha: pull.headRefOid,
				number: pull.number,
				review: graphqlReview(pull),
				title: pull.title,
				url: pull.url,
			},
		];
	});
	return { pulls };
}

function graphqlReview(pull: z.infer<typeof graphqlPullSchema>): Review | null {
	const commit = pull.commits.nodes[0]?.commit;
	if (commit?.oid !== pull.headRefOid) return null;
	const runs = (commit.checkSuites?.nodes ?? []).flatMap((suite) =>
		(suite?.checkRuns?.nodes ?? []).flatMap((run) => (run ? [run] : [])),
	);
	const run = newest(runs, (candidate) => candidate.databaseId);
	if (!run) return null;
	return reviewFromCheckRun({
		conclusion: run.conclusion?.toLowerCase() ?? null,
		externalId: run.externalId,
		headSha: commit.oid,
		htmlUrl: run.url,
		title: run.title,
	});
}
