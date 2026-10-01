import { style } from '../../styles/layered-style.css.js';
import { textInputInlinePadding, textInputInputBase } from './recipe.css.js';

/**
 * Class for a `TextInput` inside a `TextInputControl`, in place of `textInputRecipe`'s `input`
 * slot. The control draws the chrome and sets the size, so the input stays transparent and
 * inherits the control's typography and inline padding.
 */
export const textInputInControlClassName = style(
	{
		...textInputInputBase,
		blockSize: '100%',
		flex: 1,
		fontSize: 'inherit',
		letterSpacing: 'inherit',
		lineHeight: 'inherit',
		paddingInlineEnd: textInputInlinePadding,
		paddingInlineStart: textInputInlinePadding,
	},
	'text-input-in-control',
);
