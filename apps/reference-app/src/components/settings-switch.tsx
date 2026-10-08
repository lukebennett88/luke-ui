import {
	SwitchControl,
	SwitchLabel,
	SwitchRoot,
	SwitchThumb,
} from '@luke-ui/react/primitives/switch';

/**
 * A switch for a settings row. The row draws the visible label and description, so the switch takes
 * its name and description from their ids.
 */
export function SettingsSwitch({
	'aria-describedby': ariaDescribedBy,
	'aria-labelledby': ariaLabelledBy,
	id,
	isChecked,
	isReadOnly,
	onChange,
}: {
	'aria-describedby'?: string;
	'aria-labelledby': string;
	id: string;
	isChecked: boolean;
	isReadOnly?: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<SwitchRoot
			aria-describedby={ariaDescribedBy}
			aria-labelledby={ariaLabelledBy}
			inputId={id}
			isReadOnly={isReadOnly}
			isSelected={isChecked}
			onChange={onChange}
		>
			<SwitchLabel>
				<SwitchControl>
					<SwitchThumb />
				</SwitchControl>
			</SwitchLabel>
		</SwitchRoot>
	);
}
