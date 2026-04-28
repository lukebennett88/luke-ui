import { Field } from '@luke-ui/react/field';
import { TextInput } from '@luke-ui/react/text-input';
import type { CSSProperties } from 'react';
import { TextField as RacTextField } from 'react-aria-components/TextField';
import { expect } from 'storybook/test';
import preview from '../.storybook/preview.js';

const meta = preview.meta({
	component: TextInput,
	tags: ['forms'],
	title: 'Forms/TextInput (Primitive)',
});

const stackStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
	maxInlineSize: '24rem',
} as const satisfies CSSProperties;

/**
 * The `<TextInput />` component is most commonly used in a form context, where
 * you would nest it inside a Field to get a label, validation message and
 * spacing out of the box.
 */
export const Usage = meta.story({
	play: async ({ canvas }) => {
		await expect(canvas.getByLabelText('Email')).toBeInTheDocument();
	},
	render: () => (
		<RacTextField name="email">
			<Field label="Email">
				<TextInput placeholder="name@example.com" />
			</Field>
		</RacTextField>
	),
});

/**
 * The text input will by default render as `<input type="text" />`, but also
 * supports these types: `password`, `email`, `number`, `tel`, and `url`. When
 * suitable, these are important to use for various browsers' auto-fill
 * functionality e.g.
 */
export const Type = meta.story({
	render: () => (
		<div style={stackStyle}>
			<TextInput aria-label="Text (default)" placeholder="Text (default)" />
			<TextInput aria-label="Password" placeholder="Password" type="password" />
			<TextInput aria-label="Email" placeholder="Email" type="email" />
			<TextInput aria-label="Number" placeholder="Number" type="number" />
			<TextInput aria-label="Tel" placeholder="Tel" type="tel" />
			<TextInput aria-label="Url" placeholder="Url" type="url" />
		</div>
	),
});

/**
 * The input supports two sizes, `small` and `medium` (default). Prefer using
 * size consistently with other form controls (a button e.g.) that support the
 * same sizes.
 */
export const Size = meta.story({
	render: () => (
		<div style={stackStyle}>
			<TextInput aria-label="Small" placeholder="Small" size="small" />
			<TextInput aria-label="Medium (default)" placeholder="Medium (default)" />
		</div>
	),
});

/**
 * Use `adornmentStart` or `adornmentEnd` prop when you need a prefix/suffix to
 * the input, in text string format.
 */
export const Adornment = meta.story({
	render: () => (
		<div style={stackStyle}>
			<TextInput
				aria-label="Amount in dollars"
				adornmentStart="$"
				placeholder="Enter amount"
				type="number"
			/>
			<TextInput
				aria-label="Amount in AUD"
				adornmentEnd="AUD"
				placeholder="Enter amount"
				type="number"
			/>
		</div>
	),
});

/**
 * Use the `placeholder` prop to provide a hint or example of what the user can
 * enter.
 *
 * Avoid using placeholder text as a replacement for labels or descriptions. It
 * should not contain any crucial information, as it disappears when the user
 * starts typing.
 */
export const Placeholder = meta.story({
	render: () => (
		<RacTextField name="addressLine1">
			<Field label="Address line 1">
				<TextInput placeholder="E.g. 1 Sesame Street" />
			</Field>
		</RacTextField>
	),
});

/**
 * Use the `disabled` prop when the user shouldn't be able to manipulate the
 * value of the input.
 */
export const Disabled = meta.story({
	render: () => <TextInput aria-label="Disabled" disabled placeholder="Disabled" />,
});

/**
 * Use the `invalid` prop to communicate that validation has failed for this
 * particular text input.


 */
export const Invalid = meta.story({
	render: () => <TextInput aria-invalid aria-label="Invalid" placeholder="Invalid" />,
});
