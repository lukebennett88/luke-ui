import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import {
	InputGroup,
	InputGroupInput,
	InputGroupPrefix,
	InputGroupSuffix,
} from '@luke-ui/react/primitives/input-group';
import { TextField } from '@luke-ui/react/text-field';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { getDescribedText } from '../test-utils/get-described-text.js';
import { render, visualAppearances } from '../test-utils/render.js';
import {
	captureVisual,
	captureVisualAppearance,
	emulateForcedColors,
	focusViaKeyboard,
	Stack,
} from '../test-utils/visual.js';

/**
 * The representative scene, shared by the axe check and the visual capture so
 * both cover the same surface.
 */
function TextFieldScene() {
	return (
		<Stack>
			<TextField
				description="Small control size."
				label="Small"
				name="small"
				placeholder="Small"
				size="small"
			/>
			<TextField
				description="Medium control size."
				label="Medium"
				name="medium"
				placeholder="Medium"
				size="medium"
			/>
			<TextField label="Amount" name="amount" placeholder="0.00" prefix="$" />
			<TextField label="Total" name="total" placeholder="0.00" suffix="USD" />
			<TextField defaultValue="Unavailable" isDisabled label="Disabled" name="disabled" />
			<TextField defaultValue="Read only" isReadOnly label="Read-only" name="readonly" />
			<TextField
				defaultValue="nope"
				errorMessage="Please enter a valid email."
				label="Invalid"
				name="invalid"
			/>
			<TextField
				defaultValue="nope"
				errorMessage="Please enter a valid email."
				label="Invalid small"
				name="invalid-small"
				size="small"
			/>
			<TextField
				defaultValue="0.00"
				errorMessage="Enter a valid amount."
				label="Invalid with a suffix"
				name="invalid-suffix"
				placeholder="0.00"
				suffix="USD"
			/>
			<Stack width="14rem">
				<TextField
					label="Search"
					name="prefix-multiple-elements"
					placeholder="Search…"
					prefix={
						<>
							<Icon name="search" />
							<Icon name="check" />
						</>
					}
				/>
				<TextField
					label="Amount with icons"
					name="suffix-multiple-elements"
					placeholder="0.00"
					suffix={
						<>
							<Icon name="check" />
							<Icon name="close" />
						</>
					}
				/>
			</Stack>
			<Stack>
				<InputGroup>
					<InputGroupPrefix>$</InputGroupPrefix>
					<InputGroupInput aria-label="Amount" defaultValue="1250.00" inputMode="decimal" />
					<InputGroupSuffix>USD</InputGroupSuffix>
				</InputGroup>
				<InputGroup>
					<InputGroupInput aria-label="Workspace" defaultValue="acme" />
					<InputGroupSuffix>.luke-ui.dev</InputGroupSuffix>
				</InputGroup>
				<InputGroup>
					<InputGroupPrefix>
						<Icon name="search" />
					</InputGroupPrefix>
					<InputGroupInput aria-label="Search input group" defaultValue="invoices" />
					<InputGroupSuffix>
						<Button size="small">Clear</Button>
					</InputGroupSuffix>
				</InputGroup>
				<InputGroup isInvalid size="small">
					<InputGroupPrefix>$</InputGroupPrefix>
					<InputGroupInput aria-label="Refund" defaultValue="-1" inputMode="decimal" />
					<InputGroupSuffix>USD</InputGroupSuffix>
				</InputGroup>
			</Stack>
		</Stack>
	);
}

// RAC moves `id` onto the control, so it lands on a different element than
// `className` and `data-*`, which stay on the TextField root.
test('TextField forwards className and data attributes to its root, and id to the DOM', () => {
	const { container } = render(
		<TextField
			className="forwarded-class"
			data-forwarded="true"
			description="Helpful context"
			id="forwarded-id"
			label="Name"
		/>,
	);
	const root = container.firstElementChild;
	if (!(root instanceof HTMLElement)) throw new Error('Expected a TextField root.');

	expect(root).toHaveClass('forwarded-class');
	expect(root).toHaveAttribute('data-forwarded', 'true');
	expect(container.querySelector('#forwarded-id')).not.toBeNull();
});

test('TextField resolves inputRef to the input, participates in a form, and fires onBlur', () => {
	const inputRef = createRef<HTMLInputElement>();
	let blurred = false;
	const { container, locator } = render(
		<TextField
			description="Helpful context"
			inputRef={inputRef}
			label="Name"
			name="full-name"
			onBlur={() => {
				blurred = true;
			}}
		/>,
	);
	const control = locator.getByRole('textbox', { name: 'Name' }).element();

	expect(inputRef.current).toBe(control);
	// The description is wired to the input, not just rendered beside it.
	expect(control).toHaveAttribute('aria-describedby');

	const form = document.createElement('form');
	container.replaceWith(form);
	form.append(container);
	const namedControl = form.elements.namedItem('full-name');
	if (!(namedControl instanceof HTMLInputElement)) {
		throw new Error('Expected a native input named full-name.');
	}
	namedControl.value = 'Luke';
	expect(new FormData(form).get('full-name')).toBe('Luke');

	if (!(control instanceof HTMLElement)) throw new Error('Expected an HTML control.');
	control.focus();
	control.blur();
	expect(blurred).toBe(true);

	form.remove();
});

// React Aria types `inputRef` as a ref object. Luke UI widens it to accept a
// callback so React Hook Form's `field.ref` works without an adapter.
test('TextField resolves a callback inputRef to the input', () => {
	const resolved: Array<HTMLElement | null> = [];
	const { locator } = render(
		<TextField
			inputRef={(node: HTMLElement | null) => {
				resolved.push(node);
			}}
			label="Name"
			name="full-name"
		/>,
	);
	const control = locator.getByRole('textbox', { name: 'Name' }).element();

	expect(resolved.at(-1)).toBe(control);
});

test('typing in a TextField reports each value through onChange', async () => {
	let value = '';
	const { locator, user } = render(<TextField label="Name" onChange={(next) => (value = next)} />);
	const input = locator.getByRole('textbox', { name: 'Name' });

	await user.type(input, 'Luke');
	expect(value).toBe('Luke');
});

test('the TextField scene has no axe violations', async () => {
	const { container } = render(<TextFieldScene />);

	await expectNoAxeViolations(container);
});

/**
 * The input is always a direct child of the styled group (prefix and suffix are
 * siblings, not wrappers), so `parentElement` is the group regardless of what else
 * the composition contains. The group carries `role="presentation"` under a
 * `TextField` (`RacTextField` supplies that through `GroupContext` when the field has
 * its own external `<label>`), so it cannot be found via `[role="group"]`.
 */
function groupFor(name: string): HTMLElement {
	const group = page.getByRole('textbox', { name }).element().parentElement;
	if (group == null) throw new Error(`Expected a text input group for "${name}".`);
	return group;
}

/**
 * The invalid indicator `InputGroup` renders itself, if it is present. Matched by the
 * public `exclamationTriangle` icon, not a generated recipe class. A prefix or suffix
 * can hold an `<svg>` of its own.
 */
function indicatorFor(name: string): SVGSVGElement | null {
	const glyph = groupFor(name).querySelector('use[href$="#exclamationTriangle"]');
	return glyph?.closest('svg') ?? null;
}

// The primitive renders the control itself, so it takes a plain `ref`. Both ref
// shapes are covered: React Hook Form hands out a callback ref, so the callback
// arm is the one that decides whether the component is usable with it at all.
test('InputGroupInput resolves object and callback refs to the input element', () => {
	const objectRef = createRef<HTMLInputElement>();
	const callbackResolved: Array<HTMLInputElement | null> = [];
	render(
		<>
			<InputGroup>
				<InputGroupInput aria-label="Amount object" ref={objectRef} />
			</InputGroup>
			<InputGroup>
				<InputGroupInput
					aria-label="Amount callback"
					ref={(node) => {
						callbackResolved.push(node);
					}}
				/>
			</InputGroup>
		</>,
	);

	const objectInput = page.getByRole('textbox', { name: 'Amount object' });
	const callbackInput = page.getByRole('textbox', { name: 'Amount callback' });

	expect(objectRef.current).toBe(objectInput.element());
	expect(callbackResolved.at(-1)).toBe(callbackInput.element());
});

// The shared invalid selector must not match `:has(:invalid)`: that matches a required,
// empty input from first render — before any interaction or submit — while
// `aria-invalid` stays null, painting an untouched required field invalid even
// though assistive technology is told it's fine. Guard that the group only picks
// up the invalid treatment once React Aria has recorded a real validation
// failure. `errorMessage={false}` must not suppress that cue. The in-control
// icon is the invalid cue Luke UI owns.
test('a required field is painted invalid only after a real submit fails validation', async () => {
	// A plain `<form>`, not react-aria-components' `Form`: the latter fails to
	// resolve in this browser test environment. React Aria's own field
	// validation listens for the browser's native `invalid` event regardless of
	// an ancestor `Form`, so a native submit is enough to trigger it.
	render(
		<form>
			<TextField isRequired label="Email" name="email" />
			<TextField errorMessage={false} isRequired label="Username" name="username" />
			<button type="submit">Submit</button>
		</form>,
	);

	expect(indicatorFor('Email')).toBe(null);
	expect(indicatorFor('Username')).toBe(null);

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.poll(() => indicatorFor('Email')).not.toBe(null);
	await expect.poll(() => indicatorFor('Username')).not.toBe(null);
	await expect
		.poll(() => getDescribedText(page.getByRole('textbox', { name: 'Username' }).element()).length)
		.toBeGreaterThan(0);
});

test('an errorMessage marks the field invalid and renders its markup', () => {
	render(
		<TextField
			errorMessage={
				<>
					See the <strong>terms</strong> for details.
				</>
			}
			label="Email"
			name="email"
		/>,
	);

	expect(indicatorFor('Email')).not.toBe(null);
	expect(page.getByText('terms').element().tagName).toBe('STRONG');
});

test('kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<TextFieldScene />, { appearance });
		await captureVisualAppearance(locator, 'text-field/kitchen-sink', appearance);
	}
});

test('interactive states', { tags: ['visual'] }, async () => {
	const { locator } = render(<TextField label="Focus me" name="focus" placeholder="Type here" />);
	const input = page.getByRole('textbox', { name: 'Focus me' });

	await userEvent.hover(input);
	await captureVisual(locator, 'text-field/hover');
	await userEvent.unhover(input);
	await focusViaKeyboard(input);
	await captureVisual(locator, 'text-field/focus-visible');
});

test('forced-colors states', { tags: ['visual'] }, async () => {
	await emulateForcedColors('active');

	try {
		const { locator } = render(
			<Stack>
				<TextField label="Interactive" name="interactive" placeholder="Type here" />
				<TextField defaultValue="Unavailable" isDisabled label="Disabled" name="disabled" />
				<TextField defaultValue="Read only" isReadOnly label="Read-only" name="readonly" />
				<TextField
					defaultValue="nope"
					errorMessage="Please enter a valid email."
					label="Invalid"
					name="invalid"
				/>
			</Stack>,
		);
		const input = page.getByRole('textbox', { name: 'Interactive' });

		await captureVisual(locator, 'text-field/forced-colors-resting-states');
		await userEvent.hover(input);
		await captureVisual(locator, 'text-field/forced-colors-hover');
		await userEvent.unhover(input);
		await focusViaKeyboard(input);
		await captureVisual(locator, 'text-field/forced-colors-focus-visible');
	} finally {
		await emulateForcedColors('none');
	}
});
