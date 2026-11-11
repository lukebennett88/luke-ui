import type { ComboboxControlProps } from '@luke-ui/react/primitives/combobox';
import {
	ComboboxClearButton,
	ComboboxControl,
	ComboboxInput,
	ComboboxItem,
	ComboboxListBox,
	ComboboxPopover,
	ComboboxRoot,
	ComboboxTrigger,
} from '@luke-ui/react/primitives/combobox';
import { Field } from '@luke-ui/react/primitives/field';
import { createRef } from 'react';
import { expect, test, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/context';
import type { Locator } from 'vite-plus/test/context';
import { expectRenderUnchanged, fillInputs } from '../../test-utils/autofill.js';
import { render } from '../../test-utils/render.js';
import { emulateForcedColors, freezeMotionForCapture, Stack } from '../../test-utils/visual.js';

const items = [{ id: 'au', label: 'Australia' }];

function PopoverCombobox({ controlRef }: { controlRef: ComboboxControlProps['ref'] }) {
	return (
		<ComboboxRoot defaultItems={items}>
			<Field label="Country">
				<ComboboxControl ref={controlRef}>
					<ComboboxInput />
				</ComboboxControl>
				<ComboboxPopover>
					<ComboboxListBox<(typeof items)[number]>>
						{(item) => <ComboboxItem>{item.label}</ComboboxItem>}
					</ComboboxListBox>
				</ComboboxPopover>
			</Field>
		</ComboboxRoot>
	);
}

function controlElement() {
	const control = page
		.getByRole('combobox', { name: 'Country' })
		.element()
		.closest('[role="group"]');
	if (control === null) throw new Error('Expected the combobox control group.');
	return control;
}

function FilledComboboxScene() {
	return (
		<Stack>
			{(['small', 'medium'] as const).map((size) => (
				<Stack key={size}>
					{(['default', 'invalid', 'read-only', 'disabled'] as const).map((state) => (
						<ComboboxRoot
							key={state}
							defaultItems={items}
							isDisabled={state === 'disabled'}
							isInvalid={state === 'invalid'}
							isReadOnly={state === 'read-only'}
							size={size}
						>
							<Field label={`${size} ${state}`}>
								<ComboboxControl>
									<ComboboxInput />
									<ComboboxTrigger aria-label="Toggle options" />
								</ComboboxControl>
							</Field>
						</ComboboxRoot>
					))}
				</Stack>
			))}
		</Stack>
	);
}

function comboboxInputs(locator: Locator): Array<HTMLInputElement> {
	return locator
		.getByRole('combobox')
		.elements()
		.map((target) => {
			if (!(target instanceof HTMLInputElement)) throw new Error('Expected an input.');
			return target;
		});
}

// The inputs are empty, so a fill clipped to the text paints nothing. Anything that changes is the
// fill showing over the control.
for (const source of ['password-manager', 'native'] as const) {
	for (const forcedColors of ['none', 'active'] as const) {
		test(`a ComboboxInput filled by ${source} paints nothing over its control, forced colours ${forcedColors}`, async () => {
			await emulateForcedColors(forcedColors);
			const restoreMotion = await freezeMotionForCapture();
			try {
				const { locator } = render(<FilledComboboxScene />);
				await expectRenderUnchanged(locator.element(), () =>
					fillInputs(comboboxInputs(locator), source),
				);
			} finally {
				await restoreMotion();
				await emulateForcedColors('none');
			}
		});
	}
}

for (const source of ['password-manager', 'native'] as const) {
	test(`a ComboboxInput filled by ${source} keeps its text colour`, async () => {
		const { locator } = render(<FilledComboboxScene />);
		const inputs = comboboxInputs(locator);
		const textFill = () => inputs.map((field) => getComputedStyle(field).webkitTextFillColor);
		const unfilled = textFill();
		await fillInputs(inputs, source);

		expect(textFill()).toEqual(unfilled);
	});
}

test('a disabled ComboboxInput that is not filled keeps a consumer text colour', () => {
	const sheet = document.createElement('style');
	sheet.textContent = '.consumer-colour { color: rgb(4, 5, 6); }';
	document.head.append(sheet);
	try {
		render(
			<>
				<ComboboxRoot defaultItems={items} isDisabled>
					<Field label="Class colour">
						<ComboboxControl>
							<ComboboxInput className="consumer-colour" />
						</ComboboxControl>
					</Field>
				</ComboboxRoot>
				<ComboboxRoot defaultItems={items} isDisabled>
					<Field label="Style colour">
						<ComboboxControl>
							<ComboboxInput style={{ color: 'rgb(1, 2, 3)' }} />
						</ComboboxControl>
					</Field>
				</ComboboxRoot>
			</>,
		);
		const textFill = (name: string) =>
			getComputedStyle(page.getByRole('combobox', { name }).element()).webkitTextFillColor;

		// The text paints in the text fill colour, which follows `color` unless a rule sets it.
		expect(textFill('Class colour')).toBe('rgb(4, 5, 6)');
		expect(textFill('Style colour')).toBe('rgb(1, 2, 3)');
	} finally {
		sheet.remove();
	}
});

// A password manager's fill leaves `color` alone, unlike browser autofill, which forces it.
for (const disabled of [false, true]) {
	test(`a${disabled ? ' disabled' : ''} ComboboxInput keeps a consumer text colour when a password manager fills it`, async () => {
		const sheet = document.createElement('style');
		sheet.textContent = '.consumer-colour { color: rgb(4, 5, 6); }';
		document.head.append(sheet);
		try {
			render(
				<>
					<ComboboxRoot defaultItems={items} isDisabled={disabled}>
						<Field label="Class colour">
							<ComboboxControl>
								<ComboboxInput className="consumer-colour" />
							</ComboboxControl>
						</Field>
					</ComboboxRoot>
					<ComboboxRoot defaultItems={items} isDisabled={disabled}>
						<Field label="Style colour">
							<ComboboxControl>
								<ComboboxInput style={{ color: 'rgb(1, 2, 3)' }} />
							</ComboboxControl>
						</Field>
					</ComboboxRoot>
				</>,
			);
			const combobox = (name: string) => {
				const element = page.getByRole('combobox', { name }).element();
				if (!(element instanceof HTMLInputElement)) throw new Error('Expected an input.');
				return element;
			};
			await fillInputs([combobox('Class colour'), combobox('Style colour')], 'password-manager');

			expect(getComputedStyle(combobox('Class colour')).webkitTextFillColor).toBe('rgb(4, 5, 6)');
			expect(getComputedStyle(combobox('Style colour')).webkitTextFillColor).toBe('rgb(1, 2, 3)');
		} finally {
			sheet.remove();
		}
	});
}

test('ComboboxControl forwards a callback ref to its group and clears it on unmount', () => {
	const ref = vi.fn<(element: HTMLDivElement | null) => void>();
	const { unmount } = render(<PopoverCombobox controlRef={ref} />);

	expect(ref).toHaveBeenLastCalledWith(controlElement());

	unmount();
	expect(ref).toHaveBeenLastCalledWith(null);
});

test('ComboboxControl forwards an object ref to its group and clears it on unmount', () => {
	const ref = createRef<HTMLDivElement>();
	const { unmount } = render(<PopoverCombobox controlRef={ref} />);

	expect(ref.current).toBe(controlElement());

	unmount();
	expect(ref.current).toBeNull();
});

test('ComboboxControl runs the cleanup a callback ref returns', () => {
	const cleanup = vi.fn<() => void>();
	const ref = vi.fn<(element: HTMLDivElement | null) => () => void>(() => cleanup);
	const { unmount } = render(<PopoverCombobox controlRef={ref} />);

	expect(ref).toHaveBeenLastCalledWith(controlElement());

	unmount();
	expect(cleanup).toHaveBeenCalled();
	// React calls a callback ref that returns a cleanup with `null` only if it returns nothing.
	expect(ref).not.toHaveBeenCalledWith(null);
});

function ActionScene({ size }: { size: 'medium' | 'small' }) {
	return (
		<ComboboxRoot defaultItems={items} defaultValue="au" size={size}>
			<Field label={`${size} country`}>
				<ComboboxControl>
					<ComboboxInput />
					<ComboboxClearButton aria-label={`Clear ${size}`} />
					<ComboboxTrigger aria-label={`Toggle ${size}`} />
				</ComboboxControl>
			</Field>
		</ComboboxRoot>
	);
}

function actionButtons(size: 'medium' | 'small') {
	return {
		clearButton: page.getByRole('button', { name: new RegExp(`Clear ${size}`) }).element(),
		trigger: page.getByRole('button', { name: new RegExp(`Toggle ${size}`) }).element(),
	};
}

/** Position of the first rule that targets `className`, in stylesheet source order. */
function ruleIndex(className: string): number {
	let index = 0;
	let found = -1;
	const visit = (rules: CSSRuleList) => {
		for (const rule of Array.from(rules)) {
			if (found !== -1) return;
			if (rule instanceof CSSStyleRule && rule.selectorText.includes(`.${className}`)) {
				found = index;
				return;
			}
			index += 1;
			if ('cssRules' in rule) visit(rule.cssRules as CSSRuleList);
		}
	};
	for (const sheet of Array.from(document.styleSheets)) visit(sheet.cssRules);
	return found;
}

const actionSizes = { medium: '28px', small: '24px' } as const;

for (const size of ['medium', 'small'] as const) {
	test(`the ComboboxTrigger and ComboboxClearButton are ${actionSizes[size]} square with no inline padding at ${size} size`, () => {
		render(<ActionScene size={size} />);
		const { clearButton, trigger } = actionButtons(size);

		for (const button of [clearButton, trigger]) {
			const style = getComputedStyle(button);
			expect(style.blockSize).toBe(actionSizes[size]);
			expect(style.inlineSize).toBe(actionSizes[size]);
			expect(style.paddingInlineStart).toBe('0px');
			expect(style.paddingInlineEnd).toBe('0px');
		}
	});

	test(`only the ComboboxTrigger has inline margins at ${size} size`, () => {
		render(<ActionScene size={size} />);
		const { clearButton, trigger } = actionButtons(size);

		expect(getComputedStyle(trigger).marginInlineStart).toBe('4px');
		expect(getComputedStyle(trigger).marginInlineEnd).toBe('4px');
		expect(getComputedStyle(clearButton).marginInlineStart).toBe('0px');
		expect(getComputedStyle(clearButton).marginInlineEnd).toBe('0px');
	});

	test(`the ComboboxTrigger and ComboboxClearButton share their action styles at ${size} size`, () => {
		render(<ActionScene size={size} />);
		const { clearButton, trigger } = actionButtons(size);
		const clearStyle = getComputedStyle(clearButton);
		const triggerStyle = getComputedStyle(trigger);

		for (const property of [
			'alignItems',
			'borderRadius',
			'borderStyle',
			'color',
			'display',
			'flexShrink',
			'justifyContent',
			'minBlockSize',
			'minInlineSize',
			'paddingBlockStart',
			'transitionProperty',
		] as const) {
			expect([property, clearStyle[property]]).toEqual([property, triggerStyle[property]]);
		}
	});
}

test('ComboboxTrigger and ComboboxClearButton base styles are emitted before their size styles', () => {
	render(
		<>
			<ActionScene size="medium" />
			<ActionScene size="small" />
		</>,
	);
	const medium = actionButtons('medium');
	const small = actionButtons('small');

	for (const slot of ['trigger', 'clearButton'] as const) {
		const mediumList = Array.from(medium[slot].classList);
		const smallList = new Set(small[slot].classList);
		const baseClasses = mediumList.filter((name) => smallList.has(name));
		// The classes only the medium button has are its size classes.
		const sizeClasses = mediumList.filter((name) => !smallList.has(name));
		const baseIndexes = baseClasses.map(ruleIndex).filter((index) => index !== -1);
		const sizeIndexes = sizeClasses.map(ruleIndex).filter((index) => index !== -1);

		expect(baseIndexes.length, `${slot} has a base rule`).toBeGreaterThan(0);
		expect(sizeIndexes.length, `${slot} has a size rule`).toBeGreaterThan(0);
		expect(Math.max(...baseIndexes), `${slot} base precedes size`).toBeLessThan(
			Math.min(...sizeIndexes),
		);
	}
});
