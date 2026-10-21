import type { ComboboxControlProps } from '@luke-ui/react/primitives/combobox';
import {
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
import { expectFillKeepsTextAndBorder, fillAsPasswordManager } from '../../test-utils/autofill.js';
import { render, visualAppearances } from '../../test-utils/render.js';
import {
	captureVisualAppearance,
	emulateForcedColors,
	freezeMotionForCapture,
	Stack,
} from '../../test-utils/visual.js';

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

// Layout is the contract: the input is the control's first child, so only its inline-start
// corners touch the control's curved border and take its inner radius.
for (const size of ['small', 'medium'] as const) {
	test(`ComboboxInput stays inside the ${size} control border`, () => {
		render(
			<ComboboxRoot defaultItems={items} size={size}>
				<Field label="Country">
					<ComboboxControl>
						<ComboboxInput />
						<ComboboxTrigger aria-label="Toggle options" />
					</ComboboxControl>
				</Field>
			</ComboboxRoot>,
		);
		const element = page.getByRole('combobox', { name: 'Country' }).element();
		const box = element.getBoundingClientRect();
		const outer = controlElement().getBoundingClientRect();
		expect(box.top).toBe(outer.top + 1);
		expect(box.bottom).toBe(outer.bottom - 1);
		const outerRadius = Number.parseFloat(getComputedStyle(controlElement()).borderTopLeftRadius);
		const inner = `${outerRadius - 1}px`;
		const style = getComputedStyle(element);

		expect(style.borderStartStartRadius).toBe(inner);
		expect(style.borderEndStartRadius).toBe(inner);
		expect(style.borderStartEndRadius).toBe('0px');
		expect(style.borderEndEndRadius).toBe('0px');
	});
}

function FilledComboboxScene() {
	return (
		<Stack>
			{(['small', 'medium'] as const).map((size) => (
				<Stack key={size}>
					{(['default', 'invalid', 'read-only', 'disabled'] as const).map((state) => (
						<ComboboxRoot
							key={state}
							defaultInputValue="Autofilled text"
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

for (const source of ['password-manager', 'native'] as const) {
	for (const forcedColors of ['none', 'active'] as const) {
		test(`a ComboboxInput filled by ${source} keeps its text and border, forced colours ${forcedColors}`, async () => {
			await emulateForcedColors(forcedColors);
			const restoreMotion = await freezeMotionForCapture();
			try {
				const { locator } = render(<FilledComboboxScene />);
				await expectFillKeepsTextAndBorder(comboboxInputs(locator), source);
			} finally {
				await restoreMotion();
				await emulateForcedColors('none');
			}
		});
	}
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

test('filled kitchen sink', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(<FilledComboboxScene />, { appearance });
		fillAsPasswordManager(comboboxInputs(locator), appearance.mode);
		await captureVisualAppearance(locator, 'combobox/filled-kitchen-sink', appearance);
	}
});

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
