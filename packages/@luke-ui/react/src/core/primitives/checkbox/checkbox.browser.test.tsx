import { Box } from '@luke-ui/react/box';
import {
	CheckboxControl,
	CheckboxIndicator,
	CheckboxLabel,
	CheckboxRoot,
} from '@luke-ui/react/primitives/checkbox';
import {
	FieldDescription,
	FieldError,
	FieldLabel,
	InlineField,
} from '@luke-ui/react/primitives/field';
import { vars } from '@luke-ui/react/theme';
import { createRef, useState } from 'react';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../../test-utils/axe.js';
import { emulateForcedColors, emulateReducedMotion } from '../../test-utils/emulate-media.js';
import { getDescribedText } from '../../test-utils/get-described-text.js';
import { contrast, paintedColor } from '../../test-utils/painted-color.js';
import { render, visualAppearances } from '../../test-utils/render.js';
import type { PairedBackground } from '../../test-utils/surface-colors.js';
import {
	pairedColors,
	resolvedColor,
	settledSurfaceColors,
} from '../../test-utils/surface-colors.js';

function checkbox(name: string): HTMLInputElement {
	const element = page.getByRole('checkbox', { name }).element();
	if (!(element instanceof HTMLInputElement)) throw new Error(`Expected a checkbox "${name}".`);
	return element;
}

function Parts({ label }: { label: string }) {
	return (
		<CheckboxLabel>
			<CheckboxControl>
				<CheckboxIndicator />
			</CheckboxControl>
			{label}
		</CheckboxLabel>
	);
}

test('CheckboxRoot puts id on its root element, inputId on the input, and ref on the root', () => {
	const ref = createRef<HTMLDivElement>();
	const inputRef = createRef<HTMLInputElement>();
	render(
		<CheckboxRoot
			className="example-root"
			id="example-root"
			inputId="example-input"
			inputRef={inputRef}
			ref={ref}
		>
			<Parts label="Example checkbox" />
		</CheckboxRoot>,
	);
	const input = checkbox('Example checkbox');
	const root = document.getElementById('example-root');

	expect(input.id).toBe('example-input');
	expect(inputRef.current).toBe(input);
	expect(root).toHaveClass('example-root');
	expect(root?.contains(input)).toBe(true);
	expect(ref.current).toBe(root);
});

test('CheckboxLabel is the clickable native label around the input', async () => {
	const ref = createRef<HTMLLabelElement>();
	render(
		<CheckboxRoot>
			<CheckboxLabel ref={ref}>
				<CheckboxControl>
					<CheckboxIndicator />
				</CheckboxControl>
				Example checkbox
			</CheckboxLabel>
		</CheckboxRoot>,
	);
	const input = checkbox('Example checkbox');

	expect(ref.current?.tagName).toBe('LABEL');
	expect(ref.current?.contains(input)).toBe(true);

	await userEvent.click(page.getByText('Example checkbox'));

	expect(input).toBeChecked();
});

test('CheckboxLabel resolves className, style, and children from the checkbox state', async () => {
	render(
		<CheckboxRoot>
			<CheckboxLabel
				className={({ isSelected }) => (isSelected ? 'is-on' : 'is-off')}
				data-testid="label"
				style={({ isSelected }) => ({ opacity: isSelected ? 1 : 0.75 })}
			>
				{({ isSelected }) => {
					return (
						<>
							<CheckboxControl>
								<CheckboxIndicator />
							</CheckboxControl>
							{isSelected ? 'On' : 'Off'}
						</>
					);
				}}
			</CheckboxLabel>
		</CheckboxRoot>,
	);
	const label = page.getByTestId('label').element();
	if (!(label instanceof HTMLElement)) throw new Error('Expected an HTML label.');

	expect(label).toHaveClass('is-off');
	expect(label.style.opacity).toBe('0.75');

	await userEvent.click(page.getByText('Off', { exact: true }));

	expect(label).toHaveClass('is-on');
	expect(label.style.opacity).toBe('1');
	expect(checkbox('On')).toBeChecked();
});

test('CheckboxRoot owns the indeterminate state', () => {
	render(
		<CheckboxRoot isIndeterminate>
			<Parts label="Mixed" />
		</CheckboxRoot>,
	);

	expect(checkbox('Mixed').indeterminate).toBe(true);
});

test('InlineField renders the label, description, and error in a CheckboxRoot', () => {
	render(
		<CheckboxRoot isInvalid>
			<InlineField
				className="example-field"
				description="Example description"
				errorMessage="Example error"
			>
				<Parts label="Example checkbox" />
			</InlineField>
		</CheckboxRoot>,
	);
	const input = checkbox('Example checkbox');

	expect(input).toHaveAttribute('aria-invalid', 'true');
	expect(getDescribedText(input)).toBe('Example description Example error');
	expect(page.getByText('Example description').element().closest('.example-field')).not.toBe(null);
});

test('InlineField takes div props and adds no semantics of its own', () => {
	render(
		<CheckboxRoot>
			<InlineField data-testid="inline-field" id="inline-field">
				<Parts label="Example checkbox" />
			</InlineField>
		</CheckboxRoot>,
	);
	const field = page.getByTestId('inline-field').element();

	expect(field.tagName).toBe('DIV');
	expect(field.id).toBe('inline-field');
	expect(field).not.toHaveAttribute('role');
	expect(getDescribedText(checkbox('Example checkbox'))).toBe('');
});

// `InlineField` renders no description unless it has one, but always renders the error slot so
// constraint and `validate` messages appear without an `errorMessage`.
test('InlineField always renders the error slot', async () => {
	render(
		<form>
			<CheckboxRoot isRequired>
				<InlineField>
					<Parts label="Terms" />
				</InlineField>
			</CheckboxRoot>
			<button type="submit">Submit</button>
		</form>,
	);
	const input = checkbox('Terms');

	expect(getDescribedText(input)).toBe('');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.poll(() => getDescribedText(input).length).toBeGreaterThan(0);
	expect(input).toHaveAttribute('aria-invalid', 'true');
});

test('manual FieldDescription and FieldError parts work in a CheckboxRoot', () => {
	render(
		<CheckboxRoot isInvalid>
			<Parts label="Example checkbox" />
			<FieldDescription>Example description</FieldDescription>
			<FieldError>Example error</FieldError>
		</CheckboxRoot>,
	);

	const input = checkbox('Example checkbox');

	expect(getDescribedText(input)).toBe('Example description Example error');
});

// `CheckboxField` owns the required marker. A primitive label draws none.
test('CheckboxLabel draws no required marker', () => {
	render(
		<CheckboxRoot isRequired>
			<Parts label="Required" />
		</CheckboxRoot>,
	);
	const input = checkbox('Required');

	expect(input).toBeRequired();
	expect(input.closest('label')?.textContent).toBe('Required');
});

// The marker is hidden from assistive technology, so the label's text shows it and the name does not.
test('a FieldLabel marks a required CheckboxRoot', () => {
	render(
		<>
			<CheckboxRoot isRequired>
				<FieldLabel data-testid="required-label">Required</FieldLabel>
				<Bare />
			</CheckboxRoot>
			<CheckboxRoot>
				<FieldLabel data-testid="optional-label">Optional</FieldLabel>
				<Bare />
			</CheckboxRoot>
		</>,
	);

	expect(checkbox('Required')).toBeRequired();
	expect(page.getByTestId('required-label').element().textContent).toBe('Required\u00A0*');
	expect(checkbox('Optional')).not.toBeRequired();
	expect(page.getByTestId('optional-label').element().textContent).toBe('Optional');
});

test('a composed checkbox primitive has no axe violations', async () => {
	const { container } = render(
		<CheckboxRoot isInvalid isRequired>
			<InlineField description="Example description" errorMessage="Example error">
				<Parts label="Example checkbox" />
			</InlineField>
		</CheckboxRoot>,
	);

	await expectNoAxeViolations(container);
});

function Bare() {
	return (
		<CheckboxLabel>
			<CheckboxControl>
				<CheckboxIndicator />
			</CheckboxControl>
		</CheckboxLabel>
	);
}

test('a FieldLabel inside CheckboxRoot names and toggles the checkbox with no ids passed', async () => {
	render(
		<CheckboxRoot>
			<FieldLabel data-testid="label">Example label</FieldLabel>
			<FieldDescription>Example description</FieldDescription>
			<Bare />
		</CheckboxRoot>,
	);
	const input = checkbox('Example label');

	expect(input).toHaveAccessibleName('Example label');
	expect(input).toHaveAccessibleDescription('Example description');
	expect(input.id).not.toBe('');
	expect(page.getByTestId('label').element()).toHaveAttribute('for', input.id);

	await userEvent.click(page.getByText('Example label', { exact: true }));

	expect(input).toBeChecked();
});

test('CheckboxRoot uses inputId as the input id and the FieldLabel for', async () => {
	render(
		<CheckboxRoot inputId="example-input">
			<FieldLabel data-testid="label">Example label</FieldLabel>
			<Bare />
		</CheckboxRoot>,
	);
	const input = checkbox('Example label');

	expect(input.id).toBe('example-input');
	expect(page.getByTestId('label').element()).toHaveAttribute('for', 'example-input');

	await userEvent.click(page.getByText('Example label', { exact: true }));

	expect(input).toBeChecked();
});

test('CheckboxRoot keeps aria-labelledby and aria-describedby from the layout', () => {
	render(
		<>
			<span id="outside-label">Outside label</span>
			<span id="outside-description">Outside description</span>
			<CheckboxRoot aria-describedby="outside-description" aria-labelledby="outside-label">
				<Bare />
			</CheckboxRoot>
		</>,
	);
	const input = checkbox('Outside label');

	expect(input).toHaveAccessibleDescription('Outside description');
});

for (const appearance of visualAppearances) {
	// The box's fill establishes the mark's colour, so the check mark reads on-solid colour once
	// checked, whatever surface the checkbox sits on.
	test(`the checkbox box pairs each fill with its mark colour in ${appearance.theme} ${appearance.mode}`, () => {
		const { container } = render(
			<Box backgroundColor="success.solid" padding="space.8">
				<CheckboxRoot>
					<Parts label="Plain" />
				</CheckboxRoot>
				<CheckboxRoot defaultSelected>
					<Parts label="Checked" />
				</CheckboxRoot>
				<CheckboxRoot defaultSelected isInvalid>
					<Parts label="Invalid" />
				</CheckboxRoot>
			</Box>,
			{ appearance },
		);
		const indicators = [...container.querySelectorAll('[aria-hidden="true"]')];
		const backgrounds: ReadonlyArray<PairedBackground> = [
			'surface.base',
			'accent.solid.rest',
			'danger.solid.rest',
		];

		expect(indicators.map((indicator) => settledSurfaceColors(indicator))).toEqual(
			indicators.map((indicator, index) =>
				pairedColors(indicator, backgrounds[index] ?? 'surface.base'),
			),
		);
		// The mark is an SVG stroked with `currentColor`, so it shows the checked fills' on-solid colour.
		expect(
			indicators
				.slice(1)
				.map((indicator) => getComputedStyle(indicator.querySelector('path') as Element).stroke),
		).toEqual(
			[vars.color.foreground.accent.onSolid, vars.color.foreground.danger.onSolid].map((token) =>
				resolvedColor(token, container),
			),
		);
	});
}

/** The path a state draws, and the other path that stays undrawn. */
function markPaths(indicator: Element): { check: SVGPathElement; dash: SVGPathElement } {
	const [check, dash] = indicator.querySelectorAll('svg path');
	if (!(check instanceof SVGPathElement) || !(dash instanceof SVGPathElement)) {
		throw new Error('Expected the check and dash paths.');
	}
	return { check, dash };
}

function dashOffset(path: SVGPathElement): number {
	return Number.parseFloat(getComputedStyle(path).strokeDashoffset);
}

test('the indicator draws an SVG check when selected and an SVG dash when indeterminate', async () => {
	const { container } = render(
		<>
			<CheckboxRoot>
				<Parts label="Plain" />
			</CheckboxRoot>
			<CheckboxRoot defaultSelected>
				<Parts label="Checked" />
			</CheckboxRoot>
			<CheckboxRoot isIndeterminate>
				<Parts label="Mixed" />
			</CheckboxRoot>
		</>,
	);
	const [plain, checked, mixed] = [...container.querySelectorAll('[aria-hidden="true"]')].map(
		(indicator) => {
			expect(indicator.querySelector('svg')).not.toBe(null);
			expect(getComputedStyle(indicator, '::after').content).toBe('none');
			return markPaths(indicator);
		},
	);
	if (!plain || !checked || !mixed) throw new Error('Expected three indicators.');

	await expect.poll(() => dashOffset(plain.check)).toBe(1);
	expect(dashOffset(plain.dash)).toBe(1);
	await expect.poll(() => dashOffset(checked.check)).toBe(0);
	expect(dashOffset(checked.dash)).toBe(1);
	await expect.poll(() => dashOffset(mixed.dash)).toBe(0);
	expect(dashOffset(mixed.check)).toBe(1);
	// The box keeps no inset shadow.
	expect(
		getComputedStyle(container.querySelector('[aria-hidden="true"]') as Element).boxShadow,
	).toBe('none');
});

test('the check draws with a transition on stroke-dashoffset, not an animation', () => {
	const { container } = render(
		<CheckboxRoot defaultSelected>
			<Parts label="Checked" />
		</CheckboxRoot>,
	);
	const { check } = markPaths(container.querySelector('[aria-hidden="true"]') as Element);
	const style = getComputedStyle(check);

	expect(style.transitionProperty).toContain('stroke-dashoffset');
	expect(style.transitionDuration).not.toBe('0s');
	expect(style.animationName).toBe('none');
});

/** The running `stroke-dashoffset` transition on a path, or an error when none is running. */
function drawTransition(path: SVGPathElement): CSSTransition {
	const transition = path
		.getAnimations()
		.find(
			(animation): animation is CSSTransition =>
				animation instanceof CSSTransition && animation.transitionProperty === 'stroke-dashoffset',
		);
	if (!transition) throw new Error('Expected a running stroke-dashoffset transition.');
	return transition;
}

/**
 * Slows the feedback motion to 1s so a test can step through it deterministically. The draw, its
 * delays, and the box's colour change all read the token, so one override keeps them in step.
 */
function slowDraw(container: Element): void {
	const name = /var\((--[^,)]+)/.exec(vars.motion.feedback.duration)?.[1];
	if (!(container instanceof HTMLElement) || !name) throw new Error('Expected the feedback token.');
	container.style.setProperty(name, '1000ms');
}

/** Pauses the path's transition at `fraction` of its duration and reads the resulting offset. */
function offsetAt(path: SVGPathElement, fraction: number): number {
	const transition = drawTransition(path);
	transition.pause();
	transition.currentTime = fraction * 1000;
	return dashOffset(path);
}

const fractions = [0, 0.25, 0.5, 0.75, 1] as const;

function sampleOffsets(path: SVGPathElement): Array<number> {
	return fractions.map((fraction) => offsetAt(path, fraction));
}

function expectMonotonic(values: ReadonlyArray<number>, direction: 'up' | 'down'): void {
	for (let index = 1; index < values.length; index++) {
		const previous = values[index - 1] as number;
		const current = values[index] as number;
		expect(direction === 'up' ? current >= previous : current <= previous).toBe(true);
	}
}

function Switching({ initial, next }: { initial: 'checked' | 'mixed'; next: 'checked' | 'mixed' }) {
	const [state, setState] = useState(initial);
	return (
		<>
			<CheckboxRoot isIndeterminate={state === 'mixed'} isSelected>
				<Parts label="Switching" />
			</CheckboxRoot>
			<button
				onClick={() => setState((current) => (current === initial ? next : initial))}
				type="button"
			>
				Switch
			</button>
		</>
	);
}

test('unchecking mid-draw reverses from the current offset instead of restarting', async () => {
	const { container } = render(
		<CheckboxRoot>
			<Parts label="Toggle" />
		</CheckboxRoot>,
	);
	const { check } = markPaths(container.querySelector('[aria-hidden="true"]') as Element);
	slowDraw(container);

	await userEvent.click(page.getByText('Toggle'));
	const midway = offsetAt(check, 0.5);
	expect(midway).toBeGreaterThan(0.05);
	expect(midway).toBeLessThan(0.95);

	await userEvent.click(page.getByText('Toggle'));
	expect(checkbox('Toggle')).not.toBeChecked();
	const reversal = sampleOffsets(check);

	// It starts from where the draw was interrupted, not from drawn (0) or undrawn (1).
	expect(reversal[0]).toBeCloseTo(midway, 1);
	expectMonotonic(reversal, 'up');
	expect(reversal.at(-1)).toBeCloseTo(1, 5);
	await expect.poll(() => dashOffset(check)).toBe(1);
});

test('re-checking mid-undraw turns back from the current offset', async () => {
	const { container } = render(
		<CheckboxRoot defaultSelected>
			<Parts label="Toggle" />
		</CheckboxRoot>,
	);
	const { check } = markPaths(container.querySelector('[aria-hidden="true"]') as Element);
	await expect.poll(() => dashOffset(check)).toBe(0);
	slowDraw(container);

	await userEvent.click(page.getByText('Toggle'));
	const midway = offsetAt(check, 0.5);
	expect(midway).toBeGreaterThan(0.05);
	expect(midway).toBeLessThan(0.95);

	await userEvent.click(page.getByText('Toggle'));
	const redraw = sampleOffsets(check);

	expect(redraw[0]).toBeCloseTo(midway, 1);
	expectMonotonic(redraw, 'down');
	expect(redraw.at(-1)).toBeCloseTo(0, 5);
	await expect.poll(() => dashOffset(check)).toBe(0);
});

/** Every transition running under `scene`: the marks' draws and colours and the box's fill. */
function sceneTransitions(scene: Element): Array<Animation> {
	return scene.getAnimations({ subtree: true });
}

/** Pauses `animations` at `time` ms, skipping any that have already finished and been removed. */
function seekAll(animations: ReadonlyArray<Animation>, time: number): void {
	for (const animation of animations) {
		if (animation.playState === 'idle') continue;
		animation.pause();
		animation.currentTime = time;
	}
}

type Pair = { check: number; dash: number };

/** Steps every transition in the scene from 0 to `end` ms and reads both marks' offsets. */
function sampleSequence(
	scene: Element,
	paths: { check: SVGPathElement; dash: SVGPathElement },
	end: number,
): Array<Pair> {
	const animations = sceneTransitions(scene);
	const samples: Array<Pair> = [];
	for (let time = 0; time <= end; time += 50) {
		seekAll(animations, time);
		samples.push({ check: dashOffset(paths.check), dash: dashOffset(paths.dash) });
	}
	return samples;
}

/** Fails when both marks are more than slightly drawn at one sampled point. */
function expectNeverBothDrawn(samples: ReadonlyArray<Pair>): void {
	for (const { check, dash } of samples) expect(Math.max(check, dash)).toBeGreaterThanOrEqual(0.9);
}

const [checkedToMixed, mixedToChecked] = [
	{ initial: 'checked', next: 'mixed', outgoing: 'check', incoming: 'dash' },
	{ initial: 'mixed', next: 'checked', outgoing: 'dash', incoming: 'check' },
] as const;

test.each([checkedToMixed, mixedToChecked])(
	'$initial to $next undraws the $outgoing before the $incoming draws, never showing both',
	async ({ incoming, initial, next, outgoing }) => {
		const { container } = render(<Switching initial={initial} next={next} />);
		const paths = markPaths(container.querySelector('[aria-hidden="true"]') as Element);
		await expect.poll(() => dashOffset(paths[outgoing])).toBe(0);
		slowDraw(container);

		await userEvent.click(page.getByRole('button', { name: 'Switch' }));
		const samples = sampleSequence(container, paths, 2000);

		expectNeverBothDrawn(samples);
		const outgoingOffsets = samples.map((sample) => sample[outgoing]);
		const incomingOffsets = samples.map((sample) => sample[incoming]);
		expectMonotonic(outgoingOffsets, 'up');
		expectMonotonic(incomingOffsets, 'down');
		// The incoming mark waits out the whole undraw (the first 1s, sampled to index 20), then draws.
		expect(incomingOffsets.slice(0, 20).every((offset) => offset === 1)).toBe(true);
		expect(incomingOffsets[30]).toBeGreaterThan(0.05);
		expect(incomingOffsets[30]).toBeLessThan(0.95);
		expect(outgoingOffsets[10]).toBeGreaterThan(0.05);
		expect(outgoingOffsets[10]).toBeLessThan(0.95);
		expect(samples.at(-1)?.[outgoing]).toBe(1);
		expect(samples.at(-1)?.[incoming]).toBe(0);
	},
);

test.each([checkedToMixed, mixedToChecked])(
	'interrupting $initial to $next keeps the offsets continuous and never shows both marks',
	async ({ incoming, initial, next, outgoing }) => {
		for (const interruptAt of [500, 1500]) {
			const { container, unmount } = render(<Switching initial={initial} next={next} />);
			const paths = markPaths(container.querySelector('[aria-hidden="true"]') as Element);
			await expect.poll(() => dashOffset(paths[outgoing])).toBe(0);
			slowDraw(container);

			await userEvent.click(page.getByRole('button', { name: 'Switch' }));
			seekAll(sceneTransitions(container), interruptAt);
			const before = { check: dashOffset(paths.check), dash: dashOffset(paths.dash) };

			await userEvent.click(page.getByRole('button', { name: 'Switch' }));
			const samples = sampleSequence(container, paths, 2000);

			// The reversal picks up from where the sequence stopped, with no jump on either mark.
			expect(samples[0]?.check).toBeCloseTo(before.check, 1);
			expect(samples[0]?.dash).toBeCloseTo(before.dash, 1);
			expectNeverBothDrawn(samples);
			expectMonotonic(
				samples.map((sample) => sample[outgoing]),
				'down',
			);
			expectMonotonic(
				samples.map((sample) => sample[incoming]),
				'up',
			);
			expect(samples.at(-1)?.[outgoing]).toBe(0);
			expect(samples.at(-1)?.[incoming]).toBe(1);
			unmount();
		}
	},
);

test('a draw from unchecked starts at once and a switch between marks waits for the undraw', async () => {
	const { container } = render(
		<>
			<CheckboxRoot>
				<Parts label="Plain" />
			</CheckboxRoot>
			<Switching initial="checked" next="mixed" />
		</>,
	);
	const [plain, switching] = [...container.querySelectorAll('[aria-hidden="true"]')].map(markPaths);
	if (!plain || !switching) throw new Error('Expected two indicators.');
	const drawDelay = (path: SVGPathElement) => getComputedStyle(path).transitionDelay.split(', ')[0];

	await userEvent.click(page.getByText('Plain'));
	expect(drawDelay(plain.check)).toBe('0s');

	await userEvent.click(page.getByRole('button', { name: 'Switch' }));
	// The default feedback duration is 100ms, so the dash waits for the check's undraw.
	expect(drawDelay(switching.dash)).toBe(
		getComputedStyle(switching.check).transitionDuration.split(', ')[0],
	);
	expect(drawDelay(switching.dash)).not.toBe('0s');
});

test('unchecking keeps the mark legible on the fill until it has undrawn', async () => {
	const { container } = render(
		<CheckboxRoot defaultSelected>
			<Parts label="Toggle" />
		</CheckboxRoot>,
	);
	const indicator = container.querySelector('[aria-hidden="true"]') as Element;
	const { check } = markPaths(indicator);
	await expect.poll(() => dashOffset(check)).toBe(0);
	const checkedStroke = getComputedStyle(check).stroke;
	slowDraw(container);

	await userEvent.click(page.getByText('Toggle'));
	const animations = sceneTransitions(container);
	let visibleSamples = 0;
	for (let time = 0; time <= 2000; time += 50) {
		seekAll(animations, time);
		if (dashOffset(check) >= 0.95) continue;
		visibleSamples++;
		const ratio = contrast(
			paintedColor(getComputedStyle(check).stroke),
			paintedColor(getComputedStyle(indicator).backgroundColor),
		);
		// A non-text graphic needs 3:1 against what it sits on.
		expect(ratio).toBeGreaterThanOrEqual(3);
		// It keeps the checked foreground, not the unchecked one, for as long as it shows.
		expect(paintedColor(getComputedStyle(check).stroke)).toEqual(paintedColor(checkedStroke));
	}

	expect(visibleSamples).toBeGreaterThan(5);
});

test('checking shows the mark in the fill colour from the first frame, with no fade', async () => {
	const { container } = render(
		<CheckboxRoot>
			<Parts label="Toggle" />
		</CheckboxRoot>,
	);
	const { check } = markPaths(container.querySelector('[aria-hidden="true"]') as Element);
	const before = getComputedStyle(check).stroke;
	slowDraw(container);

	await userEvent.click(page.getByText('Toggle'));
	const animations = sceneTransitions(container);
	seekAll(animations, 0);
	const first = getComputedStyle(check).stroke;
	seekAll(animations, 500);

	expect(first).not.toBe(before);
	expect(getComputedStyle(check).stroke).toBe(first);
});

test('reduced motion removes the draw transition', async () => {
	await emulateReducedMotion(true);

	try {
		const { container } = render(
			<CheckboxRoot defaultSelected>
				<Parts label="Checked" />
			</CheckboxRoot>,
		);
		const { check, dash } = markPaths(container.querySelector('[aria-hidden="true"]') as Element);

		expect(getComputedStyle(check).transitionDuration).toBe('0s');
		expect(getComputedStyle(dash).transitionDuration).toBe('0s');
		expect(dashOffset(check)).toBe(0);
	} finally {
		await emulateReducedMotion(false);
	}
});

test('reduced motion shows a switch between marks and an uncheck at once, with no waits', async () => {
	await emulateReducedMotion(true);

	try {
		const { container } = render(
			<>
				<Switching initial="checked" next="mixed" />
				<CheckboxRoot defaultSelected>
					<Parts label="Toggle" />
				</CheckboxRoot>
			</>,
		);
		const [switching, toggle] = [...container.querySelectorAll('[aria-hidden="true"]')];
		if (!switching || !toggle) throw new Error('Expected two indicators.');
		const delays = (element: Element) => getComputedStyle(element).transitionDelay.split(', ');
		const durations = (element: Element) =>
			getComputedStyle(element).transitionDuration.split(', ');
		const allZero = (values: ReadonlyArray<string>) => values.every((value) => value === '0s');

		await userEvent.click(page.getByRole('button', { name: 'Switch' }));
		await userEvent.click(page.getByText('Toggle'));

		for (const path of Object.values(markPaths(switching))) {
			expect(allZero(delays(path))).toBe(true);
			expect(allZero(durations(path))).toBe(true);
		}
		expect(allZero(delays(toggle))).toBe(true);
		expect(allZero(delays(markPaths(toggle).check))).toBe(true);
		expect(dashOffset(markPaths(switching).dash)).toBe(0);
		expect(dashOffset(markPaths(switching).check)).toBe(1);
	} finally {
		await emulateReducedMotion(false);
	}
});

test('the mark stays visible in forced colours', async () => {
	await emulateForcedColors('active');

	try {
		const { container } = render(
			<>
				<CheckboxRoot defaultSelected>
					<Parts label="Checked" />
				</CheckboxRoot>
				<CheckboxRoot isIndeterminate>
					<Parts label="Mixed" />
				</CheckboxRoot>
				<CheckboxRoot defaultSelected isDisabled>
					<Parts label="Disabled" />
				</CheckboxRoot>
				<CheckboxRoot defaultSelected isInvalid>
					<Parts label="Invalid" />
				</CheckboxRoot>
			</>,
		);
		const [checked, mixed, disabled, invalid] = [
			...container.querySelectorAll('[aria-hidden="true"]'),
		];
		if (!checked || !mixed || !disabled || !invalid) throw new Error('Expected four indicators.');
		const colorOf = (color: string): string => {
			const probe = container.appendChild(document.createElement('span'));
			probe.style.color = color;
			const resolved = getComputedStyle(probe).color;
			probe.remove();
			return resolved;
		};
		const highlight = colorOf('Highlight');
		const highlightText = colorOf('HighlightText');
		const labelOf = (indicator: Element) => indicator.closest('label') as HTMLElement;

		await expect.poll(() => dashOffset(markPaths(checked).check)).toBe(0);
		// Rest, hovered, and pressed, for a plain and an invalid checked box, keep the Highlight fill.
		for (const indicator of [checked, invalid]) {
			for (const state of [null, 'data-hovered', 'data-pressed'] as const) {
				if (state) labelOf(indicator).setAttribute(state, 'true');
				const style = getComputedStyle(indicator);
				expect(style.backgroundColor).toBe(highlight);
				expect(style.borderTopColor).toBe(highlight);
				expect(getComputedStyle(markPaths(indicator).check).stroke).toBe(highlightText);
				if (state) labelOf(indicator).removeAttribute(state);
			}
		}
		for (const state of ['data-hovered', 'data-pressed'])
			labelOf(mixed).setAttribute(state, 'true');
		expect(getComputedStyle(mixed).backgroundColor).toBe(highlight);
		expect(getComputedStyle(markPaths(mixed).dash).stroke).toBe(highlightText);
		expect(dashOffset(markPaths(mixed).dash)).toBe(0);
		// A disabled box reads as disabled, not as a Highlight fill.
		expect(getComputedStyle(disabled).backgroundColor).toBe(colorOf('Canvas'));
		expect(getComputedStyle(markPaths(disabled).check).stroke).toBe(colorOf('GrayText'));
	} finally {
		await emulateForcedColors('none');
	}
});
