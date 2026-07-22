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
		blockSize: 'controlSize.small',
		borderRadius: 'control',
		borderStyle: 'none',
		color: 'text.secondary',
		cursor: 'pointer',
		display: 'inline-flex',
		inlineSize: 'controlSize.small',
		justifyContent: 'center',
		'&[data-hovered]': {
			backgroundColor: 'intent.neutral.surface.subtleHover',
			color: 'text.primary',
		},
		'&[data-selected]': {
			backgroundColor: 'intent.neutral.surface.solid',
			color: 'intent.neutral.onSolid',
		},
		'&[data-focus-visible]': {
			outlineColor: 'border.focus',
			outlineStyle: 'solid',
			outlineWidth: '2px',
			outlineOffset: '2px',
		},
		'& svg': {
			blockSize: 'iconSize.small',
			inlineSize: 'iconSize.small',
		},
	}),
	group: css({
		alignItems: 'center',
		backgroundColor: 'surface.recessed',
		borderRadius: 'full',
		display: 'flex',
		gap: '100',
		padding: '100',
	}),
};
