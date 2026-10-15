import { buttonRecipe } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import type { IconName } from '@luke-ui/react/icon';
import { Icon } from '@luke-ui/react/icon';
import type { ComponentProps } from 'react';
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
	value: Value;
};

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
 * A round icon-only pill group for choices with well-known glyphs such as light, dark, and system.
 */
export function IconToggleButtonGroup<Value extends string>({
	label,
	onChange,
	options,
	value,
}: IconToggleButtonGroupProps<Value>) {
	return (
		<Cluster
			flexWrap="nowrap"
			gap="sp8"
			renderRoot={(domProps) => (
				<ToggleButtonGroup
					{...domProps}
					aria-label={label}
					disallowEmptySelection
					onSelectionChange={toSelectionChangeHandler(options, onChange)}
					orientation="horizontal"
					selectedKeys={[value]}
					selectionMode="single"
				/>
			)}
		>
			{options.map(({ icon, label: optionLabel, value: optionValue }) => (
				<ToggleButton
					aria-label={optionLabel}
					className={toggleButtonClassName()}
					id={optionValue}
					key={optionValue}
					render={renderToggleButton}
				>
					<Icon name={icon} size="xsmall" />
				</ToggleButton>
			))}
		</Cluster>
	);
}

/**
 * A round pill group with visible text labels for choices without an established glyph, such as a
 * named theme identity. Matches `IconToggleButtonGroup` in height, radius, and focus treatment.
 */
export function TextToggleButtonGroup<Value extends string>({
	label,
	onChange,
	options,
	value,
}: TextToggleButtonGroupProps<Value>) {
	return (
		<Cluster
			flexWrap="nowrap"
			gap="sp8"
			renderRoot={(domProps) => (
				<ToggleButtonGroup
					{...domProps}
					aria-label={label}
					disallowEmptySelection
					onSelectionChange={toSelectionChangeHandler(options, onChange)}
					orientation="horizontal"
					selectedKeys={[value]}
					selectionMode="single"
				/>
			)}
		>
			{options.map(({ label: optionLabel, value: optionValue }) => (
				<ToggleButton
					className={toggleButtonClassName()}
					id={optionValue}
					key={optionValue}
					render={renderToggleButton}
				>
					{optionLabel}
				</ToggleButton>
			))}
		</Cluster>
	);
}

function toggleButtonClassName() {
	return buttonRecipe({
		prominence: 'low',
		size: 'small',
		tone: 'neutral',
	});
}

type RenderToggleButton = ComponentProps<typeof ToggleButton>['render'];

/**
 * Renders the toggle's `<button>` with `data-pressed` kept true while selected, so the selected
 * toggle stays in the recipe's pressed treatment. `data-pressed` is a styling hook; the
 * `aria-pressed` state comes from RAC's selection props.
 */
const renderToggleButton: RenderToggleButton = (domProps, state) => {
	return <button {...domProps} data-pressed={state.isPressed || state.isSelected || undefined} />;
};

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
