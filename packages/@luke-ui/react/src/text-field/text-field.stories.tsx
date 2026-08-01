import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { TextField } from '@luke-ui/react/text-field';
import {
	InputGroup,
	InputGroupInput,
	InputGroupPrefix,
	InputGroupSuffix,
} from '@luke-ui/react/text-field/primitive';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { Form } from 'react-aria-components/Form';
import { expect, userEvent, within } from 'storybook/test';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: TextField,
	tags: ['forms'],
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
 * `placeholder` is forwarded to the internal `InputGroupInput` control.
 */
export const Placeholder = meta.story({
	render: () => (
		<TextField label="Project name" name="projectName" placeholder="Untitled project" />
	),
});

/**
 * Size can be set directly on composed `TextField` and forwards to the
 * `InputGroup` primitive.
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
 * `prefix` and `suffix` become the primitive's `InputGroupPrefix` and
 * `InputGroupSuffix` children.
 */
export const PrefixAndSuffix = meta.story({
	render: () => (
		<div style={stackStyle}>
			<TextField label="Search" name="search" placeholder="Search" prefix={<Icon name="add" />} />
			<TextField label="Amount" name="amount" placeholder="0.00" suffix="USD" />
		</div>
	),
});

/**
 * The `InputGroup` primitive composes the same control from children instead of
 * props. The group owns the border, background, and rounding; the parts are
 * transparent flex children whose position follows document order. Use it when a
 * composition needs something `prefix` / `suffix` cannot express, such
 * as an interactive trailing button.
 *
 * The group also provides the icon size, so the search `Icon` below scales with the
 * control without a `size` of its own.
 */
export const InputGroupComposition = meta.story({
	play: async ({ canvas }) => {
		await expect(canvas.getByLabelText('Amount')).toBeInTheDocument();
		await userEvent.click(canvas.getByRole('button', { name: 'Clear' }));
		await expect(canvas.getByLabelText('Search')).toHaveValue('');
	},
	render: function InputGroupCompositionStory() {
		const [search, setSearch] = useState('invoices');

		return (
			<div style={stackStyle}>
				<InputGroup>
					<InputGroupPrefix>$</InputGroupPrefix>
					<InputGroupInput aria-label="Amount" defaultValue="1250.00" inputMode="decimal" />
					<InputGroupSuffix>USD</InputGroupSuffix>
				</InputGroup>
				<InputGroup>
					<InputGroupPrefix>
						<Icon aria-hidden name="search" />
					</InputGroupPrefix>
					<InputGroupInput
						aria-label="Search"
						onChange={(event) => setSearch(event.target.value)}
						value={search}
					/>
					<InputGroupSuffix>
						<Button appearance="subtle" onPress={() => setSearch('')} size="small">
							Clear
						</Button>
					</InputGroupSuffix>
				</InputGroup>
			</div>
		);
	},
});

/**
 * `InputGroup` renders the invalid icon itself whenever the control is invalid, so a
 * composition cannot end up with a colour-only invalid cue. It lands after the input
 * and before any `InputGroupSuffix`.
 */
export const InputGroupInvalid = meta.story({
	play: async ({ canvas }) => {
		await expect(canvas.getByLabelText('Invalid amount')).toHaveAttribute('aria-invalid', 'true');
	},
	render: () => (
		<div style={stackStyle}>
			<InputGroup isInvalid>
				<InputGroupPrefix>$</InputGroupPrefix>
				<InputGroupInput aria-label="Invalid amount" aria-invalid defaultValue="-1" />
				<InputGroupSuffix>USD</InputGroupSuffix>
			</InputGroup>
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
 * Disabled and read-only states are forwarded to the field container. Unlike
 * disabled, a read-only field stays focusable and in the tab order — its
 * value is still relevant to assistive technology and copy/paste, it just
 * can't be edited.
 */
export const DisabledAndReadOnly = meta.story({
	play: async ({ canvas }) => {
		const disabledInput = canvas.getByLabelText('Disabled');
		const readOnlyInput = canvas.getByLabelText('Read-only');

		await expect(disabledInput).toBeDisabled();
		await expect(readOnlyInput).not.toBeDisabled();
		await expect(readOnlyInput).toHaveAttribute('readonly');

		await userEvent.click(readOnlyInput);
		await expect(readOnlyInput).toHaveFocus();
	},
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
