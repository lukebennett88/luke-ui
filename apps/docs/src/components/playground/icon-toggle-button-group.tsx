import { Icon } from '@luke-ui/react/icon';
import type { IconName } from '@luke-ui/react/icon';
import { cx } from '@luke-ui/react/utils';
import type { Selection } from 'react-aria-components/GridList';
import { ToggleButton } from 'react-aria-components/ToggleButton';
import { ToggleButtonGroup } from 'react-aria-components/ToggleButtonGroup';

/** Rounded pill group shared by every toggle group in this file, matched on shape and focus. */
const GROUP_CLASS_NAME = 'flex items-center rounded-full bg-fd-secondary p-0.5';

/** Selected/unselected pill treatment shared by icon and text toggle buttons. */
const PILL_CLASS_NAME =
	'cursor-pointer rounded-full text-fd-muted-foreground transition-colors data-hovered:bg-fd-accent data-hovered:text-fd-accent-foreground data-pressed:bg-fd-accent';
const PILL_SELECTED_CLASS_NAME = 'bg-fd-background text-fd-foreground shadow-sm';

function toSelectionChangeHandler<Value extends string>(
	options: ReadonlyArray<{ value: Value }>,
	onChange: (value: Value) => void,
) {
	return (selection: Selection) => {
		if (selection === 'all') return;

		const selectedKey = selection.values().next().value;
		const selectedOption = options.find((option) => option.value === selectedKey);
		if (!selectedOption) return;

		onChange(selectedOption.value);
	};
}

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

/** A round icon-only pill group, for choices with well-known glyphs such as light/dark/system. */
export function IconToggleButtonGroup<Value extends string>({
	label,
	onChange,
	options,
	value,
}: IconToggleButtonGroupProps<Value>) {
	return (
		<ToggleButtonGroup
			aria-label={label}
			className={GROUP_CLASS_NAME}
			disallowEmptySelection={value !== null}
			onSelectionChange={toSelectionChangeHandler(options, onChange)}
			orientation="horizontal"
			selectedKeys={value === null ? [] : [value]}
			selectionMode="single"
		>
			{options.map(({ icon, label: optionLabel, value: optionValue }) => (
				<ToggleButton
					aria-label={optionLabel}
					className={({ isSelected }) =>
						cx(
							'flex size-8 items-center justify-center',
							PILL_CLASS_NAME,
							isSelected && PILL_SELECTED_CLASS_NAME,
						)
					}
					id={optionValue}
					key={optionValue}
				>
					<Icon aria-hidden className="size-4" name={icon} />
				</ToggleButton>
			))}
		</ToggleButtonGroup>
	);
}

type TextToggleItem<Value extends string> = {
	label: string;
	value: Value;
};

type TextToggleButtonGroupProps<Value extends string> = {
	label: string;
	onChange: (value: Value) => void;
	options: ReadonlyArray<TextToggleItem<Value>>;
	value: Value;
};

/**
 * A round pill group with visible text labels, for choices without an established glyph, such as
 * a named theme identity. Matches `IconToggleButtonGroup` in height, radius, and focus treatment.
 */
export function TextToggleButtonGroup<Value extends string>({
	label,
	onChange,
	options,
	value,
}: TextToggleButtonGroupProps<Value>) {
	return (
		<ToggleButtonGroup
			aria-label={label}
			className={GROUP_CLASS_NAME}
			disallowEmptySelection
			onSelectionChange={toSelectionChangeHandler(options, onChange)}
			orientation="horizontal"
			selectedKeys={[value]}
			selectionMode="single"
		>
			{options.map(({ label: optionLabel, value: optionValue }) => (
				<ToggleButton
					className={({ isSelected }) =>
						cx(
							'flex h-8 items-center justify-center whitespace-nowrap px-3 font-medium text-xs',
							PILL_CLASS_NAME,
							isSelected && PILL_SELECTED_CLASS_NAME,
						)
					}
					id={optionValue}
					key={optionValue}
				>
					{optionLabel}
				</ToggleButton>
			))}
		</ToggleButtonGroup>
	);
}
