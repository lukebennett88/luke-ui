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
