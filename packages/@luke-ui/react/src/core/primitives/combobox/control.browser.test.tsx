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
import {
	expectAutofillBackgroundHidden,
	expectSameInputText,
	forceAutofill,
	inputTextPixels,
} from '../../test-utils/autofill.js';
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

for (const source of ['password-manager', 'native'] as const) {
	for (const appearance of visualAppearances) {
		for (const forcedColors of ['none', 'active'] as const) {
			test(
				`filled comboboxes (${source}): ${appearance.theme} ${appearance.mode}, forced colors ${forcedColors}`,
				{ tags: ['visual'] },
				async () => {
					await emulateForcedColors(forcedColors);
					const restoreMotion = await freezeMotionForCapture();
					try {
						const { locator } = render(<FilledComboboxScene />, { appearance });
						const inputs = locator
							.getByRole('combobox')
							.elements()
							.map((target) => {
								if (!(target instanceof HTMLInputElement)) throw new Error('Expected an input.');
								return target;
							});
						const references = new Map<HTMLInputElement, Uint8ClampedArray>();
						for (const target of inputs) references.set(target, await inputTextPixels(target));
						if (source === 'native') await forceAutofill(inputs);
						for (const target of inputs) {
							const text = references.get(target);
							if (text === undefined) throw new Error('Expected reference text pixels.');
							if (source === 'password-manager') {
								target.setAttribute('data-com-onepassword-filled', appearance.mode);
							}
							expectSameInputText(
								await inputTextPixels(target),
								text,
								target.getAttribute('aria-label') ??
									target.getAttribute('aria-labelledby') ??
									'Input',
							);
							const control = target.closest('[role="group"]');
							if (control === null) throw new Error('Expected a control.');
							await expectAutofillBackgroundHidden(target, control);
							target.style.setProperty('background-color', 'rgb(160, 200, 255)', 'important');
						}
						await captureVisualAppearance(
							locator,
							`combobox/filled-${source}-${forcedColors}`,
							appearance,
						);
					} finally {
						await restoreMotion();
						await emulateForcedColors('none');
					}
				},
			);
		}
	}
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
