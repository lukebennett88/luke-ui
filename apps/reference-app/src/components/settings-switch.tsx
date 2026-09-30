import { Switch } from 'react-aria-components/Switch';
import * as styles from '../styles/settings.css.js';

export function SettingsSwitch({
	id,
	isChecked,
	isDisabled,
	label,
	onChange,
}: {
	id: string;
	isChecked: boolean;
	isDisabled?: boolean;
	label: string;
	onChange: (checked: boolean) => void;
}) {
	return (
		<Switch
			aria-checked={isChecked}
			aria-label={label}
			className={styles.switchRoot}
			id={id}
			isDisabled={isDisabled}
			isSelected={isChecked}
			onChange={onChange}
		>
			<span className={styles.switchTrack}>
				<span className={styles.switchThumb} />
			</span>
		</Switch>
	);
}
