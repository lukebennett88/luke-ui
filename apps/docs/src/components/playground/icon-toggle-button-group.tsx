import type { IconName } from '@luke-ui/react/icon';
import { Icon } from '@luke-ui/react/icon';
import { ToggleButton } from 'react-aria-components/ToggleButton';
import { ToggleButtonGroup } from 'react-aria-components/ToggleButtonGroup';
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
		<ToggleButtonGroup
			aria-label={label}
			className={iconToggleStyles.group}
			disallowEmptySelection
			onSelectionChange={(keys) => {
				for (const key of keys) {
					onChange(key as Value);
					return;
				}
			}}
			selectedKeys={value == null ? [] : [value]}
			selectionMode="single"
		>
			{options.map(({ icon, label: optionLabel, value: optionValue }) => (
				<ToggleButton
					aria-label={optionLabel}
					className={iconToggleStyles.button}
					id={optionValue}
					key={optionValue}
				>
					<Icon aria-hidden name={icon} />
				</ToggleButton>
			))}
		</ToggleButtonGroup>
	);
}

const iconToggleStyles = {
	button: css({
		alignItems: 'center',
		backgroundColor: 'transparent',
		blockSize: 'var(--luke-control-size-small)',
		borderRadius: 'var(--luke-radius-control)',
		borderStyle: 'none',
		color: 'var(--luke-color-text-secondary)',
		cursor: 'pointer',
		display: 'inline-flex',
		inlineSize: 'var(--luke-control-size-small)',
		justifyContent: 'center',
		'&[data-hovered]': {
			backgroundColor: 'var(--luke-color-intent-neutral-surface-subtle-hover)',
			color: 'var(--luke-color-text-primary)',
		},
		'&[data-selected]': {
			backgroundColor: 'var(--luke-color-intent-neutral-surface-solid)',
			color: 'var(--luke-color-intent-neutral-on-solid)',
		},
		'&[data-focus-visible]': {
			outline: '2px solid var(--luke-color-border-focus)',
			outlineOffset: '2px',
		},
		'& svg': {
			blockSize: 'var(--luke-icon-size-small)',
			inlineSize: 'var(--luke-icon-size-small)',
		},
	}),
	group: css({
		alignItems: 'center',
		backgroundColor: 'var(--luke-color-surface-recessed)',
		borderRadius: 'var(--luke-radius-full)',
		display: 'flex',
		gap: 'var(--luke-space-100)',
		padding: 'var(--luke-space-100)',
	}),
};
