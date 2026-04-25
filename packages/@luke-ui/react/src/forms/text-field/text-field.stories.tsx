import { TextField } from '@luke-ui/react/forms/composed';
import { Icon } from '@luke-ui/react/visuals';
import type { CSSProperties } from 'react';
import { Form } from 'react-aria-components/Form';
import { expect, userEvent, within } from 'storybook/test';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: TextField,
	title: 'Forms/TextField',
});

const sizes = ['small', 'medium'] as const;

const stackStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
	maxInlineSize: '24rem',
} as const satisfies CSSProperties;

/**
 * Composed `TextField` provides top-level props while preserving accessible
 * behavior from the underlying form primitives.
 */
export const Default = meta.story({
	play: async ({ canvas }) => {
		await expect(canvas.getByLabelText('Email')).toBeInTheDocument();
		await expect(canvas.getByText("We'll only use this for account updates.")).toBeInTheDocument();
	},
	render: () => (
		<TextField description="We'll only use this for account updates." label="Email" name="email" />
	),
});

/**
 * `placeholder` is forwarded to the internal `TextInput` control.
 */
export const Placeholder = meta.story({
	render: () => (
		<TextField label="Project name" name="projectName" placeholder="Untitled project" />
	),
});

/**
 * Size can be set directly on composed `TextField` and forwards to the
 * primitive `TextInput`.
 */
export const Size = meta.story({
	render: () => (
		<div style={stackStyle}>
			{sizes.map((size) => (
				<TextField key={size} label={size} name={`text-field-${size}`} size={size} />
			))}
		</div>
	),
});

/**
 * Start/end adornments are passed through to the primitive `TextInput`.
 */
export const Adornments = meta.story({
	render: () => (
		<div style={stackStyle}>
			<TextField
				adornmentStart={<Icon name="add" />}
				label="Search"
				name="search"
				placeholder="Search"
			/>
			<TextField adornmentEnd="USD" label="Amount" name="amount" placeholder="0.00" />
		</div>
	),
});

/**
 * Validation supports both static text and render-function signatures via
 * `errorMessage`.
 */
export const Validation = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
		await expect(canvas.getByText('Please enter an email.')).toBeInTheDocument();
		await expect(canvas.getByText('Must be at least 3 characters.')).toBeInTheDocument();
	},
	render: () => (
		<Form>
			<div style={stackStyle}>
				<TextField errorMessage="Please enter an email." isRequired label="Email" name="email" />
				<TextField
					defaultValue="ab"
					errorMessage={(validation) => validation.validationErrors.join(' ')}
					label="Username"
					name="username"
					validate={(value) => (value.length < 3 ? 'Must be at least 3 characters.' : null)}
				/>
				<button type="submit">Submit</button>
			</div>
		</Form>
	),
});

/**
 * Server-provided validation errors flow through `FieldError` when
 * `errorMessage` uses the render-function signature.
 */
export const ServerValidation = meta.story({
	play: async ({ canvas }) => {
		await expect(canvas.getByText('This username is not available.')).toBeInTheDocument();
	},
	render: () => (
		<Form validationErrors={{ username: 'This username is not available.' }}>
			<TextField
				errorMessage={(validation) => validation.validationErrors.join(' ')}
				label="Username"
				name="username"
			/>
		</Form>
	),
});

/**
 * Disabled and read-only states are forwarded to the field container.
 */
export const DisabledAndReadOnly = meta.story({
	render: () => (
		<div style={stackStyle}>
			<TextField
				defaultValue="Unavailable"
				description="Temporarily disabled"
				isDisabled
				label="Disabled"
				name="disabled"
			/>
			<TextField
				defaultValue="Read only"
				description="Cannot be edited"
				isReadOnly
				label="Read-only"
				name="readonly"
			/>
		</div>
	),
});
