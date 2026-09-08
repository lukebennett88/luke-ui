import type { JSX } from 'react';
import type { GroupProps as RacGroupProps } from 'react-aria-components/Group';
import { Group as RacGroup } from 'react-aria-components/Group';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { FIELD_CONTROL_ICON_SIZE } from '../../sizing/control-size.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { useComboboxPresentation } from './presentation-context.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';
import { comboboxRecipe } from './styles.css.js';

type _ComboboxInputGroupOmit = DistributiveOmit<RacGroupProps, 'className'>;
interface _ComboboxInputGroupProps extends _ComboboxInputGroupOmit {
	className?: RacGroupProps['className'];
	size?: ComboboxSize;
}

/** Props for the styled combobox input group. */
export type ComboboxInputGroupProps = Prettify<_ComboboxInputGroupProps>;

/**
 * Groups a combobox input and its controls. Inside a `ComboboxTray`, it renders as an inset search
 * bar.
 */
export function ComboboxInputGroup(props: ComboboxInputGroupProps): JSX.Element {
	const { size: sizeProp, ...groupProps } = props;
	const presentation = useComboboxPresentation();
	const size = useComboboxSize(sizeProp);

	// Same icon size as `InputGroup`, including icons a caller puts in the group.
	return (
		<IconSizeProvider size={FIELD_CONTROL_ICON_SIZE[size]}>
			<RacGroup
				{...groupProps}
				className={composeRenderProps(groupProps.className, (className) => {
					return comboboxRecipe({ presentation, size }).inputGroup({ className });
				})}
			/>
		</IconSizeProvider>
	);
}
