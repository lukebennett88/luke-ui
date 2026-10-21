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
import { render } from '../../test-utils/render.js';

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
test('ComboboxInput rounds only the corners that touch the control', () => {
	render(
		<ComboboxRoot defaultItems={items}>
			<Field label="Country">
				<ComboboxControl>
					<ComboboxInput />
					<ComboboxTrigger aria-label="Toggle options" />
				</ComboboxControl>
			</Field>
		</ComboboxRoot>,
	);
	const element = page.getByRole('combobox', { name: 'Country' }).element();
	const outerRadius = Number.parseFloat(getComputedStyle(controlElement()).borderTopLeftRadius);
	const inner = `${outerRadius - 1}px`;
	const style = getComputedStyle(element);

	expect(style.borderStartStartRadius).toBe(inner);
	expect(style.borderEndStartRadius).toBe(inner);
	expect(style.borderStartEndRadius).toBe('0px');
	expect(style.borderEndEndRadius).toBe('0px');
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
