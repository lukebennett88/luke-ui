import { Button } from '@luke-ui/react/button';
import { Form } from '@luke-ui/react/form';
import { Kbd } from '@luke-ui/react/kbd';
import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { Text } from '@luke-ui/react/text';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { cx } from '@luke-ui/react/utils';
import type { SubmitEvent } from 'react';
import { Fragment, useId, useState, useSyncExternalStore, useTransition } from 'react';
import { THEME_IDENTITY_CLASS_NAMES } from '../lib/theme-prefs-shared.js';
import * as styles from './home-showcase.css.js';
import { getIsMacKeyboardPlatformSnapshot } from './search.js';
import { ThemeControls } from './theme-controls.js';

/**
 * The home page showcase: a few real controls, with the public tokens each part reads set around
 * them like the notes on a printed specimen. Its theme controls are the site's own.
 */
export function HomeShowcase() {
	const [name, setName] = useState('');
	const [size, setSize] = useState<SizeKey>(DEFAULT_SIZE);
	const [isPending, startTransition] = useTransition();
	const id = useId();
	// A control's description reads each of its annotations' token, then note.
	const describedBy = (...areas: Array<AnnotationArea>) =>
		areas.flatMap((area) => [`${id}-${area}-token`, `${id}-${area}-note`]).join(' ');

	// `onSubmit` rather than a form Action, so React never resets the fields after saving.
	function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		startTransition(async () => {
			await delay(1000);
		});
	}

	function handleReset() {
		setName('');
		setSize(DEFAULT_SIZE);
	}

	return (
		<section aria-label="Token specimen" className={styles.root}>
			<div className={styles.masthead}>
				<ThemeControls />
				<span className={styles.edition}>
					{THEME_IDENTITIES.map((identity) => (
						<span className={styles.editionName[identity]} key={identity}>
							.{THEME_IDENTITY_CLASS_NAMES[identity]}
						</span>
					))}
				</span>
			</div>
			<Form controlSize="small" onReset={handleReset} onSubmit={handleSubmit}>
				<div className={styles.plate}>
					<div className={styles.area.name}>
						<TextInputField
							aria-describedby={describedBy('aName', 'bName')}
							isRequired
							label="Name"
							name="name"
							onChange={setName}
							value={name}
						/>
					</div>
					<Annotation area="aName" idPrefix={id} />
					<Annotation area="bName" idPrefix={id} />
					<div className={styles.area.size}>
						<SelectField
							aria-describedby={describedBy('aSize', 'bSize')}
							items={SIZES}
							label="Size"
							name="size"
							onChange={(key) => setSize(key ?? DEFAULT_SIZE)}
							value={size}
						>
							{(item) => <SelectItem>{item.label}</SelectItem>}
						</SelectField>
					</div>
					<Annotation area="aSize" idPrefix={id} />
					<Annotation area="bSize" idPrefix={id} />
					<div className={styles.area.actions}>
						<Button aria-describedby={describedBy('aActions')} size="small" type="reset">
							Reset
						</Button>
						<Button
							aria-describedby={describedBy('bActions')}
							isPending={isPending}
							prominence="high"
							size="small"
							type="submit"
						>
							Save changes
						</Button>
					</div>
					<Annotation area="aActions" idPrefix={id} />
					<Annotation area="bActions" idPrefix={id} />
				</div>
			</Form>
		</section>
	);
}

/**
 * The search shortcut, with the modifier the search trigger shows. The platform is unknown until
 * hydration, so the line stays hidden until then rather than swapping its modifier in view.
 */
export function SearchShortcut() {
	const modifier = useSyncExternalStore(
		subscribeToNothing,
		getShortcutModifierSnapshot,
		getServerShortcutModifierSnapshot,
	);

	return (
		<Text
			color="secondary"
			elementType="p"
			style={modifier ? undefined : { visibility: 'hidden' }}
			typography="label"
		>
			Press <Kbd>{modifier ?? '⌘'}</Kbd> <Kbd>K</Kbd> to search the docs.
		</Text>
	);
}

type AnnotationArea = keyof typeof ANNOTATIONS;

/**
 * Each control's annotations: the public token a part of it reads, and that part. `a` sits before
 * the control and `b` after it.
 */
const ANNOTATIONS = {
	aName: { note: 'Field border', token: 'color.border.control' },
	bName: { note: 'Control corners', token: 'radius.control' },
	aSize: { note: 'Small control height', token: 'controlSize.px32' },
	bSize: { note: 'Chevron', token: 'color.text.secondary' },
	aActions: { note: 'Standard prominence', token: 'color.background.neutral.subtle.rest' },
	bActions: { note: 'High prominence', token: 'color.background.accent.solid.rest' },
} as const satisfies Record<string, { note: string; token: string }>;

function Annotation({ area, idPrefix }: { area: AnnotationArea; idPrefix: string }) {
	const { note, token } = ANNOTATIONS[area];
	const id = `${idPrefix}-${area}`;
	const isEnd = area.startsWith('b');

	return (
		<div className={cx(styles.annotation, isEnd && styles.annotationEnd, styles.area[area])}>
			<span className={styles.label}>
				<span className={styles.token} id={`${id}-token`}>
					{token.split(/(?<=\.)/).map((part, index) => (
						<Fragment key={part}>
							{index > 0 ? <wbr /> : null}
							{part}
						</Fragment>
					))}
				</span>
				<span className={cx(styles.note, isEnd && styles.noteEnd)} id={`${id}-note`}>
					{note}
				</span>
			</span>
			<span aria-hidden className={styles.leader} />
		</div>
	);
}

const THEME_IDENTITIES = ['tactile', 'paper'] as const;

const SIZES = [
	{ id: 'small', label: 'Small' },
	{ id: 'medium', label: 'Medium' },
	{ id: 'large', label: 'Large' },
] as const;

type SizeKey = (typeof SIZES)[number]['id'];

const DEFAULT_SIZE: SizeKey = 'medium';

/** Stands in for a real submission's latency. */
async function delay(ms: number) {
	await new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function subscribeToNothing() {
	return () => {};
}

function getShortcutModifierSnapshot() {
	return getIsMacKeyboardPlatformSnapshot() ? '⌘' : 'Ctrl';
}

function getServerShortcutModifierSnapshot() {
	return null;
}
