import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import { SwitchButton, SwitchField } from 'react-aria-components/Switch';
import * as styles from '../styles/settings.css.js';

export function SettingsSwitch({
	'aria-describedby': ariaDescribedBy,
	id,
	isChecked,
	isReadOnly,
	label,
	onChange,
}: {
	id: string;
	isChecked: boolean;
	isReadOnly?: boolean;
	'aria-describedby'?: string;
	label: string;
	onChange: (checked: boolean) => void;
}) {
	return (
		<SwitchField
			aria-describedby={ariaDescribedBy}
			className={styles.switchField}
			id={id}
			isReadOnly={isReadOnly}
			isSelected={isChecked}
			onChange={onChange}
		>
			<SwitchButton className={styles.switchRoot}>
				<VisuallyHidden>{label}</VisuallyHidden>
				<span className={styles.switchTrack}>
					<span className={styles.switchThumb} />
				</span>
			</SwitchButton>
		</SwitchField>
	);
}
