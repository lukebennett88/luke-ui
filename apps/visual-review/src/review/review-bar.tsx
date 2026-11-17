import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Form } from '@luke-ui/react/form';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import type { SubmitEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { ApiResult, Decision, PullReview, Review, Session } from '../api/review-api.js';
import {
	fetchPullReview,
	fetchSession,
	loginHref,
	postDecision,
	postLogout,
} from '../api/review-api.js';
import type { Report } from '../report/schema.js';
import { decisionErrorMessage, isReportCurrent, reviewStatusText } from './review-status.js';

const MAX_NOTE_LENGTH = 500;

const STATUS_COLORS = {
	approved: 'success',
	'changes-requested': 'danger',
	clean: 'secondary',
	comparing: 'secondary',
	failed: 'danger',
	'needs-review': 'warning',
} as const satisfies Record<Review['state'], string>;

type ReviewBarProps = {
	number: number;
	/** The report on screen. Decisions need it to be the review's comparison. */
	report: Report | undefined;
};

/**
 * The pull request's review status, and approve and request changes for a reviewer with write
 * access. Without a review backend, such as on the development server, it says so and offers
 * nothing.
 */
export function ReviewBar({ number, report }: ReviewBarProps) {
	const [pullReview, setPullReview] = useState<ApiResult<PullReview>>();
	const [session, setSession] = useState<ApiResult<Session>>();

	useEffect(() => {
		let isActive = true;
		void fetchPullReview(number).then((result) => {
			if (isActive) setPullReview(result);
		});
		void fetchSession().then((result) => {
			if (isActive) setSession(result);
		});
		return () => {
			isActive = false;
		};
	}, [number]);

	function refreshSession() {
		void fetchSession().then(setSession);
	}

	if (!pullReview || !session) return null;

	return (
		<Box
			alignItems="center"
			backgroundColor="surface.base"
			borderBlockEndWidth="thin"
			borderColor="decorative"
			borderStyle="solid"
			borderWidth="none"
			display="flex"
			elementType="section"
			flexShrink="0"
			flexWrap="wrap"
			gap="space.16"
			justifyContent="space-between"
			paddingBlock="space.12"
			paddingInline="space.16"
			aria-label="Review"
		>
			{pullReview.kind === 'ok' ? (
				<ReviewControls
					number={number}
					onReview={(review) => setPullReview({ data: { ...pullReview.data, review }, kind: 'ok' })}
					onSessionChange={refreshSession}
					report={report}
					review={pullReview.data.review}
					session={session}
				/>
			) : (
				<Text color="secondary" typography="caption">
					{pullReview.kind === 'unavailable'
						? 'Review actions are only available on the deployed app.'
						: 'The review status could not be loaded.'}
				</Text>
			)}
		</Box>
	);
}

type ReviewControlsProps = {
	number: number;
	onReview: (review: Review) => void;
	onSessionChange: () => void;
	report: Report | undefined;
	review: Review | null;
	session: ApiResult<Session>;
};

type Pending = Decision | 'sign-out' | undefined;

function ReviewControls(props: ReviewControlsProps) {
	const { number, onReview, onSessionChange, report, review, session } = props;
	const [pending, setPending] = useState<Pending>();
	const [announcement, setAnnouncement] = useState('');
	const [isNoteOpen, setIsNoteOpen] = useState(false);
	const [note, setNote] = useState('');
	const [noteError, setNoteError] = useState<string>();
	const [isStale, setIsStale] = useState(false);
	const requestChangesRef = useRef<HTMLButtonElement>(null);
	const noteRef = useRef<HTMLInputElement>(null);

	const shouldRestoreFocusRef = useRef(false);

	// Focus moves into the note when it opens, so the reviewer can type straight away, and back to
	// Request changes when it closes. The button is disabled until then, so this waits for the render.
	useEffect(() => {
		if (isNoteOpen) {
			noteRef.current?.focus();
		} else if (shouldRestoreFocusRef.current) {
			shouldRestoreFocusRef.current = false;
			requestChangesRef.current?.focus();
		}
	}, [isNoteOpen]);

	const isCurrent = review ? isReportCurrent(report, review) && !isStale : false;
	const user = session.kind === 'ok' ? session.data : undefined;
	// A reviewer sees the decisions whenever there is something to decide, but can only make one on
	// the comparison the review describes.
	const isReviewer = review?.kind === 'review' && user?.user !== null && user?.canReview === true;
	const canDecide =
		isReviewer &&
		isCurrent &&
		(review.state === 'needs-review' ||
			review.state === 'approved' ||
			review.state === 'changes-requested');

	async function decide(decision: Decision, decisionNote?: string) {
		if (!review) return;
		setPending(decision);
		setAnnouncement('');
		const result = await postDecision(number, {
			decision,
			headSha: review.headSha,
			note: decisionNote,
			runAttempt: review.runAttempt,
			runId: review.runId,
		});
		setPending(undefined);
		if (result.kind === 'ok') {
			onReview(result.data.review);
			setAnnouncement(`Saved. ${reviewStatusText(result.data.review)}.`);
			if (decision === 'request-changes') closeNote();
			return;
		}
		setAnnouncement(decisionErrorMessage(result));
		if (result.kind !== 'error') return;
		if (result.code === 'stale') setIsStale(true);
		// The session or the account's access changed, so show what it is now.
		if (result.status === 401 || result.code === 'forbidden') onSessionChange();
	}

	function closeNote() {
		setIsNoteOpen(false);
		setNote('');
		setNoteError(undefined);
		shouldRestoreFocusRef.current = true;
	}

	function submitNote(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!canDecide || pending !== undefined) return;
		const trimmed = note.trim();
		if (trimmed === '') {
			setNoteError('Say what needs to change.');
			noteRef.current?.focus();
			return;
		}
		void decide('request-changes', trimmed);
	}

	async function signOut() {
		setPending('sign-out');
		setAnnouncement('');
		const isSignedOut = await postLogout();
		setPending(undefined);
		setAnnouncement(isSignedOut ? 'Signed out.' : 'Signing out failed. Try again.');
		if (isSignedOut) onSessionChange();
	}

	const isBusy = pending !== undefined;
	const returnPath = `${window.location.pathname}${window.location.search}`;

	return (
		<Stack gap="space.12" inlineSize="100%">
			<Cluster gap="space.16" justifyContent="space-between">
				<Cluster gap="space.12">
					<Text
						color={review ? STATUS_COLORS[review.state] : 'secondary'}
						fontWeight="label"
						typography="label"
					>
						{reviewStatusText(review)}
					</Text>
					{review ? (
						<Link
							appearance="button"
							endContent={<Icon name="externalLink" size="small" />}
							href={review.checkUrl}
							prominence="low"
							size="small"
							target="_blank"
						>
							Check on GitHub
						</Link>
					) : null}
				</Cluster>
				<Cluster gap="space.12">
					{user?.user ? (
						<>
							<Text color="secondary" typography="caption">
								{`Signed in as @${user.user.login}`}
							</Text>
							<Button
								isDisabled={isBusy && pending !== 'sign-out'}
								isPending={pending === 'sign-out'}
								onPress={() => void signOut()}
								prominence="low"
								size="small"
							>
								Sign out
							</Button>
						</>
					) : null}
					{user?.user === null ? (
						<Link href={loginHref(returnPath)}>Sign in with GitHub to review</Link>
					) : null}
				</Cluster>
			</Cluster>
			<ReviewNotes isCurrent={isCurrent} report={report} review={review} session={session} />
			{isReviewer ? (
				<Cluster gap="space.8">
					<Button
						isDisabled={!canDecide || (isBusy && pending !== 'approve')}
						isPending={pending === 'approve'}
						onPress={() => void decide('approve')}
						prominence="high"
						size="small"
					>
						Approve
					</Button>
					<Button
						isDisabled={!canDecide || isBusy || isNoteOpen}
						onPress={() => setIsNoteOpen(true)}
						ref={requestChangesRef}
						size="small"
					>
						Request changes
					</Button>
					{report && !isCurrent ? (
						<Button onPress={() => window.location.reload()} prominence="low" size="small">
							Reload
						</Button>
					) : null}
				</Cluster>
			) : null}
			{isReviewer && isNoteOpen ? (
				<Form onSubmit={submitNote} validationBehavior="aria">
					<Stack gap="space.8">
						<TextInputField
							errorMessage={noteError}
							inputRef={noteRef}
							isDisabled={isBusy}
							isRequired
							label="What needs to change?"
							maxLength={MAX_NOTE_LENGTH}
							onChange={(value) => {
								setNote(value);
								setNoteError(undefined);
							}}
							description={`Up to ${MAX_NOTE_LENGTH} characters. It is added to the check's history.`}
							size="small"
							value={note}
						/>
						<Cluster gap="space.8">
							<Button
								isDisabled={!canDecide || (isBusy && pending !== 'request-changes')}
								isPending={pending === 'request-changes'}
								size="small"
								type="submit"
							>
								Submit request
							</Button>
							<Button isDisabled={isBusy} onPress={closeNote} prominence="low" size="small">
								Cancel
							</Button>
						</Cluster>
					</Stack>
				</Form>
			) : null}
			<Text aria-live="polite" role="status" typography="caption">
				{announcement}
			</Text>
		</Stack>
	);
}

function ReviewNotes({
	isCurrent,
	report,
	review,
	session,
}: {
	isCurrent: boolean;
	report: Report | undefined;
	review: Review | null;
	session: ApiResult<Session>;
}) {
	const notes: Array<string> = [];
	if (review?.kind === 'review' && review.reasons.includes('infrastructure')) {
		notes.push('This pull request changes visual testing infrastructure.');
	}
	if (review?.kind === 'review' && !report) {
		notes.push('There is no report for this comparison yet, so it cannot be reviewed here.');
	} else if (review && review.kind !== 'failed' && !isCurrent) {
		notes.push(
			'This report is out of date: a newer commit or comparison exists. Reload the page to review it.',
		);
	}
	if (review?.kind === 'review' && session.kind === 'ok' && session.data.user) {
		if (!session.data.canReview) notes.push('Reviewing needs write access to the repository.');
	}
	if (session.kind !== 'ok' && review?.kind === 'review') {
		notes.push('Sign-in is unavailable right now.');
	}
	if (notes.length === 0) return null;
	return (
		<Stack gap="space.4">
			{notes.map((text) => (
				<Text color="secondary" elementType="p" key={text} typography="caption">
					{text}
				</Text>
			))}
		</Stack>
	);
}
