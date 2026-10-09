import type { JSX } from 'react';
import type { GroupProps as RacGroupProps } from 'react-aria-components/Group';
import { Group as RacGroup } from 'react-aria-components/Group';
import { composeRenderProps } from 'react-aria-components/composeRenderProps';
import { IconSizeProvider } from '../../icon/icon-size-context.js';
import { FIELD_CONTROL_ICON_SIZE } from '../../sizing/control-size.js';
import type { DistributiveOmit } from '../../types/distributive-omit.js';
import type { Prettify } from '../../types/prettify.js';
import { useComboboxInputGroupRef } from './input-group-context.js';
import { useComboboxPresentation } from './presentation-context.js';
import type { ComboboxSize } from './root.js';
import { useComboboxSize } from './size-context.js';
import { comboboxRecipe } from './styles.css.js';

type _ComboboxControlOmit = DistributiveOmit<RacGroupProps, 'className'>;
interface _ComboboxControlProps extends _ComboboxControlOmit {
	className?: RacGroupProps['className'];
	size?: ComboboxSize;
}

/** Props for `ComboboxControl`. */
export type ComboboxControlProps = Prettify<_ComboboxControlProps>;

/**
 * Visual chrome around a `ComboboxInput` and its buttons, or around a `ComboboxTrayTrigger`. Inside
 * a `ComboboxTray`, it renders as an inset search bar. It reads invalid state from the combobox and
 * takes a danger border.
 */
export function ComboboxControl(props: ComboboxControlProps): JSX.Element {
	const { size: sizeProp, ...groupProps } = props;
	const presentation = useComboboxPresentation();
	const size = useComboboxSize(sizeProp);
	const inputGroupRef = useComboboxInputGroupRef();

	// The well chrome in `comboboxRecipe`'s `control` slot duplicates `TextInputControl`'s
	// (`primitives/text-input/recipe.css.ts`). Change the two together until they share one source.
	// Same icon size as `TextInputControl`, including icons a caller puts in the control.
	return (
		<IconSizeProvider size={FIELD_CONTROL_ICON_SIZE[size]}>
			<RacGroup
				{...groupProps}
				className={composeRenderProps(groupProps.className, (className) => {
					return comboboxRecipe({ presentation, size }).control({ className });
				})}
				// The group inside a tray is not the input group: it sits in the tray's own portal.
				ref={presentation === 'tray' ? undefined : inputGroupRef}
			/>
		</IconSizeProvider>
	);
}
