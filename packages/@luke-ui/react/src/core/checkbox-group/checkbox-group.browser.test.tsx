import { CheckboxField } from '@luke-ui/react/checkbox-field';
import { CheckboxGroup } from '@luke-ui/react/checkbox-group';
import { Form } from '@luke-ui/react/form';
import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/context';
import { expectNoAxeViolations } from '../test-utils/axe.js';
import { getDescribedText } from '../test-utils/get-described-text.js';
import { flatAppearances, render, visualAppearances } from '../test-utils/render.js';
import { captureVisualAppearance, Stack } from '../test-utils/visual.js';

function checkbox(name: string): HTMLInputElement {
	const element = page.getByRole('checkbox', { name }).element();
	if (!(element instanceof HTMLInputElement)) throw new Error(`Expected checkbox "${name}".`);
	return element;
}

function occurrenceCount(text: string, message: string): number {
	return text.split(message).length - 1;
}

test('CheckboxGroup names, describes, and selects its labelled children', async () => {
	render(
		<CheckboxGroup description="Choose any that apply." label="Topics">
			<CheckboxField description="Monthly digest." label="Design" value="design" />
			<CheckboxField label="Engineering" value="engineering" />
		</CheckboxGroup>,
	);
	const first = checkbox('Design');
	const second = checkbox('Engineering');

	expect(first).toHaveAccessibleDescription('Monthly digest. Choose any that apply.');
	expect(second).toHaveAccessibleDescription('Choose any that apply.');

	await userEvent.click(page.getByText('Design', { exact: true }));
	await userEvent.click(page.getByText('Engineering', { exact: true }));

	expect(first).toBeChecked();
	expect(second).toBeChecked();
});

test('CheckboxGroup supports an accessible name without a visible label', () => {
	render(
		<CheckboxGroup aria-label="Notifications">
			<CheckboxField label="Product updates" value="product" />
		</CheckboxGroup>,
	);

	expect(page.getByRole('group', { name: 'Notifications' })).toBeInTheDocument();
});

test('CheckboxGroup accepts aria-labelledby as its accessible name', () => {
	render(
		<>
			<span id="notification-label">Notification settings</span>
			<CheckboxGroup aria-labelledby="notification-label">
				<CheckboxField label="Product updates" value="product" />
			</CheckboxGroup>
		</>,
	);

	expect(page.getByRole('group', { name: 'Notification settings' })).toBeInTheDocument();
});

test('controlled CheckboxGroup reports multi-selection and submits native values', async () => {
	let selected: Array<string> = ['email'];
	const changes: Array<Array<string>> = [];
	const { rerender } = render(
		<form>
			<CheckboxGroup
				label="Channels"
				name="channels"
				onChange={(value) => {
					selected = value;
					changes.push(value);
				}}
				value={selected}
			>
				<CheckboxField label="Email" value="email" />
				<CheckboxField label="Text message" value="sms" />
			</CheckboxGroup>
			<button type="submit">Submit</button>
		</form>,
	);

	await userEvent.click(page.getByText('Text message', { exact: true }));
	expect(changes).toEqual([['email', 'sms']]);
	rerender(
		<form>
			<CheckboxGroup
				label="Channels"
				name="channels"
				onChange={(value) => changes.push(value)}
				value={selected}
			>
				<CheckboxField label="Email" value="email" />
				<CheckboxField label="Text message" value="sms" />
			</CheckboxGroup>
			<button type="submit">Submit</button>
		</form>,
	);
	expect(checkbox('Email')).toBeChecked();
	expect(checkbox('Text message')).toBeChecked();

	const form = checkbox('Email').form;
	if (form == null) throw new Error('Expected the group to be inside a form.');
	expect(new FormData(form).getAll('channels')).toEqual(['email', 'sms']);
});

test('group required validation shows one shared group error and keeps the description', async () => {
	render(
		<form>
			<CheckboxGroup description="Choose at least one." isRequired label="Topics">
				<CheckboxField label="Design" value="design" />
				<CheckboxField label="Engineering" value="engineering" />
			</CheckboxGroup>
			<button type="submit">Submit</button>
		</form>,
	);
	const first = checkbox('Design');
	const second = checkbox('Engineering');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	const sharedError = 'Please check this box if you want to proceed.';
	await expect.poll(() => getDescribedText(first)).toContain(sharedError);
	expect(first).toHaveAttribute('aria-invalid', 'true');
	expect(second).toHaveAttribute('aria-invalid', 'true');
	expect(first).toHaveAccessibleDescription(/Choose at least one\./);
	expect(occurrenceCount(getDescribedText(first), sharedError)).toBe(1);
	expect(first.getAttribute('aria-describedby')).toBe(second.getAttribute('aria-describedby'));
});

test('child validation errors and controlled errorMessage are retained once at group level', async () => {
	render(
		<form>
			<CheckboxGroup errorMessage="Choose a supported topic." label="Topics">
				<CheckboxField
					errorMessage="Design is unavailable."
					label="Design"
					validate={(isSelected) => (isSelected ? null : 'Select Design to continue.')}
					value="design"
				/>
				<CheckboxField label="Engineering" value="engineering" />
			</CheckboxGroup>
			<button type="submit">Submit</button>
		</form>,
	);
	const design = checkbox('Design');
	const engineering = checkbox('Engineering');

	expect(design).toHaveAttribute('aria-invalid', 'true');
	await expect.poll(() => getDescribedText(design)).toContain('Choose a supported topic.');
	const controlledDescription = getDescribedText(design);
	expect(controlledDescription).toContain('Choose a supported topic.');
	expect(controlledDescription).toContain('Design is unavailable.');
	expect(occurrenceCount(controlledDescription, 'Choose a supported topic.')).toBe(1);
	expect(occurrenceCount(controlledDescription, 'Design is unavailable.')).toBe(1);
	expect(design.getAttribute('aria-describedby')).toBe(
		engineering.getAttribute('aria-describedby'),
	);

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.poll(() => getDescribedText(design)).toContain('Select Design to continue.');
	const validationDescription = getDescribedText(design);
	expect(validationDescription).toContain('Choose a supported topic.');
	expect(validationDescription).toContain('Design is unavailable.');
	expect(validationDescription).toContain('Select Design to continue.');
	for (const message of [
		'Choose a supported topic.',
		'Design is unavailable.',
		'Select Design to continue.',
	]) {
		expect(occurrenceCount(validationDescription, message)).toBe(1);
	}
	expect(design.getAttribute('aria-describedby')).toBe(
		engineering.getAttribute('aria-describedby'),
	);
});

test('child validation messages follow their mounted fields and clear when selection changes', async () => {
	render(
		<form>
			<CheckboxGroup label="Topics">
				<CheckboxField
					label="Design"
					validate={(isSelected) => (isSelected ? null : 'Select Design to continue.')}
					value="design"
				/>
				<CheckboxField label="Engineering" value="engineering" />
			</CheckboxGroup>
			<button type="submit">Submit</button>
		</form>,
	);
	const design = checkbox('Design');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));
	await expect.poll(() => getDescribedText(design)).toContain('Select Design to continue.');
	await userEvent.click(page.getByText('Design', { exact: true }));

	await expect.poll(() => getDescribedText(design)).not.toContain('Select Design to continue.');
	expect(getDescribedText(design)).not.toContain('Select Design to continue.');
});

test('changing and unmounting a child removes its obsolete error while the group message updates', async () => {
	const { rerender } = render(
		<CheckboxGroup errorMessage="Choose a topic." label="Topics">
			<CheckboxField errorMessage="Design is unavailable." label="Design" value="design" />
			<CheckboxField label="Engineering" value="engineering" />
		</CheckboxGroup>,
	);
	const design = checkbox('Design');
	const engineering = checkbox('Engineering');

	await expect.poll(() => getDescribedText(design)).toContain('Choose a topic.');
	const initialDescription = getDescribedText(design);
	expect(initialDescription).toContain('Choose a topic.');
	expect(initialDescription).toContain('Design is unavailable.');
	expect(occurrenceCount(initialDescription, 'Choose a topic.')).toBe(1);
	expect(occurrenceCount(initialDescription, 'Design is unavailable.')).toBe(1);

	rerender(
		<CheckboxGroup errorMessage="Choose a supported topic." label="Topics">
			<CheckboxField label="Engineering" value="engineering" />
		</CheckboxGroup>,
	);

	await expect.poll(() => getDescribedText(engineering)).toContain('Choose a supported topic.');
	expect(getDescribedText(engineering)).not.toContain('Choose a topic.');
	expect(getDescribedText(engineering)).not.toContain('Design is unavailable.');
});

test('child required validation contributes to group validity', async () => {
	render(
		<form>
			<CheckboxGroup label="Topics">
				<CheckboxField isRequired label="Terms" value="terms" />
				<CheckboxField label="News" value="news" />
			</CheckboxGroup>
			<button type="submit">Submit</button>
		</form>,
	);
	const terms = checkbox('Terms');

	await userEvent.click(page.getByRole('button', { name: 'Submit' }));

	await expect.poll(() => getDescribedText(terms).length).toBeGreaterThan(0);
	expect(terms).toHaveAttribute('aria-invalid', 'true');
	const message = 'Please check this box if you want to proceed.';
	expect(occurrenceCount(getDescribedText(terms), message)).toBe(1);
});

test('Form controlSize supplies the group size while individual child size can override it', () => {
	render(
		<Form controlSize="small">
			<CheckboxGroup label="Topics" size="medium">
				<CheckboxField label="Inherited group size" value="inherited" />
				<CheckboxField label="Child override" size="small" value="override" />
			</CheckboxGroup>
		</Form>,
	);

	for (const [name, size] of [
		['Inherited group size', 20],
		['Child override', 16],
	] as const) {
		const input = checkbox(name);
		const indicator = input.labels?.[0]?.querySelector('[aria-hidden="true"]');
		if (indicator == null) throw new Error(`Expected the ${name} indicator.`);
		expect(indicator.getBoundingClientRect().height).toBe(size);
	}
});

test('group and child disabled states disable their controls', async () => {
	render(
		<>
			<CheckboxGroup isDisabled label="Disabled group">
				<CheckboxField label="Group child" value="group" />
			</CheckboxGroup>
			<CheckboxGroup label="Mixed disabled">
				<CheckboxField isDisabled label="Child disabled" value="child" />
				<CheckboxField label="Enabled child" value="enabled" />
			</CheckboxGroup>
		</>,
	);

	expect(checkbox('Group child')).toBeDisabled();
	expect(checkbox('Child disabled')).toBeDisabled();
	expect(checkbox('Enabled child')).toBeEnabled();
	await userEvent.click(page.getByText('Enabled child', { exact: true }));
	expect(checkbox('Enabled child')).toBeChecked();
});

test('a mixed state remains native indeterminate within the group', () => {
	render(
		<CheckboxGroup label="Topics">
			<CheckboxField isIndeterminate label="Partially selected" value="partial" />
		</CheckboxGroup>,
	);

	expect(checkbox('Partially selected').indeterminate).toBe(true);
});

test('group orientation preserves child order and wraps horizontal choices', () => {
	render(
		<CheckboxGroup label="Topics" orientation="horizontal">
			<CheckboxField label="Design" value="design" />
			<CheckboxField label="Engineering" value="engineering" />
			<CheckboxField label="Accessibility and inclusive design" value="accessibility" />
		</CheckboxGroup>,
	);

	expect(
		checkbox('Design').compareDocumentPosition(checkbox('Engineering')) &
			Node.DOCUMENT_POSITION_FOLLOWING,
	).toBeTruthy();
	expect(
		checkbox('Engineering').compareDocumentPosition(
			checkbox('Accessibility and inclusive design'),
		) & Node.DOCUMENT_POSITION_FOLLOWING,
	).toBeTruthy();
});

test('CheckboxGroup has no axe violations with errors, descriptions, and disabled children', async () => {
	const { container } = render(
		<CheckboxGroup
			description="Choose any that apply."
			errorMessage="Select a topic."
			label="Topics"
		>
			<CheckboxField isDisabled label="Unavailable" value="unavailable" />
			<CheckboxField label="Available" value="available" />
		</CheckboxGroup>,
	);

	await expectNoAxeViolations(container);
});

test('visual states across themes', { tags: ['visual'] }, async () => {
	for (const appearance of visualAppearances) {
		const { locator } = render(
			<Stack>
				<CheckboxGroup description="Choose any that apply." label="Vertical choices">
					<CheckboxField defaultSelected label="Selected" value="selected" />
					<CheckboxField isIndeterminate label="Mixed" value="mixed" />
				</CheckboxGroup>
				<CheckboxGroup
					errorMessage="Select at least one topic."
					isDisabled
					label="Horizontal choices"
					orientation="horizontal"
				>
					<CheckboxField label="Design" value="design" />
					<CheckboxField defaultSelected label="Engineering" value="engineering" />
				</CheckboxGroup>
			</Stack>,
			{ appearance },
		);
		await captureVisualAppearance(locator, 'checkbox-group/theme-states', appearance);
	}
});

test(
	'flat themes keep checked, indeterminate, invalid, and disabled states distinct',
	{ tags: ['visual'] },
	async () => {
		for (const appearance of flatAppearances) {
			const { locator } = render(
				<Stack>
					<CheckboxGroup errorMessage="Choose one." label="States">
						<CheckboxField label="Unchecked" value="unchecked" />
						<CheckboxField defaultSelected label="Checked" value="checked" />
						<CheckboxField isIndeterminate label="Indeterminate" value="indeterminate" />
						<CheckboxField isDisabled label="Disabled" value="disabled" />
					</CheckboxGroup>
				</Stack>,
				{ appearance },
			);
			await captureVisualAppearance(locator, 'checkbox-group/flat-states', appearance);
		}
	},
);

test('standalone CheckboxField errors stay outside the group message context', async () => {
	render(
		<>
			<CheckboxGroup errorMessage="Group error." label="Topics">
				<CheckboxField errorMessage="Group child error." label="Grouped choice" value="grouped" />
			</CheckboxGroup>
			<CheckboxField errorMessage="Standalone error." label="Standalone" />
		</>,
	);

	const groupChild = checkbox('Grouped choice');
	const standalone = checkbox('Standalone');
	await expect.poll(() => getDescribedText(groupChild)).toContain('Group error.');
	const groupDescription = getDescribedText(groupChild);
	expect(groupDescription).toContain('Group child error.');
	expect(occurrenceCount(groupDescription, 'Group error.')).toBe(1);
	expect(occurrenceCount(groupDescription, 'Group child error.')).toBe(1);
	await expect.poll(() => getDescribedText(standalone)).toContain('Standalone error.');
	expect(getDescribedText(standalone)).not.toContain('Group error.');
	expect(getDescribedText(standalone)).not.toContain('Group child error.');
});
