import type { IconName } from '@luke-ui/react/icon';
import { IconButton } from '@luke-ui/react/icon-button';
import { css } from '../../../styled-system/css';

type IconToggleItem<Value extends string> = {
	icon: IconName;
	label: string;
	value: Value;
};

type IconToggleButtonGroupProps<Value extends string> = {
	label: string;
	onChange: (value: Value) => void;
	options: ReadonlyArray<IconToggleItem<Value>>;
	value: Value | null;
};

export function IconToggleButtonGroup<Value extends string>({
	label,
	onChange,
	options,
	value,
}: IconToggleButtonGroupProps<Value>) {
	return (
		<div aria-label={label} className={iconToggleStyles.group} role="group">
			{options.map(({ icon, label: optionLabel, value: optionValue }) => (
				<IconButton
					appearance={value === optionValue ? 'solid' : 'ghost'}
					aria-label={optionLabel}
					aria-pressed={value === optionValue}
					icon={icon}
					key={optionValue}
					onPress={() => onChange(optionValue)}
					size="small"
					tone="neutral"
				/>
			))}
		</div>
	);
}

const iconToggleStyles = {
	group: css({
		alignItems: 'center',
		backgroundColor: 'var(--luke-color-surface-recessed)',
		borderRadius: 'var(--luke-radius-full)',
		display: 'flex',
		gap: 'var(--luke-space-100)',
		padding: 'var(--luke-space-100)',
	}),
};
