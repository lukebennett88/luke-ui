import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { Link } from '@luke-ui/react/link';
import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { cx } from '@luke-ui/react/utils';
import type { SubmitEvent } from 'react';
import { useEffect, useReducer, useRef } from 'react';
import {
	Dialog,
	DialogTrigger,
	Heading as AriaHeading,
	Label,
	Modal,
	ModalOverlay,
	Popover,
	TextArea,
	TextField,
} from 'react-aria-components';
import type { ApiResult, Decision, Review, Session } from '../api/review-api.js';
import { loginHref, postDecision, postLogout } from '../api/review-api.js';
import { pullRequestUrl } from '../config.js';
import type { Report } from '../report/schema.js';
import * as overlayStyles from './overlays.css.js';
import * as styles from './review-panel.css.js';
import { ReviewStatusLabel } from './review-status-label.js';
import {
	DECISION_ERROR_MESSAGES,
	decisionErrorMessage,
	finalRefusal,
	isReportCurrent,
	REVIEW_STATUSES,
	reviewStatusText,
} from './review-status.js';
import type { FinalRefusal } from './review-status.js';
import * as reviewStyles from './review.css.js';
import type { PullRequestReview } from './use-pull-request-review.js';

const MAX_NOTE_LENGTH = 500;

type ReviewTriggerProps = {
	isCompact: boolean;
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	/** Viewed and total captures, said beside the decisions. Never a condition for them. */
	progress: { total: number; viewed: number } | undefined;
	/** The report on screen. A decision needs it to be the review's comparison. */
	report: Report | undefined;
	review: PullRequestReview;
};

/**
 * The Review button and the pull request's status beside it. It opens a popover, or a full sheet on
 * a phone, with the decisions, sign-in, or the reason decisions are unavailable.
 */
export function ReviewTrigger(props: ReviewTriggerProps) {
	const { isCompact, isOpen, onOpenChange, progress, report, review } = props;
	const panel = (
		<ReviewPanel
			isCompact={isCompact}
			onClose={() => onOpenChange(false)}
			progress={progress}
			report={report}
			review={review}
		/>
	);
	return (
		<>
			<ReviewStatus isCompact={isCompact} review={review} />
			<DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
				<Button className={reviewStyles.touchTarget} prominence="high" size="medium">
					Review
				</Button>
				{isCompact ? (
					<ModalOverlay className={overlayStyles.modalOverlay} isDismissable>
						<Modal className={cx(overlayStyles.sheet, overlayStyles.sheetFull)}>
							<Dialog aria-labelledby="review-panel-title" className={overlayStyles.dialog}>
								{panel}
							</Dialog>
						</Modal>
					</ModalOverlay>
				) : (
					<Popover
						className={cx(overlayStyles.popover, overlayStyles.reviewPopover)}
						offset={8}
						placement="bottom end"
					>
						<Dialog aria-labelledby="review-panel-title" className={overlayStyles.dialog}>
							{panel}
						</Dialog>
					</Popover>
				)}
			</DialogTrigger>
		</>
	);
}

/** The review's status in the top bar, such as `Approved by @luke`. Nothing while it loads. */
function ReviewStatus({ isCompact, review }: { isCompact: boolean; review: PullRequestReview }) {
	const { pullReview } = review;
	if (pullReview.kind !== 'loaded' || !pullReview.review) return null;
	return (
		<ReviewStatusLabel review={pullReview.review}>
			{isCompact
				? REVIEW_STATUSES[pullReview.review.state].shortLabel
				: reviewStatusText(pullReview.review)}
		</ReviewStatusLabel>
	);
}

type ReviewPanelProps = {
	isCompact: boolean;
	onClose: () => void;
	progress: { total: number; viewed: number } | undefined;
	report: Report | undefined;
	review: PullRequestReview;
};

function ReviewPanel({ isCompact, onClose, progress, report, review }: ReviewPanelProps) {
	const { number, pullReview, session } = review;
	return (
		<Box
			alignContent="start"
			backgroundColor="surface.raised"
			className={overlayStyles.dialogBody}
			display="grid"
			gap="space.16"
		>
			<Box
				alignItems="center"
				className={overlayStyles.sheetHead}
				display="flex"
				gap="space.8"
				justifyContent="space-between"
			>
				<AriaHeading className={overlayStyles.dialogTitle} id="review-panel-title" slot="title">
					{`Review #${number}`}
				</AriaHeading>
				{isCompact ? (
					<IconButton
						aria-label="Close review"
						className={reviewStyles.touchTarget}
						icon="close"
						onPress={onClose}
						prominence="low"
					/>
				) : null}
			</Box>
			{pullReview.kind === 'loading' || session.kind === 'loading' ? (
				<LoadingSpinner aria-label="Loading the review" />
			) : null}
			{pullReview.kind === 'unavailable' || pullReview.kind === 'failed' ? (
				<p className={styles.statusLine}>
					{pullReview.kind === 'unavailable'
						? 'Review actions are only available on the deployed app.'
						: 'The review status could not be loaded.'}
				</p>
			) : null}
			{pullReview.kind === 'loaded' && session.kind !== 'loading' ? (
				<ReviewControls
					isCompact={isCompact}
					progress={progress}
					report={report}
					review={pullReview.review}
					reviewState={review}
					session={session}
				/>
			) : null}
		</Box>
	);
}

type ReviewControlsProps = {
	isCompact: boolean;
	progress: { total: number; viewed: number } | undefined;
	report: Report | undefined;
	review: Review | null;
	reviewState: PullRequestReview;
	session: ApiResult<Session>;
};

function ReviewControls(props: ReviewControlsProps) {
	const { isCompact, progress, report, review, reviewState, session } = props;
	const { number, onReview, refreshSession } = reviewState;
	const [{ announcement, note, noteError, pending, refusal }, dispatch] = useReducer(
		controlsReducer,
		INITIAL_CONTROLS_STATE,
	);
	const noteRef = useRef<HTMLTextAreaElement>(null);

	const isCurrent = review ? isReportCurrent(report, review) && refusal !== 'stale' : false;
	const user = session.kind === 'ok' ? session.data : undefined;
	// A reviewer sees the decisions whenever there is something to decide, but can only make one on
	// the comparison the review describes.
	const isReviewer = review?.kind === 'review' && user?.user !== null && user?.canReview === true;
	const canDecide =
		isReviewer &&
		isCurrent &&
		refusal === undefined &&
		(review.state === 'needs-review' ||
			review.state === 'approved' ||
			review.state === 'changes-requested');

	// The reviewer can type straight away: opening the review is the step before deciding.
	useEffect(() => {
		if (canDecide) noteRef.current?.focus({ preventScroll: true });
	}, [canDecide]);

	async function decide(decision: Decision) {
		if (!review || !canDecide || pending !== undefined) return;
		const trimmed = note.trim();
		if (decision === 'request-changes' && trimmed === '') {
			dispatch({ message: 'Say what needs to change.', type: 'noteRejected' });
			noteRef.current?.focus();
			return;
		}
		dispatch({ pending: decision, type: 'started' });
		const result = await postDecision(number, {
			decision,
			headSha: review.headSha,
			note: trimmed === '' ? undefined : trimmed,
			runAttempt: review.runAttempt,
			runId: review.runId,
		});
		if (result.kind === 'ok') {
			onReview(result.data.review);
			dispatch({
				announcement: `Saved. ${reviewStatusText(result.data.review)}.`,
				type: 'decided',
			});
			return;
		}
		dispatch({
			announcement: decisionErrorMessage(result),
			refusal: result.kind === 'error' ? finalRefusal(result.code) : undefined,
			type: 'settled',
		});
		if (result.kind !== 'error') return;
		// The session or the account's access changed, so show what it is now.
		if (result.status === 401 || result.code === 'forbidden') refreshSession();
	}

	function submit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		void decide('request-changes');
	}

	async function signOut() {
		dispatch({ pending: 'sign-out', type: 'started' });
		const isSignedOut = await postLogout();
		dispatch({
			announcement: isSignedOut ? 'Signed out.' : 'Signing out failed. Try again.',
			refusal: undefined,
			type: 'settled',
		});
		if (isSignedOut) refreshSession();
	}

	const isBusy = pending !== undefined;
	const returnPath = `${window.location.pathname}${window.location.search}`;
	const size = isCompact ? 'medium' : 'small';
	const notes = reviewNotes({ isCurrent, refusal, report, review, session });

	return (
		<>
			<div>
				<p className={styles.statusLine}>
					<Text
						color={review ? REVIEW_STATUSES[review.state].tone : 'secondary'}
						fontWeight="label"
					>
						{reviewStatusText(review)}
					</Text>
					{progress ? ` · ${progressText(progress)}` : null}
				</p>
				{review || number ? (
					<Link
						appearance="button"
						endContent={<Icon name="externalLink" size="xsmall" />}
						href={review ? review.checkUrl : `${pullRequestUrl(number)}/checks`}
						prominence="low"
						size="small"
						target="_blank"
					>
						{review ? 'Check on GitHub' : 'Checks on GitHub'}
					</Link>
				) : null}
			</div>
			{notes.length > 0 ? (
				<Stack className={styles.notes} elementType="ul" gap="space.4">
					{notes.map((text) => (
						<li className={styles.statusLine} key={text}>
							{text}
						</li>
					))}
				</Stack>
			) : null}
			{isReviewer ? (
				<Box
					display="grid"
					gap="space.16"
					renderRoot={(domProps) => <form {...domProps} noValidate onSubmit={submit} />}
				>
					<TextField
						className={styles.note}
						isDisabled={!canDecide || isBusy}
						isInvalid={noteError !== undefined}
						maxLength={MAX_NOTE_LENGTH}
						onChange={(value) => dispatch({ note: value, type: 'noteChanged' })}
						value={note}
					>
						<Label className={styles.noteLabel}>
							Note
							<span className={styles.noteHint}>required to request changes</span>
						</Label>
						<TextArea
							className={styles.textArea}
							placeholder="What should change, and in which captures?"
							ref={noteRef}
						/>
						<Box
							className={styles.noteMeta}
							display="flex"
							gap="space.8"
							justifyContent="space-between"
						>
							<span className={styles.error} role={noteError ? 'alert' : undefined}>
								{noteError ?? ''}
							</span>
							<span className={reviewStyles.numeric}>{`${note.length}/${MAX_NOTE_LENGTH}`}</span>
						</Box>
					</TextField>
					<Box
						alignItems="center"
						className={styles.actions}
						display="flex"
						flexWrap="wrap"
						gap="space.8"
					>
						<Button
							isDisabled={!canDecide || (isBusy && pending !== 'approve')}
							isPending={pending === 'approve'}
							onPress={() => void decide('approve')}
							prominence="high"
							size={size}
						>
							Approve
						</Button>
						<Button
							isDisabled={!canDecide || (isBusy && pending !== 'request-changes')}
							isPending={pending === 'request-changes'}
							size={size}
							type="submit"
						>
							Request changes
						</Button>
						{report && !isCurrent ? (
							<Button onPress={() => window.location.reload()} prominence="low" size={size}>
								Reload
							</Button>
						) : null}
					</Box>
				</Box>
			) : null}
			{user?.user ? (
				<p className={styles.statusLine}>
					{`Signed in as @${user.user.login}. `}
					<Button
						isDisabled={isBusy && pending !== 'sign-out'}
						isPending={pending === 'sign-out'}
						onPress={() => void signOut()}
						prominence="low"
						size="small"
					>
						Sign out
					</Button>
				</p>
			) : null}
			{user?.user === null ? (
				<Link href={loginHref(returnPath)}>Sign in with GitHub to review</Link>
			) : null}
			<p aria-live="polite" className={styles.statusLine} role="status">
				{announcement}
			</p>
		</>
	);
}

/** A decision or sign-out in flight, its outcome, and the note a decision sends. */
type ControlsState = {
	announcement: string;
	note: string;
	noteError: string | undefined;
	pending: Decision | 'sign-out' | undefined;
	/** Why the backend refused a decision that no retry on this report can make. */
	refusal: FinalRefusal | undefined;
};

type ControlsAction =
	| { note: string; type: 'noteChanged' }
	| { message: string; type: 'noteRejected' }
	| { pending: Decision | 'sign-out'; type: 'started' }
	/** A decision is saved, so its note is sent and cleared. */
	| { announcement: string; type: 'decided' }
	/** A decision failed, or a sign-out finished either way. */
	| { announcement: string; refusal: FinalRefusal | undefined; type: 'settled' };

const INITIAL_CONTROLS_STATE: ControlsState = {
	announcement: '',
	note: '',
	noteError: undefined,
	pending: undefined,
	refusal: undefined,
};

function controlsReducer(state: ControlsState, action: ControlsAction): ControlsState {
	switch (action.type) {
		case 'noteChanged':
			return { ...state, note: action.note, noteError: undefined };
		case 'noteRejected':
			return { ...state, noteError: action.message };
		case 'started':
			return { ...state, announcement: '', pending: action.pending };
		case 'decided':
			return { ...state, announcement: action.announcement, note: '', pending: undefined };
		case 'settled':
			return {
				...state,
				announcement: action.announcement,
				pending: undefined,
				refusal: state.refusal ?? action.refusal,
			};
	}
}

/** Why the decisions are limited or off, in the reviewer's terms. */
function reviewNotes({
	isCurrent,
	refusal,
	report,
	review,
	session,
}: {
	isCurrent: boolean;
	refusal: FinalRefusal | undefined;
	report: Report | undefined;
	review: Review | null;
	session: ApiResult<Session>;
}): Array<string> {
	const notes: Array<string> = [];
	if (!review) {
		notes.push(
			'No visual-review check ran for this commit, so there is nothing to approve. Re-run the visual regression workflow on the pull request, or push a new commit.',
		);
	} else if (review.kind === 'failed') {
		notes.push('The comparison failed, so there are no changes to decide on. Re-run it.');
	} else if (review.kind === 'pending') {
		notes.push('The comparison is still running. Decisions open when it finishes.');
	} else if (review.kind === 'clean') {
		notes.push('This comparison found no visual changes, so there is nothing to decide.');
	}
	if (review?.kind === 'review' && review.reasons.includes('infrastructure')) {
		notes.push('This pull request changes visual testing infrastructure.');
	}
	if (review?.kind === 'review' && !report) {
		notes.push('There is no report for this comparison yet, so it cannot be reviewed here.');
	} else if (report && review && review.kind !== 'failed' && !isCurrent) {
		notes.push(
			'This report is out of date: a newer commit or comparison exists. Reload the page to review it.',
		);
	} else if (refusal) {
		notes.push(DECISION_ERROR_MESSAGES[refusal]);
	}
	if (review?.kind === 'review' && session.kind === 'ok' && session.data.user) {
		if (!session.data.canReview) notes.push('Reviewing needs write access to the repository.');
	}
	if (session.kind !== 'ok' && review?.kind === 'review') {
		notes.push('Sign-in is unavailable right now.');
	}
	return notes;
}

function progressText({ total, viewed }: { total: number; viewed: number }) {
	const remaining = total - viewed;
	if (remaining === 0) return `You have viewed all ${total} captures.`;
	return `${viewed} of ${total} viewed. You can decide before viewing the rest.`;
}
