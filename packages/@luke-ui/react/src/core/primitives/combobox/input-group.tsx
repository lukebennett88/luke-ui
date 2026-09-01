import type { JSX } from 'react';
import type { GroupProps as RacGroupProps } from 'react-aria-components/Group';
import { Group as RacGroup } from 'react-aria-components/Group';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { FIELD_CONTROL_ICON_SIZE } from '../../sizing/control-size.js';
import type { XStyleProps } from '../../styles/xstyle.js';
import { resolveXStyleProps } from '../../styles/xstyle.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import type { ComboboxSize } from './recipe.js';
import { resolveComboboxRecipeStyles } from './recipe.js';
import { useComboboxSize } from './size-context.js';

type _ComboboxInputGroupOmit = DistributiveOmit<RacGroupProps, 'className'>;
interface _ComboboxInputGroupProps extends _ComboboxInputGroupOmit, XStyleProps {
	className?: RacGroupProps['className'];
	size?: ComboboxSize;
}

/** Props for the styled combobox input group. */
export type ComboboxInputGroupProps = Prettify<_ComboboxInputGroupProps>;

/** Wrapper for combobox text input + trigger content. */
export function ComboboxInputGroup(props: ComboboxInputGroupProps): JSX.Element {
	const { size: sizeProp, style, xstyle, ...groupProps } = props;
	const size = useComboboxSize(sizeProp);
	const recipeStyles = resolveComboboxRecipeStyles({ size }).inputGroup;

	// Same icon size as `InputGroup`, including icons a caller puts in the group.
	return (
		<IconSizeProvider size={FIELD_CONTROL_ICON_SIZE[size]}>
			<RacGroup
				{...groupProps}
				className={composeRenderProps(groupProps.className, (className) => {
					return resolveXStyleProps(recipeStyles, xstyle, className, undefined).className ?? '';
				})}
				style={composeRenderProps(style, (value) => {
					return resolveXStyleProps(recipeStyles, xstyle, undefined, value).style;
				})}
			/>
		</IconSizeProvider>
	);
}
