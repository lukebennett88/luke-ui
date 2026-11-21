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
import { useEffect, useRef, useState } from 'react';
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
import type { Report } from '../report/schema.js';
import * as overlayStyles from './overlays.css.js';
import * as styles from './review-panel.css.js';
import { decisionErrorMessage, isReportCurrent, reviewStatusText } from './review-status.js';
import * as reviewStyles from './review.css.js';
import type { PullRequestReview } from './use-pull-request-review.js';

const MAX_NOTE_LENGTH = 500;

const STATUS_COLORS = {
	approved: 'success',
	'changes-requested': 'danger',
	clean: 'secondary',
	comparing: 'secondary',
	failed: 'danger',
	'needs-review': 'warning',
} as const satisfies Record<Review['state'], string>;

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
				<Button
					className={reviewStyles.touchTarget}
					prominence="high"
					size={isCompact ? 'medium' : 'small'}
				>
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
	if (pullReview?.kind !== 'ok' || !pullReview.data.review) return null;
	const { state } = pullReview.data.review;
	const icon = { approved: 'check', 'changes-requested': 'exclamationTriangle' } as const;
	return (
		<Text className={reviewStyles.status} color={STATUS_COLORS[state]} fontWeight="label">
			{state === 'approved' || state === 'changes-requested' ? (
				<Icon name={icon[state]} size="xsmall" />
			) : null}
			{isCompact
				? shortStatusText(pullReview.data.review)
				: reviewStatusText(pullReview.data.review)}
		</Text>
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
			{!pullReview || !session ? <LoadingSpinner aria-label="Loading the review" /> : null}
			{pullReview && pullReview.kind !== 'ok' ? (
				<p className={styles.statusLine}>
					{pullReview.kind === 'unavailable'
						? 'Review actions are only available on the deployed app.'
						: 'The review status could not be loaded.'}
				</p>
			) : null}
			{pullReview?.kind === 'ok' && session ? (
				<ReviewControls
					isCompact={isCompact}
					progress={progress}
					report={report}
					review={pullReview.data.review}
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

type Pending = Decision | 'sign-out' | undefined;

function ReviewControls(props: ReviewControlsProps) {
	const { isCompact, progress, report, review, reviewState, session } = props;
	const { number, onReview, refreshSession } = reviewState;
	const [pending, setPending] = useState<Pending>();
	const [announcement, setAnnouncement] = useState('');
	const [note, setNote] = useState('');
	const [noteError, setNoteError] = useState<string>();
	const [isStale, setIsStale] = useState(false);
	const noteRef = useRef<HTMLTextAreaElement>(null);

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

	// The reviewer can type straight away: opening the review is the step before deciding.
	useEffect(() => {
		if (canDecide) noteRef.current?.focus({ preventScroll: true });
	}, [canDecide]);

	async function decide(decision: Decision) {
		if (!review || !canDecide || pending !== undefined) return;
		const trimmed = note.trim();
		if (decision === 'request-changes' && trimmed === '') {
			setNoteError('Say what needs to change.');
			noteRef.current?.focus();
			return;
		}
		setPending(decision);
		setAnnouncement('');
		const result = await postDecision(number, {
			decision,
			headSha: review.headSha,
			note: trimmed === '' ? undefined : trimmed,
			runAttempt: review.runAttempt,
			runId: review.runId,
		});
		setPending(undefined);
		if (result.kind === 'ok') {
			onReview(result.data.review);
			setNote('');
			setAnnouncement(`Saved. ${reviewStatusText(result.data.review)}.`);
			return;
		}
		setAnnouncement(decisionErrorMessage(result));
		if (result.kind !== 'error') return;
		if (result.code === 'stale') setIsStale(true);
		// The session or the account's access changed, so show what it is now.
		if (result.status === 401 || result.code === 'forbidden') refreshSession();
	}

	function submit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		void decide('request-changes');
	}

	async function signOut() {
		setPending('sign-out');
		setAnnouncement('');
		const isSignedOut = await postLogout();
		setPending(undefined);
		setAnnouncement(isSignedOut ? 'Signed out.' : 'Signing out failed. Try again.');
		if (isSignedOut) refreshSession();
	}

	const isBusy = pending !== undefined;
	const returnPath = `${window.location.pathname}${window.location.search}`;
	const size = isCompact ? 'medium' : 'small';
	const notes = reviewNotes({ isCurrent, report, review, session });

	return (
		<>
			<div>
				<p className={styles.statusLine}>
					<Text color={review ? STATUS_COLORS[review.state] : 'secondary'} fontWeight="label">
						{reviewStatusText(review)}
					</Text>
					{progress ? ` · ${progressText(progress)}` : null}
				</p>
				{review ? (
					<Link
						appearance="button"
						endContent={<Icon name="externalLink" size="xsmall" />}
						href={review.checkUrl}
						prominence="low"
						size="small"
						target="_blank"
					>
						Check on GitHub
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
					className={overlayStyles.options}
					display="grid"
					gap="space.16"
					renderRoot={(domProps) => <form {...domProps} noValidate onSubmit={submit} />}
				>
					<TextField
						className={styles.note}
						isDisabled={!canDecide || isBusy}
						isInvalid={noteError !== undefined}
						maxLength={MAX_NOTE_LENGTH}
						onChange={(value) => {
							setNote(value);
							setNoteError(undefined);
						}}
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

/** Why the decisions are limited or off, in the reviewer's terms. */
function reviewNotes({
	isCurrent,
	report,
	review,
	session,
}: {
	isCurrent: boolean;
	report: Report | undefined;
	review: Review | null;
	session: ApiResult<Session>;
}): Array<string> {
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
	return notes;
}

function progressText({ total, viewed }: { total: number; viewed: number }) {
	const remaining = total - viewed;
	if (remaining === 0) return `You have viewed all ${total} captures.`;
	return `${viewed} of ${total} viewed. You can decide before viewing the rest.`;
}

/** The status without who decided, for a phone's top bar. */
function shortStatusText(review: Review) {
	if (review.state === 'approved') return 'Approved';
	if (review.state === 'changes-requested') return 'Changes';
	return reviewStatusText(review);
}
