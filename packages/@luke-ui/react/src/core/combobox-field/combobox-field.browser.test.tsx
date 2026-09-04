import * as stylex from '@stylexjs/stylex';
import { createRef } from 'react';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { testConformance, testIntegration } from '../conformance/helpers.js';
import { ComboboxInputGroup } from '../primitives/combobox/input-group.js';
import { ComboboxInput } from '../primitives/combobox/input.js';
import { ComboboxItem } from '../primitives/combobox/item.js';
import { ComboboxListBox } from '../primitives/combobox/listbox.js';
import { ComboboxRoot } from '../primitives/combobox/root.js';
import { comboboxSectionScopeAttribute } from '../primitives/combobox/section-scope.js';
import { ComboboxSection } from '../primitives/combobox/section.js';
import { mockScreenWidth } from '../test-utils/mock-screen-width.js';
import { render } from '../test-utils/render.js';
import { waitForOverlayEnter } from '../test-utils/wait-for-overlay-enter.js';
import { ComboboxField } from './combobox-field.js';

type CountryItem = {
	id: string;
	label: string;
};

const countryItems: Array<CountryItem> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
];

const renderCountryItem = (item: CountryItem) => <ComboboxItem>{item.label}</ComboboxItem>;

testConformance({
	path: 'combobox-field',
	assertAssociation: (result) => {
		// oxlint-disable-next-line vitest/no-standalone-expect
		expect(result.locator.getByRole('combobox', { name: 'Country' }).element()).toHaveAttribute(
			'aria-describedby',
		);
	},
	assertName: (result) => {
		// React Aria uses a hidden input for the selected form value.
		const hiddenInput = result.container.querySelector(
			'input[type="hidden"][name="conformance-field"]',
		);
		// oxlint-disable-next-line vitest/no-standalone-expect
		expect(hiddenInput).not.toBeNull();
	},
	getControl: (result) => {
		const control = result.locator.getByRole('combobox', { name: 'Country' }).element();
		if (!(control instanceof HTMLElement)) throw new Error('Expected a combobox input.');
		return control;
	},
	render: (props = {}) => {
		return render(
			<ComboboxField<CountryItem>
				{...props}
				defaultItems={countryItems}
				description="Helpful context"
				label="Country"
			>
				{renderCountryItem}
			</ComboboxField>,
		);
	},
});

testIntegration('combobox-field', async () => {
	const { locator, user } = render(
		<ComboboxField defaultItems={countryItems} label="Country">
			{renderCountryItem}
		</ComboboxField>,
	);
	const input = locator.getByRole('combobox', { name: 'Country' });

	await user.click(input);

	const option = page.getByRole('option', { name: 'Australia' });
	// Clicking an option scrolls it into view first, and React Aria closes the popover on a
	// document scroll. While the popover is still entering, that close lands before the click and
	// detaches the option.
	const popover = page.getByRole('listbox').element().parentElement;
	if (popover == null) throw new Error('Expected the popover element.');
	await waitForOverlayEnter(popover);

	await user.click(option);
	// oxlint-disable-next-line vitest/no-standalone-expect
	expect(page.getByRole('combobox', { name: 'Country' })).toHaveValue('Australia');
});

test('ComboboxField uses a mobile modal to search and select an option', async () => {
	const restoreScreenWidth = mockScreenWidth(390);
	try {
		const inputRef = createRef<HTMLInputElement>();
		const { container } = render(
			<form aria-label="Country form" style={{ inlineSize: 'max-content' }}>
				<ComboboxField
					defaultItems={countryItems}
					defaultValue="au"
					inputRef={inputRef}
					label="Country"
					name="country"
				>
					{renderCountryItem}
				</ComboboxField>
			</form>,
		);
		const form = container.querySelector('form');
		if (form == null) throw new Error('Expected the form element.');

		const trigger = page.getByRole('button', { name: 'Country' });
		const dialog = page.getByRole('dialog');
		const searchbox = page.getByRole('searchbox', { name: 'Country' });

		// The mobile composition renders a value button where the desktop one renders a text input.
		expect(inputRef.current).toBeNull();

		await userEvent.click(trigger);
		await expect.element(dialog).toBeVisible();
		expect(inputRef.current).toBe(searchbox.element());

		const modal = dialog.element().parentElement;
		const overlay = modal?.parentElement;
		if (modal == null || overlay == null) {
			throw new Error('Expected the mobile modal structure.');
		}

		// Measuring the tray only means anything once it has stopped sliding up.
		await waitForOverlayEnter(overlay);

		// RAC's own `Modal` sets `--visual-viewport-height` from `useViewportSize`, so overriding it
		// stands in for the keyboard shrinking the visual viewport. `mobileModal` must take the shrunk
		// amount off `blockSize` and spend it on `paddingBlockEnd`, so the sheet keeps its content above
		// the keyboard. Every expectation is measured at runtime, so none pins a resolved spacing value.
		const restingViewportHeight = window.innerHeight;
		const keyboardInset = Math.round(restingViewportHeight / 2);
		overlay.style.setProperty('--visual-viewport-height', `${restingViewportHeight}px`);
		const trayTop = modal.getBoundingClientRect().top;
		const restingBlockSize = Number.parseFloat(getComputedStyle(modal).height);
		const restingPaddingBlockEnd = Number.parseFloat(getComputedStyle(modal).paddingBottom);
		// The tray's content box runs from its top offset to the bottom of the visual viewport.
		expect(restingBlockSize + trayTop).toBeCloseTo(restingViewportHeight, 1);

		overlay.style.setProperty(
			'--visual-viewport-height',
			`${restingViewportHeight - keyboardInset}px`,
		);
		expect(Number.parseFloat(getComputedStyle(modal).height) + trayTop).toBeCloseTo(
			restingViewportHeight - keyboardInset,
			1,
		);
		expect(Number.parseFloat(getComputedStyle(modal).paddingBottom)).toBeCloseTo(
			restingPaddingBlockEnd + keyboardInset,
			1,
		);

		const listbox = page.getByRole('listbox').element();
		// Programmatic `element.scrollTo()` does not exercise scroll chaining. Browser-computed
		// overscroll-behavior is the Luke UI-owned contract (`listBox`'s tray presentation).
		expect(getComputedStyle(listbox).overscrollBehavior).toBe('contain');

		await userEvent.click(page.getByRole('option', { name: 'Canada' }));

		await expect.poll(() => new FormData(form).get('country')).toBe('ca');
	} finally {
		restoreScreenWidth();
	}
});

// The primitive renders the control itself, so it takes a plain `ref`.
test('ComboboxInput resolves object and callback refs to the input element', () => {
	const objectRef = createRef<HTMLInputElement>();
	const callbackResolved: Array<HTMLInputElement | null> = [];
	render(
		<>
			<ComboboxRoot<CountryItem> aria-label="Country object" defaultItems={countryItems}>
				<ComboboxInputGroup>
					<ComboboxInput ref={objectRef} />
				</ComboboxInputGroup>
			</ComboboxRoot>
			<ComboboxRoot<CountryItem> aria-label="Country callback" defaultItems={countryItems}>
				<ComboboxInputGroup>
					<ComboboxInput
						ref={(node) => {
							callbackResolved.push(node);
						}}
					/>
				</ComboboxInputGroup>
			</ComboboxRoot>
		</>,
	);

	const objectInput = page.getByRole('combobox', { name: 'Country object' });
	const callbackInput = page.getByRole('combobox', { name: 'Country callback' });

	expect(objectRef.current).toBe(objectInput.element());
	expect(callbackResolved.at(-1)).toBe(callbackInput.element());
});

// The following tests prove the combobox presentation context's ownership and scoping, described
// in `../primitives/combobox/presentation-context.tsx`: a primitive resolves its own presentation
// styling by calling `useComboboxPresentation()` itself, rather than the parent composition
// resolving styles for it and passing the result down as `xstyle`.

test('adjacent sections still get their structural border', async () => {
	render(
		<ComboboxField defaultItems={countryItems} label="Country" name="grouped">
			<ComboboxSection id="north" title="Northern hemisphere">
				<ComboboxItem id="ca">Canada</ComboboxItem>
			</ComboboxSection>
			<ComboboxSection id="south" title="Southern hemisphere">
				<ComboboxItem id="au">Australia</ComboboxItem>
			</ComboboxSection>
		</ComboboxField>,
	);

	await userEvent.click(page.getByRole('combobox', { name: 'Country' }));

	const northHeading = page.getByText('Northern hemisphere').element();
	const southHeading = page.getByText('Southern hemisphere').element();
	const northSection = northHeading.closest(`[${comboboxSectionScopeAttribute}]`);
	const southSection = southHeading.closest(`[${comboboxSectionScopeAttribute}]`);
	if (northSection == null || southSection == null) {
		throw new Error('Expected both sections to carry the section scope attribute.');
	}

	// The first section carries no adjacent-sibling border; the second, following a sibling
	// section, does. This retained rule lives outside the recipe this ticket touches (see
	// `../styles/components.css.ts`), so it stays correct through the presentation refactor only if
	// `ComboboxSection`'s own scope attribute is left alone.
	expect(getComputedStyle(northSection).borderBlockStartWidth).toBe('0px');
	expect(getComputedStyle(southSection).borderBlockStartWidth).toBe('1px');
});

test('mobile tray styles the tray listbox and search field, not the in-page trigger group', async () => {
	const restoreScreenWidth = mockScreenWidth(390);
	try {
		render(
			<ComboboxField defaultItems={countryItems} label="Country" name="country">
				{renderCountryItem}
			</ComboboxField>,
		);

		const trigger = page.getByRole('button', { name: 'Country' });
		const triggerGroup = trigger.element().parentElement;
		if (triggerGroup == null) throw new Error('Expected the in-page trigger group.');
		// The popover presentation styles no slot of its own (see `recipe.ts`'s `presentation`
		// variant), so the in-page trigger group carries none of the tray presentation's margins.
		expect(getComputedStyle(triggerGroup).marginBlockStart).toBe('0px');

		await userEvent.click(trigger);
		const dialog = page.getByRole('dialog');
		await expect.element(dialog).toBeVisible();

		const overlay = dialog.element().parentElement?.parentElement;
		if (overlay == null) throw new Error('Expected the mobile modal structure.');
		await waitForOverlayEnter(overlay);

		const searchbox = page.getByRole('searchbox', { name: 'Country' });
		const searchGroup = searchbox.element().parentElement;
		if (searchGroup == null) throw new Error('Expected the tray search input group.');
		// The tray's own search `inputGroup` gets the tray presentation's margin-based layout
		// (`inputGroupPresentationTray`), unlike the in-page trigger group above.
		expect(getComputedStyle(searchGroup).marginBlockStart).not.toBe('0px');

		const listbox = page.getByRole('listbox').element();
		// `listBox`'s tray presentation drops the popover's height cap and locks overscroll —
		// see the popover-only "kitchen sink" visual test for the capped, scrollable comparison.
		expect(getComputedStyle(listbox).maxBlockSize).toBe('none');
		expect(getComputedStyle(listbox).overscrollBehavior).toBe('contain');
	} finally {
		restoreScreenWidth();
	}
});

// A file-local style rather than a shared export: StyleX only inlines a spread it can resolve
// statically in the same module.
const consumerListBoxStyles = stylex.create({
	background: { backgroundColor: 'rgb(1, 2, 3)' },
});

test('a consumer xstyle on ComboboxListBox still composes, now that ComboboxListBox resolves its own recipe styles instead of the parent concatenating them', () => {
	const { locator } = render(
		<ComboboxRoot defaultItems={countryItems} name="listbox-xstyle">
			<ComboboxInputGroup>
				<ComboboxInput aria-label="Country" />
			</ComboboxInputGroup>
			<ComboboxListBox xstyle={consumerListBoxStyles.background}>
				{renderCountryItem}
			</ComboboxListBox>
		</ComboboxRoot>,
	);

	const listbox = locator.getByRole('listbox').element() as HTMLElement;
	expect(getComputedStyle(listbox).backgroundColor).toBe('rgb(1, 2, 3)');
	// The listbox's own recipe padding still applies alongside the consumer override.
	expect(getComputedStyle(listbox).padding).not.toBe('0px');
});
