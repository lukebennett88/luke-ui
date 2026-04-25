import { Field } from '@luke-ui/react/forms/composed';
import type { CSSProperties } from 'react';
import { Form } from 'react-aria-components/Form';
import { Input } from 'react-aria-components/Input';
import { TextField } from 'react-aria-components/TextField';
import { expect, userEvent, within } from 'storybook/test';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: Field,
	title: 'Forms/Field',
});

const stackStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
	maxInlineSize: '28rem',
} as const satisfies CSSProperties;

/**
 * Fields should be accompanied by a label so users understand what to enter.
 */
export const Label = meta.story({
	play: async ({ canvas }) => {
		await expect(canvas.getByLabelText('Name')).toBeInTheDocument();
	},
	render: () => (
		<TextField name="name">
			<Field label="Name">
				<Input />
			</Field>
		</TextField>
	),
});

/**
 * When visual context is already strong, you can hide the label by omitting it
 * and providing an accessible name on the parent field.
 */
export const LabelVisibility = meta.story({
	play: async ({ canvas }) => {
		await expect(canvas.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
	},
	render: () => (
		<TextField aria-label="Search" name="search">
			<Field description="Try searching by team or employee.">
				<Input placeholder="Search" />
			</Field>
		</TextField>
	),
});

/**
 * Description text can provide persistent help content for field completion.
 */
export const Description = meta.story({
	play: async ({ canvas }) => {
		await expect(
			canvas.getByText('We will only use this to respond to your question.'),
		).toBeInTheDocument();
	},
	render: () => (
		<TextField name="email">
			<Field description="We will only use this to respond to your question." label="Email">
				<Input type="email" />
			</Field>
		</TextField>
	),
});

/**
 * Required fields can show either an icon (`*`) or text (`(required)`),
 * controlled by `necessityIndicator`.
 */
export const Required = meta.story({
	render: () => (
		<div style={stackStyle}>
			<TextField isRequired name="firstName">
				<Field label="First name" necessityIndicator="icon">
					<Input />
				</Field>
			</TextField>
			<TextField isRequired name="lastName">
				<Field label="Last name" necessityIndicator="label">
					<Input />
				</Field>
			</TextField>
		</div>
	),
});

/**
 * Messages are shown through `FieldError` once React Aria marks the field
 * invalid. The message can be static text or a render function.
 */
export const Messages = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
		await expect(canvas.getByText('Please enter your full name.')).toBeInTheDocument();
		await expect(canvas.getByText('Must be at least 3 characters.')).toBeInTheDocument();
	},
	render: () => (
		<Form>
			<div style={stackStyle}>
				<TextField isRequired name="fullName">
					<Field errorMessage="Please enter your full name." label="Full name">
						<Input />
					</Field>
				</TextField>
				<TextField
					defaultValue="ab"
					name="username"
					validate={(value) => (value.length < 3 ? 'Must be at least 3 characters.' : null)}
				>
					<Field
						errorMessage={(validation) => validation.validationErrors.join(' ')}
						label="Username"
					>
						<Input />
					</Field>
				</TextField>
				<button type="submit">Submit</button>
			</div>
		</Form>
	),
});
