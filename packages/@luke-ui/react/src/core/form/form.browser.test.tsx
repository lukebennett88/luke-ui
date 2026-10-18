import { Button } from '@luke-ui/react/button';
import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { ComboboxField, ComboboxItem } from '@luke-ui/react/combobox-field';
import { Form } from '@luke-ui/react/form';
import type { NecessityIndicator } from '@luke-ui/react/form';
import { IconButton } from '@luke-ui/react/icon-button';
import { IconLink } from '@luke-ui/react/icon-link';
import { Link } from '@luke-ui/react/link';
import { SelectField, SelectItem } from '@luke-ui/react/select-field';
import { SwitchField } from '@luke-ui/react/switch-field';
import { TextInputField } from '@luke-ui/react/text-input-field';
import { createRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { expectForwardsDomProps, expectHtmlElement } from '../test-utils/forwarding.js';
import { getDescribedText } from '../test-utils/get-described-text.js';
import { MOBILE_SCREEN_WIDTH, mockScreenWidth } from '../test-utils/mock-screen-width.js';
import { render } from '../test-utils/render.js';
import { Stack } from '../test-utils/visual.js';

type CountryItem = {
	id: string;
	label: string;
};

const countryItems: Array<CountryItem> = [
	{ id: 'au', label: 'Australia' },
	{ id: 'ca', label: 'Canada' },
];

const renderCountryItem = (item: CountryItem) => <ComboboxItem>{item.label}</ComboboxItem>;

function textbox(name: string): HTMLInputElement {
	const element = page.getByRole('textbox', { name }).element();
	if (!(element instanceof HTMLInputElement)) throw new Error(`Expected a textbox "${name}".`);
	return element;
}

function checkbox(name: string): HTMLInputElement {
	const element = page.getByRole('checkbox', { name }).element();
	if (!(element instanceof HTMLInputElement)) throw new Error(`Expected a checkbox "${name}".`);
	return element;
}

/** Portals a nested Form outside the outer form element while keeping React ancestry for context. */
function NestedFormThroughPortal(props: {
	children: ReactNode;
	nestedNecessityIndicator?: NecessityIndicator;
}) {
	const { children, nestedNecessityIndicator } = props;
	const [host, setHost] = useState<HTMLDivElement | null>(null);

	return (
		<>
			<div ref={setHost} />
			<Form necessityIndicator="optional-label">
				{host
					? createPortal(
							<Form aria-label="Nested" necessityIndicator={nestedNecessityIndicator}>
								{children}
							</Form>,
							host,
						)
					: null}
			</Form>
		</>
	);
}

function FormScene() {
	return (
		<Form aria-label="Example form" necessityIndicator="optional-label">
			<Stack>
				<TextInputField label="Middle name" name="middleName" />
				<TextInputField isRequired label="Family name" name="familyName" />
				<Button type="submit">Save</Button>
			</Stack>
		</Form>
	);
}

test('Form forwards className, data attributes, id, and ref to its form element', () => {
	const ref = createRef<HTMLFormElement>();
	const { container } = render(
		<Form className="forwarded-class" data-forwarded="true" id="forwarded-id" ref={ref}>
			Content
		</Form>,
	);
	const target = expectHtmlElement(container.firstElementChild, 'Expected Form element.');

	expect(target.tagName).toBe('FORM');
	expectForwardsDomProps(target, ref);
});

test('the Form scene has no axe violations', async () => {
	const { container } = render(<FormScene />);

	await expectNoAxeViolations(container);
});

test('a composed field inherits Form necessityIndicator through an explicit undefined prop', () => {
	render(
		<Form necessityIndicator="optional-label">
			<TextInputField label="Middle name" necessityIndicator={undefined} />
		</Form>,
	);

	expect(textbox('Middle name (optional)').labels?.[0]?.textContent).toBe(
		'Middle name\u00A0(optional)',
	);
});

test('a composed field necessityIndicator overrides Form', () => {
	render(
		<Form necessityIndicator="optional-label">
			<TextInputField isRequired label="Family name" necessityIndicator="required-label" />
		</Form>,
	);

	expect(textbox('Family name').labels?.[0]?.textContent).toBe('Family name\u00A0(required)');
});

test('an unset nested Form does not shadow an outer Form necessityIndicator', () => {
	const { container } = render(
		<NestedFormThroughPortal>
			<TextInputField label="Middle name" />
		</NestedFormThroughPortal>,
	);

	expect(container.querySelectorAll('form')).toHaveLength(2);
	expect(container.querySelector('form form')).toBeNull();
	expect(textbox('Middle name (optional)').labels?.[0]?.textContent).toBe(
		'Middle name\u00A0(optional)',
	);
});

test('a nested Form with an explicit necessityIndicator overrides the outer Form', () => {
	const { container } = render(
		<NestedFormThroughPortal nestedNecessityIndicator="required-label">
			<TextInputField isRequired label="Family name" />
		</NestedFormThroughPortal>,
	);

	expect(container.querySelectorAll('form')).toHaveLength(2);
	expect(container.querySelector('form form')).toBeNull();
	expect(textbox('Family name').labels?.[0]?.textContent).toBe('Family name\u00A0(required)');
});

test('toggling Form necessityIndicator preserves uncontrolled field value and focus', async () => {
	const { rerender } = render(
		<Form aria-label="Example form">
			<TextInputField label="Middle name" name="middleName" />
		</Form>,
	);

	const input = textbox('Middle name');
	await userEvent.click(input);
	await userEvent.keyboard('Ada');
	expect(input.value).toBe('Ada');
	expect(input).toHaveFocus();

	rerender(
		<Form aria-label="Example form" necessityIndicator="optional-label">
			<TextInputField label="Middle name" name="middleName" />
		</Form>,
	);

	const afterOptional = textbox('Middle name (optional)');
	expect(afterOptional.value).toBe('Ada');
	expect(afterOptional).toHaveFocus();
	expect(afterOptional.labels?.[0]?.textContent).toBe('Middle name\u00A0(optional)');

	rerender(
		<Form aria-label="Example form">
			<TextInputField label="Middle name" name="middleName" />
		</Form>,
	);

	const afterUnset = textbox('Middle name');
	expect(afterUnset.value).toBe('Ada');
	expect(afterUnset).toHaveFocus();
	expect(afterUnset.labels?.[0]?.textContent).toBe('Middle name');
});

test('CheckboxField inherits Form necessityIndicator and can override it locally', () => {
	render(
		<Form necessityIndicator="optional-label">
			<CheckboxField label="Newsletter" name="newsletter" />
			<CheckboxField isRequired label="Terms" name="terms" necessityIndicator="required-asterisk" />
		</Form>,
	);

	expect(checkbox('Newsletter (optional)').closest('label')?.textContent).toContain('(optional)');
	expect(checkbox('Terms').closest('label')?.textContent).toContain('*');
});

test('Form forwards the native submit event to onSubmit', async () => {
	let submitted = false;
	render(
		<Form
			onSubmit={(event) => {
				event.preventDefault();
				submitted = true;
			}}
		>
			<TextInputField defaultValue="Ada" label="Name" name="name" />
			<button type="submit">Submit</button>
		</Form>,
	);

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));
	expect(submitted).toBe(true);
});

test('native validation blocks submission for a required empty TextInputField', async () => {
	let submitted = false;
	render(
		<Form
			onSubmit={(event) => {
				event.preventDefault();
				submitted = true;
			}}
		>
			<TextInputField isRequired label="Name" name="name" />
			<button type="submit">Submit</button>
		</Form>,
	);

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));
	expect(submitted).toBe(false);
	await expect.poll(() => textbox('Name').getAttribute('aria-invalid')).toBe('true');
});

test("validationBehavior='aria' allows submission for a required empty TextInputField", async () => {
	let submitted = false;
	render(
		<Form
			onSubmit={(event) => {
				event.preventDefault();
				submitted = true;
			}}
			validationBehavior="aria"
		>
			<TextInputField isRequired label="Name" name="name" />
			<button type="submit">Submit</button>
		</Form>,
	);

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));
	expect(submitted).toBe(true);
});

test('native validation blocks submission for a required empty ComboboxField tray', async () => {
	mockScreenWidth(MOBILE_SCREEN_WIDTH);
	let submitted = false;
	render(
		<Form
			onSubmit={(event) => {
				event.preventDefault();
				submitted = true;
			}}
		>
			<ComboboxField<CountryItem>
				defaultItems={countryItems}
				isRequired
				label="Country"
				name="country"
			>
				{renderCountryItem}
			</ComboboxField>
			<button type="submit">Submit</button>
		</Form>,
	);

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));
	expect(submitted).toBe(false);
});

test("validationBehavior='aria' on Form allows submission for a required empty ComboboxField tray", async () => {
	mockScreenWidth(MOBILE_SCREEN_WIDTH);
	let submitted = false;
	render(
		<Form
			onSubmit={(event) => {
				event.preventDefault();
				submitted = true;
			}}
			validationBehavior="aria"
		>
			<ComboboxField<CountryItem>
				defaultItems={countryItems}
				isRequired
				label="Country"
				name="country"
			>
				{renderCountryItem}
			</ComboboxField>
			<button type="submit">Submit</button>
		</Form>,
	);

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));
	expect(submitted).toBe(true);
});

test('ComboboxField validationBehavior overrides Form for the tray fallback', async () => {
	mockScreenWidth(MOBILE_SCREEN_WIDTH);
	let submitted = false;
	render(
		<Form
			onSubmit={(event) => {
				event.preventDefault();
				submitted = true;
			}}
			validationBehavior="native"
		>
			<ComboboxField<CountryItem>
				defaultItems={countryItems}
				isRequired
				label="Country"
				name="country"
				validationBehavior="aria"
			>
				{renderCountryItem}
			</ComboboxField>
			<button type="submit">Submit</button>
		</Form>,
	);

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));
	expect(submitted).toBe(true);
});

test('a controlled errorMessage wins over Form validationErrors, then removing it restores the server error', async () => {
	function Harness() {
		const [clientError, setClientError] = useState<string | undefined>(
			'Choose a different username.',
		);

		return (
			<>
				<Form validationErrors={{ username: 'That username is taken.' }}>
					<TextInputField errorMessage={clientError} label="Username" name="username" />
				</Form>
				<button type="button" onClick={() => setClientError(undefined)}>
					Clear client error
				</button>
			</>
		);
	}

	render(<Harness />);
	expect(getDescribedText(textbox('Username'))).toBe('Choose a different username.');

	// Remove `errorMessage` while retaining `validationErrors`. Do not type to clear: React Aria
	// clears server errors on editing.
	await userEvent.click(page.getByRole('button', { name: 'Clear client error' }));
	expect(getDescribedText(textbox('Username'))).toBe('That username is taken.');
});

test('an empty errorMessage falls back to Form validationErrors', () => {
	render(
		<Form validationErrors={{ username: 'That username is taken.' }}>
			<TextInputField errorMessage="" label="Username" name="username" />
		</Form>,
	);

	expect(getDescribedText(textbox('Username'))).toBe('That username is taken.');
});

for (const controlSize of ['small', 'medium'] as const) {
	test(`Form ${controlSize} sizes fields and actions while explicit sizes win`, async () => {
		render(
			<Form controlSize={controlSize}>
				<TextInputField label="Inherited input" />
				<CheckboxField label="Inherited checkbox" />
				<SwitchField label="Inherited switch" />
				<CheckboxField label="Explicit checkbox" size="small" />
				<SwitchField label="Explicit switch" size="medium" />
				<Button>Inherited action</Button>
				<IconButton aria-label="Inherited icon action" icon="add" />
				<IconLink aria-label="Inherited icon link" href="#" icon="add" />
				<Link appearance="button" href="#">
					Inherited link
				</Link>
				<Button size="medium">Explicit action</Button>
				<TextInputField label="Explicit input" size="small" />
				<SelectField label="Inherited select">
					<SelectItem id="one">One</SelectItem>
				</SelectField>
				<ComboboxField label="Inherited combobox">
					<ComboboxItem id="two">Two</ComboboxItem>
				</ComboboxField>
			</Form>,
		);
		const blockSize = controlSize === 'small' ? 32 : 40;
		for (const [role, name, expected] of [
			['checkbox', 'Inherited checkbox', controlSize === 'small' ? 16 : 20],
			['switch', 'Inherited switch', controlSize === 'small' ? 16 : 20],
			['checkbox', 'Explicit checkbox', 16],
			['switch', 'Explicit switch', 20],
		] as const) {
			const input = page.getByRole(role, { name }).element() as HTMLInputElement;
			// The visual indicator is hidden from assistive technology and has no role of its own.
			const indicator = input.labels?.[0]?.querySelector('[aria-hidden="true"]');
			if (!indicator) throw new Error(`Expected the indicator for ${name}`);
			expect(indicator.getBoundingClientRect().height).toBe(expected);
		}

		for (const name of ['Inherited action', 'Inherited icon action']) {
			expect(page.getByRole('button', { name }).element().getBoundingClientRect().height).toBe(
				blockSize,
			);
		}
		for (const name of ['Inherited link', 'Inherited icon link']) {
			expect(page.getByRole('link', { name }).element().getBoundingClientRect().height).toBe(
				blockSize,
			);
		}
		expect(textbox('Inherited input').parentElement?.getBoundingClientRect().height).toBe(
			blockSize,
		);
		expect(textbox('Explicit input').parentElement?.getBoundingClientRect().height).toBe(32);
		expect(
			page.getByRole('button', { name: 'Explicit action' }).element().getBoundingClientRect()
				.height,
		).toBe(40);
		await page.getByRole('button', { name: /Inherited select/ }).click();
		const option = page.getByRole('option', { name: 'One' });
		expect(option.element().getBoundingClientRect().height).toBe(blockSize);
		await option.click();
		await page.getByRole('combobox', { name: 'Inherited combobox' }).click();
		expect(page.getByRole('option', { name: 'Two' }).element().getBoundingClientRect().height).toBe(
			blockSize,
		);
	});
}

for (const nestedSize of [undefined, 'medium'] as const) {
	test(`nearest Form default ${nestedSize ?? 'unset'} survives a portal`, () => {
		render(
			<Form controlSize="small">
				{createPortal(
					<Form controlSize={nestedSize}>
						<Button>Nested action</Button>
					</Form>,
					document.body,
				)}
			</Form>,
		);
		expect(
			page.getByRole('button', { name: 'Nested action' }).element().getBoundingClientRect().height,
		).toBe(nestedSize === 'medium' ? 40 : 32);
	});
}

test('changing the Form default resizes controls without remounting their state', async () => {
	const { rerender } = render(
		<Form controlSize="small">
			<TextInputField label="Name" />
		</Form>,
	);
	await userEvent.fill(page.getByRole('textbox', { name: 'Name' }), 'Retained');
	const input = textbox('Name');
	rerender(
		<Form controlSize="medium">
			<TextInputField label="Name" />
		</Form>,
	);
	expect(textbox('Name')).toBe(input);
	expect(input.value).toBe('Retained');
	expect(input.parentElement?.getBoundingClientRect().height).toBe(40);
});
