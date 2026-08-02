/**
 * THESIS: A shop-by-purpose index of the public token contract, not a variable dump. Every row is
 * the token doing its own job in the theme the reader is already looking at, so the page cannot
 * disagree with the product.
 * OWN-WORLD: The docs' hairline-ruled grid and fumadocs token language, matched to the icon
 * gallery. No cards, no shadows, no colour of its own.
 * STORY: Pick a purpose or filter by name, see the effect, take the path or the variable.
 * FIRST VIEWPORT: Filter, live count, the ten purposes, then the first group — the shape of the
 * contract is visible before any scrolling.
 * FORM: Extension of an established surface. Sections carry the purpose and the link out; the grid
 * carries the tokens.
 */
import { Icon } from '@luke-ui/react/icon';
import { TextField } from '@luke-ui/react/text-field';
import { vars } from '@luke-ui/react/theme';
import { cx } from '@luke-ui/react/utils';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { CSSProperties, JSX, ReactNode } from 'react';
import { Fragment, useDeferredValue, useMemo, useRef, useState } from 'react';
import type { ThemeToken, ThemeTokenFamily } from '../generated/token-reference.generated.js';
import { themeTokens } from '../generated/token-reference.generated.js';
import type { TokenPurposeGroup } from '../lib/token-purpose-groups.js';
import { tokenPurposeGroups } from '../lib/token-purpose-groups.js';
import { DocsLink } from './docs-link.js';

const TOTAL_TOKEN_COUNT = themeTokens.length;

/** Lets one sample reference a sibling token without rebuilding the `--luke-*` naming rule here. */
const VARIABLE_BY_PATH = new Map(themeTokens.map((token) => [token.path, token.variable]));

/**
 * Shared sample stage. One minimum height gives the grid a single scan line, and the stage grows
 * for the tokens a fixed height would clip, such as the line height of the largest type step.
 */
const SAMPLE_FRAME_CLASS_NAME = 'flex min-h-12 w-full items-center justify-center';

const FOCUS_RING_CLASS_NAME =
	'focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring';

const MOTION_KEYFRAMES = `@keyframes luke-docs-token-motion { from { transform: translateX(-0.75rem); } to { transform: translateX(0.75rem); } } @media (prefers-reduced-motion: reduce) { [data-token-motion] { animation: none !important; } }`;

/** Fixed counterpart for whichever motion axis a leaf does not itself demonstrate. */
const FALLBACK_MOTION_DURATION = '0.9s';
const FALLBACK_MOTION_EASING = 'ease-in-out';

const stageStyle = {
	borderColor: vars.color.border.decorative,
	borderRadius: vars.radius.detail,
	borderStyle: 'solid',
	borderWidth: 1,
} as const satisfies CSSProperties;

/** Purpose-grouped index of every public token, sampled in the active identity and colour mode. */
export function TokenExplorer(): JSX.Element {
	const [filter, setFilter] = useState('');
	const inputRef = useRef<HTMLInputElement | null>(null);

	const query = filter.trim().toLowerCase();
	const groups = useMemo(() => matchGroups(query), [query]);
	const matchCount = groups.reduce((total, group) => total + group.tokens.length, 0);

	const countText =
		query === '' ? `${TOTAL_TOKEN_COUNT} tokens` : `${matchCount} of ${TOTAL_TOKEN_COUNT}`;
	/** Deferred so a screen reader hears the settled result, not every keystroke. */
	const deferredCountText = useDeferredValue(countText);

	function handleClearFilter() {
		setFilter('');
		inputRef.current?.focus();
	}

	return (
		<div className="not-prose flex flex-col gap-6">
			<style>{MOTION_KEYFRAMES}</style>

			<div className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center gap-3">
					<div
						className="min-w-[12rem] flex-1 basis-56"
						ref={(node) => {
							inputRef.current = node?.querySelector('input') ?? null;
						}}
					>
						<TextField
							aria-label="Filter tokens by name"
							onChange={setFilter}
							placeholder="Filter by name"
							prefix={<Icon aria-hidden name="search" size="small" />}
							size="small"
							value={filter}
						/>
					</div>
					<p className="ms-auto text-fd-muted-foreground text-sm tabular-nums">{countText}</p>
					<VisuallyHidden aria-live="polite" elementType="p">
						{deferredCountText}
					</VisuallyHidden>
				</div>

				{groups.length > 0 ? (
					<nav aria-label="Token purposes" className="flex flex-wrap gap-x-4 gap-y-1">
						{groups.map((group) => (
							<a
								className={cx(
									'text-fd-muted-foreground text-sm underline-offset-4 hover:text-fd-foreground hover:underline',
									FOCUS_RING_CLASS_NAME,
								)}
								href={`#${sectionId(group)}`}
								key={group.id}
							>
								{group.title}
							</a>
						))}
					</nav>
				) : null}
			</div>

			{groups.length === 0 ? (
				<EmptyState onClear={handleClearFilter} query={filter.trim()} />
			) : (
				groups.map((group) => <PurposeSection group={group} key={group.id} />)
			)}
		</div>
	);
}

function sectionId(group: TokenPurposeGroup): string {
	return `token-purpose-${group.id}`;
}

/** Matches a token on the strings a reader has: its path, its variable, and the purpose it serves. */
function matchGroups(query: string): ReadonlyArray<TokenPurposeGroup> {
	if (query === '') return tokenPurposeGroups;

	const matched: Array<TokenPurposeGroup> = [];
	for (const group of tokenPurposeGroups) {
		if (group.title.toLowerCase().includes(query)) {
			matched.push(group);
			continue;
		}
		const tokens = group.tokens.filter(
			(token) =>
				token.path.toLowerCase().includes(query) || token.variable.toLowerCase().includes(query),
		);
		if (tokens.length > 0) matched.push({ ...group, tokens });
	}
	return matched;
}

function PurposeSection({ group }: { group: TokenPurposeGroup }) {
	const headingId = sectionId(group);

	return (
		<section aria-labelledby={headingId} className="flex flex-col gap-3">
			<div className="flex flex-col gap-1">
				<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
					<h3 className="scroll-mt-24 font-semibold text-base" id={headingId}>
						{group.title}
					</h3>
					{group.related ? (
						<DocsLink
							className={cx(
								'flex items-center gap-0.5 text-fd-muted-foreground text-sm underline-offset-4 hover:text-fd-foreground hover:underline',
								FOCUS_RING_CLASS_NAME,
							)}
							params={{ _splat: group.related.splat }}
							to="/$"
						>
							{group.related.label}
							<Icon aria-hidden name="chevronRight" size="xsmall" />
						</DocsLink>
					) : null}
				</div>
				<p className="text-fd-muted-foreground text-sm">{group.description}</p>
			</div>

			<div className="grid grid-cols-1 overflow-hidden rounded-xl border border-fd-border sm:grid-cols-2 xl:grid-cols-3">
				{group.tokens.map((token) => (
					<TokenCell key={token.path} token={token} />
				))}
			</div>
		</section>
	);
}

/** One token: the sample it produces, the `vars` path, and the custom property it resolves to. */
function TokenCell({ token }: { token: ThemeToken }) {
	return (
		<div className="-mr-px -mb-px flex flex-col gap-2 border-fd-border border-r border-b p-3">
			<div aria-hidden>
				<TokenSample token={token} />
			</div>
			<div className="flex min-w-0 flex-col gap-0.5">
				<code className="break-words font-mono text-fd-foreground text-xs leading-snug">
					<WrappablePath path={token.path} />
				</code>
				<code className="break-words font-mono text-[11px] text-fd-muted-foreground leading-snug">
					{token.variable}
				</code>
			</div>
		</div>
	);
}

/**
 * A dotted path has no break opportunity of its own, so a narrow column would either overflow or
 * break mid-segment. This offers a break after each dot, keeping every segment whole.
 */
function WrappablePath({ path }: { path: string }) {
	const segments = path.split('.');
	const lastIndex = segments.length - 1;

	return segments.map((segment, index) =>
		index === lastIndex ? (
			segment
		) : (
			// Segments repeat across tokens, so the segment and its position together form the key.
			<Fragment key={`${segment}-${String(index)}`}>
				{`${segment}.`}
				<wbr />
			</Fragment>
		),
	);
}

/**
 * Every sample reads the resolved `--luke-*` custom property off the page's own theme root, so it
 * follows the identity and colour mode already in use without re-rendering.
 */
function TokenSample({ token }: { token: ThemeToken }) {
	const Sample = FAMILY_SAMPLES[token.family];
	return <Sample {...token} />;
}

function ColorSample({ variable }: ThemeToken) {
	return (
		<span
			className={SAMPLE_FRAME_CLASS_NAME}
			style={{ ...stageStyle, backgroundColor: vars.color.surface.canvas }}
		>
			{/* Stretched rather than sized in percent: the stage has no definite height to resolve against. */}
			<span
				style={{ alignSelf: 'stretch', backgroundColor: `var(${variable})`, inlineSize: '100%' }}
			/>
		</span>
	);
}

function DepthSample({ variable }: ThemeToken) {
	return (
		<span
			className={SAMPLE_FRAME_CLASS_NAME}
			style={{ ...stageStyle, backgroundColor: vars.color.surface.recessed }}
		>
			<span
				style={{
					backgroundColor: vars.color.surface.floating,
					blockSize: '1.5rem',
					borderRadius: vars.radius.control,
					boxShadow: `var(${variable})`,
					inlineSize: '60%',
				}}
			/>
		</span>
	);
}

function FinishSample({ variable }: ThemeToken) {
	return (
		<span
			className={SAMPLE_FRAME_CLASS_NAME}
			style={{ ...stageStyle, backgroundColor: vars.color.surface.recessed }}
		>
			<span
				style={{
					backgroundColor: vars.color.background.neutral.solid.rest,
					backgroundImage: `var(${variable})`,
					blockSize: '1.75rem',
					borderRadius: vars.radius.control,
					inlineSize: '70%',
				}}
			/>
		</span>
	);
}

function RadiusSample({ variable }: ThemeToken) {
	return (
		<span className={SAMPLE_FRAME_CLASS_NAME}>
			<span
				style={{
					backgroundColor: vars.color.background.accent.subtle.rest,
					blockSize: '2.5rem',
					borderColor: vars.color.border.decorative,
					borderRadius: `var(${variable})`,
					borderStyle: 'solid',
					borderWidth: 1,
					inlineSize: '2.5rem',
				}}
			/>
		</span>
	);
}

function SpaceSample({ variable }: ThemeToken) {
	return (
		<span className={cx(SAMPLE_FRAME_CLASS_NAME, 'justify-start px-2')} style={stageStyle}>
			<span
				style={{
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: '0.75rem',
					borderRadius: vars.radius.detail,
					inlineSize: `var(${variable})`,
					maxInlineSize: '100%',
				}}
			/>
		</span>
	);
}

/** Shared by `controlSize` and `iconSize`: both are box dimensions, sized straight from the token. */
function SizeSample({ variable }: ThemeToken) {
	return (
		<span className={SAMPLE_FRAME_CLASS_NAME}>
			<span
				style={{
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: `var(${variable})`,
					borderRadius: vars.radius.detail,
					inlineSize: `var(${variable})`,
				}}
			/>
		</span>
	);
}

function MotionSample({ path, variable }: ThemeToken) {
	// `motion.duration.*` and `motion.easing.*` each drive one axis of the same animation; the other
	// axis takes a fixed value, purely so the dot has something to move along.
	const axis = path.split('.')[1];

	return (
		<span className={SAMPLE_FRAME_CLASS_NAME} style={stageStyle}>
			<span
				data-token-motion
				style={{
					animationDirection: 'alternate',
					animationDuration: axis === 'duration' ? `var(${variable})` : FALLBACK_MOTION_DURATION,
					animationIterationCount: 'infinite',
					animationName: 'luke-docs-token-motion',
					animationTimingFunction: axis === 'easing' ? `var(${variable})` : FALLBACK_MOTION_EASING,
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: vars.iconSize.xsmall,
					borderRadius: vars.radius.full,
					inlineSize: vars.iconSize.xsmall,
				}}
			/>
		</span>
	);
}

function TextSample({ children = 'Aa', style }: { children?: ReactNode; style: CSSProperties }) {
	return (
		<span className={SAMPLE_FRAME_CLASS_NAME}>
			<span style={{ color: vars.color.text.primary, ...style }}>{children}</span>
		</span>
	);
}

/**
 * `capHeightTrim` and `baselineTrim` are the capsize margin offsets Luke UI applies above and below a
 * line of text. A swatch cannot show a margin, so this applies the trim to a bar's own margin.
 */
function TrimSample({
	property,
	variable,
}: {
	property: 'marginBlockEnd' | 'marginBlockStart';
	variable: string;
}) {
	return (
		<span className={SAMPLE_FRAME_CLASS_NAME} style={stageStyle}>
			<span
				style={{
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: '0.75rem',
					inlineSize: '3rem',
					[property]: `var(${variable})`,
				}}
			/>
		</span>
	);
}

function FontSample({ path, variable }: ThemeToken) {
	const [, section, property] = path.split('.');

	if (section === 'family') return <TextSample style={{ fontFamily: `var(${variable})` }} />;
	if (section === 'weight') return <TextSample style={{ fontWeight: `var(${variable})` }} />;

	// Every other `font` path is a size step, and each step carries the same five sub-properties. The
	// step's own font size sizes the sample, so a line height or a letter spacing reads at the scale
	// it ships at.
	const stepFontSizeVariable = VARIABLE_BY_PATH.get(`font.${section}.fontSize`);
	const stepFontSize =
		stepFontSizeVariable === undefined ? undefined : `var(${stepFontSizeVariable})`;

	if (property === 'fontSize') return <TextSample style={{ fontSize: `var(${variable})` }} />;
	if (property === 'lineHeight') {
		return (
			<TextSample style={{ fontSize: stepFontSize, lineHeight: `var(${variable})` }}>
				Aa
				<br />
				Aa
			</TextSample>
		);
	}
	if (property === 'letterSpacing') {
		return <TextSample style={{ fontSize: stepFontSize, letterSpacing: `var(${variable})` }} />;
	}

	return (
		<TrimSample
			property={property === 'baselineTrim' ? 'marginBlockStart' : 'marginBlockEnd'}
			variable={variable}
		/>
	);
}

/**
 * The sample each family needs. Typed as a total record, so a new top-level family in the theme
 * contract is a type error here until the explorer can show what it does.
 */
const FAMILY_SAMPLES: Record<ThemeTokenFamily, (token: ThemeToken) => ReactNode> = {
	actionControlFinish: FinishSample,
	color: ColorSample,
	controlSize: SizeSample,
	depth: DepthSample,
	font: FontSample,
	iconSize: SizeSample,
	motion: MotionSample,
	radius: RadiusSample,
	space: SpaceSample,
};

function EmptyState({ onClear, query }: { onClear: () => void; query: string }) {
	return (
		<div className="flex flex-col items-center gap-3 rounded-xl border border-fd-border px-6 py-16 text-center">
			<p className="text-fd-muted-foreground text-sm">No token matches &quot;{query}&quot;</p>
			<button
				className={cx(
					'rounded-md border border-fd-border px-3 py-1.5 font-medium text-fd-foreground text-sm',
					'hover:bg-fd-accent hover:text-fd-accent-foreground',
				)}
				onClick={onClear}
				type="button"
			>
				Clear filter
			</button>
		</div>
	);
}
