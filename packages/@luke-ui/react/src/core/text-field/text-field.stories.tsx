import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import {
	InputGroup,
	InputGroupInput,
	InputGroupPrefix,
	InputGroupSuffix,
} from '@luke-ui/react/primitives/input-group';
import { TextField } from '@luke-ui/react/text-field';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { Form } from 'react-aria-components/Form';
import { userEvent, within } from 'storybook/test';
import preview from '../../../.storybook/preview.js';

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

export const Default = meta.story({
	render: () => (
		<TextField description="We'll only use this for account updates." label="Email" name="email" />
	),
});

export const Placeholder = meta.story({
	render: () => (
		<TextField label="Project name" name="projectName" placeholder="Untitled project" />
	),
});

export const Size = meta.story({
	render: () => (
		<div style={stackStyle}>
			{sizes.map((size) => (
				<TextField key={size} label={size} name={`text-field-${size}`} size={size} />
			))}
		</div>
	),
});

export const PrefixAndSuffix = meta.story({
	render: () => (
		<div style={stackStyle}>
			<TextField label="Search" name="search" placeholder="Search" prefix={<Icon name="add" />} />
			<TextField label="Amount" name="amount" placeholder="0.00" suffix="USD" />
		</div>
	),
});

/**
 * `InputGroup` composes a control from children instead of props. The group owns the border,
 * background, and rounding. Its transparent parts follow document order.
 *
 * Use it for content that `prefix` and `suffix` cannot express, such as an interactive trailing
 * button. The group also sets the icon size, so nested icons scale with the control.
 */
export const InputGroupComposition = meta.story({
	play: async ({ canvas }) => {
		await userEvent.click(canvas.getByRole('button', { name: 'Clear' }));
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
	render: () => (
		<div style={stackStyle}>
			<InputGroup isInvalid>
				<InputGroupPrefix>$</InputGroupPrefix>
				<InputGroupInput aria-invalid aria-label="Invalid amount" defaultValue="-1" />
				<InputGroupSuffix>USD</InputGroupSuffix>
			</InputGroup>
		</div>
	),
});

/**
 * Shows constraint and custom validation messages after submission.
 */
export const Validation = meta.story({
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
	},
	render: () => (
		<Form>
			<div style={stackStyle}>
				<TextField isRequired label="Email" name="email" />
				<TextField
					defaultValue="ab"
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
 * Shows an error supplied by form state or a server.
 */
export const ControlledError = meta.story({
	render: () => (
		<TextField errorMessage="This username is not available." label="Username" name="username" />
	),
});

/**
 * Shows a server error passed through the form.
 */
export const ServerValidation = meta.story({
	render: () => (
		<Form validationErrors={{ username: 'This username is not available.' }}>
			<TextField label="Username" name="username" />
		</Form>
	),
});

/**
 * A read-only field stays focusable and in the tab order. Someone can still access and copy its
 * value, but cannot edit it.
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
