import { Switch } from 'react-aria-components/Switch';
import * as styles from '../styles/settings.css.js';

export function SettingsSwitch({
	checked,
	disabled,
	id,
	label,
	onChange,
}: {
	checked: boolean;
	disabled?: boolean;
	id: string;
	label: string;
	onChange: (checked: boolean) => void;
}) {
	return (
		<Switch
			aria-checked={checked}
			aria-label={label}
			className={styles.switchRoot}
			id={id}
			isDisabled={disabled}
			isSelected={checked}
			onChange={onChange}
		>
			<span className={styles.switchTrack}>
				<span className={styles.switchThumb} />
			</span>
		</Switch>
	);
}
