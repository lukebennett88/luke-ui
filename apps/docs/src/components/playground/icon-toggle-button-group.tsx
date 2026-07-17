import { Icon } from '@luke-ui/react/icon';
import type { IconName } from '@luke-ui/react/icon';
import { cx } from '@luke-ui/react/utils';
import type { Selection } from 'react-aria-components/GridList';
import { ToggleButton } from 'react-aria-components/ToggleButton';
import { ToggleButtonGroup } from 'react-aria-components/ToggleButtonGroup';

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
	const handleSelectionChange = (selection: Selection) => {
		if (selection === 'all') return;

		const selectedKey = selection.values().next().value;
		const selectedOption = options.find((option) => option.value === selectedKey);
		if (!selectedOption) return;

		onChange(selectedOption.value);
	};

	return (
		<ToggleButtonGroup
			aria-label={label}
			className="flex items-center rounded-full bg-fd-secondary p-0.5"
			disallowEmptySelection={value !== null}
			onSelectionChange={handleSelectionChange}
			orientation="horizontal"
			selectedKeys={value === null ? [] : [value]}
			selectionMode="single"
		>
			{options.map(({ icon, label: optionLabel, value: optionValue }) => (
				<ToggleButton
					aria-label={optionLabel}
					className={({ isSelected }) => {
						return cx(
							'flex size-8 cursor-pointer items-center justify-center rounded-full text-fd-muted-foreground transition-colors data-hovered:bg-fd-accent data-hovered:text-fd-accent-foreground data-pressed:bg-fd-accent',
							isSelected && 'bg-fd-background text-fd-foreground shadow-sm',
						);
					}}
					id={optionValue}
					key={optionValue}
				>
					<Icon aria-hidden className="size-4" name={icon} />
				</ToggleButton>
			))}
		</ToggleButtonGroup>
	);
}
