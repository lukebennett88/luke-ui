import { FieldDescription, FieldLabel } from '@luke-ui/react/primitives/field';
import {
	SwitchControl,
	SwitchLabel,
	SwitchRoot,
	SwitchThumb,
} from '@luke-ui/react/primitives/switch';
import { Stack } from '@luke-ui/react/stack';
import * as styles from '../styles/settings.css.js';
import { SettingsRowControl } from './settings-section.js';

/**
 * A settings row for a switch. The row draws the visible label and description with `FieldLabel` and
 * `FieldDescription`. The root names and describes the switch from them, so the row passes no ids.
 */
export function SettingsSwitchRow({
	hint,
	isChecked,
	isReadOnly,
	label,
	onChange,
}: {
	hint?: string;
	isChecked: boolean;
	isReadOnly?: boolean;
	label: string;
	onChange: (checked: boolean) => void;
}) {
	return (
		<SwitchRoot
			className={styles.settingsRow}
			isReadOnly={isReadOnly}
			isSelected={isChecked}
			onChange={onChange}
		>
			<Stack flexGrow="1" gap="sp4" minInlineSize="0">
				<FieldLabel>{label}</FieldLabel>
				{hint ? <FieldDescription>{hint}</FieldDescription> : null}
			</Stack>
			<SettingsRowControl>
				<SwitchLabel>
					<SwitchControl>
						<SwitchThumb />
					</SwitchControl>
				</SwitchLabel>
			</SettingsRowControl>
		</SwitchRoot>
	);
}
