import type { ComboboxControlProps } from '@luke-ui/react/primitives/combobox';
import {
	ComboboxControl,
	ComboboxInput,
	ComboboxItem,
	ComboboxListBox,
	ComboboxPopover,
	ComboboxRoot,
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
