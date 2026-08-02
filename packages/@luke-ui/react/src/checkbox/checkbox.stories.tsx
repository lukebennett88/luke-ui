import { Checkbox } from '@luke-ui/react/checkbox';
import type { CSSProperties } from 'react';
import { Form } from 'react-aria-components/Form';
import { expect, userEvent, within } from 'storybook/test';
import preview from '../../.storybook/preview.js';

const stackStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
	maxInlineSize: '28rem',
} as const satisfies CSSProperties;

const meta = preview.meta({
	component: Checkbox,
	tags: ['forms'],
	title: 'Forms/Checkbox',
});

/**
 * Checkboxes let someone choose an independent option. They expose native form
 * behaviour while keeping the label as the clickable target.
 */
export const Default = meta.story({
	args: {
		children: 'Send me account updates',
		name: 'updates',
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const checkbox = canvas.getByRole('checkbox', { name: 'Send me account updates' });

		await expect(checkbox).not.toBeChecked();
		await userEvent.click(checkbox);
		await expect(checkbox).toBeChecked();
	},
});

/**
 * Use `size` to fit the checkbox control to compact, standard, or spacious layouts.
 * Label typography continues to follow the surrounding text.
 */
export const Sizes = meta.story({
	render: () => (
		<div style={stackStyle}>
			<Checkbox defaultSelected size="small">
				Small checkbox
			</Checkbox>
			<Checkbox defaultSelected size="medium">
				Medium checkbox
			</Checkbox>
			<Checkbox defaultSelected size="large">
				Large checkbox
			</Checkbox>
		</div>
	),
});

/**
 * Use `isIndeterminate` when a parent option represents a mixed selection.
 * It sets only the visual state, so update it with the child selections in application code.
 */
export const Indeterminate = meta.story({
	args: {
		children: 'Select all projects',
		isIndeterminate: true,
		name: 'projects',
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByRole('checkbox', { name: 'Select all projects' }),
		).toBePartiallyChecked();
	},
});

/**
 * Disabled checkboxes cannot receive focus or change selection. Read-only
 * checkboxes stay in the tab order so someone who uses a keyboard can access their state.
 */
export const DisabledAndReadOnly = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const disabled = canvas.getByRole('checkbox', { name: 'Unavailable' });
		const readOnly = canvas.getByRole('checkbox', { name: 'Read-only' });

		await expect(disabled).toBeDisabled();
		await expect(readOnly).not.toBeDisabled();
		await userEvent.click(readOnly);
		await expect(readOnly).not.toBeChecked();
	},
	render: () => (
		<div style={stackStyle}>
			<Checkbox isDisabled name="disabled">
				Unavailable
			</Checkbox>
			<Checkbox isReadOnly name="readonly">
				Read-only
			</Checkbox>
		</div>
	),
});

/**
 * Required checkbox validation uses the browser and React Aria form semantics,
 * with `errorMessage` rendered only after validation fails.
 */
export const Validation = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
		await expect(canvas.getByText('Accept the terms to continue.')).toBeInTheDocument();
	},
	render: () => (
		<Form>
			<div style={stackStyle}>
				<Checkbox errorMessage="Accept the terms to continue." isRequired name="terms">
					I accept the terms
				</Checkbox>
				<button type="submit">Continue</button>
			</div>
		</Form>
	),
});
