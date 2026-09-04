import { buttonRecipe } from '@luke-ui/react/button';
import type { ButtonRecipeVariants } from '@luke-ui/react/button';
import type { IconName } from '@luke-ui/react/icon';
import { Icon } from '@luke-ui/react/icon';
import { cx } from '@luke-ui/react/utils';
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
	appearance?: ToggleButtonAppearance;
	label: string;
	onChange: (value: Value) => void;
	options: ReadonlyArray<IconToggleItem<Value>>;
	value: Value | null;
};

type TextToggleItem<Value extends string> = {
	label: string;
	value: Value;
};

type ToggleButtonAppearance = Extract<ButtonRecipeVariants['appearance'], 'subtle' | 'ghost'>;

type TextToggleButtonGroupProps<Value extends string> = {
	appearance?: ToggleButtonAppearance;
	label: string;
	onChange: (value: Value) => void;
	options: ReadonlyArray<TextToggleItem<Value>>;
	value: Value;
};

/**
 * A round icon-only pill group for choices with well-known glyphs such as light, dark, and system.
 * It uses the `subtle` button appearance by default. Set `appearance` to `ghost` for controls on a
 * shared surface.
 */
export function IconToggleButtonGroup<Value extends string>({
	appearance = 'subtle',
	label,
	onChange,
	options,
	value,
}: IconToggleButtonGroupProps<Value>) {
	return (
		<ToggleButtonGroup
			aria-label={label}
			className={groupClassName(appearance)}
			disallowEmptySelection={value !== null}
			onSelectionChange={toSelectionChangeHandler(options, onChange)}
			orientation="horizontal"
			selectedKeys={value === null ? [] : [value]}
			selectionMode="single"
		>
			{options.map(({ icon, label: optionLabel, value: optionValue }) => (
				<ToggleButton
					{...toggleButtonStyles(appearance)}
					aria-label={optionLabel}
					id={optionValue}
					key={optionValue}
					render={renderToggleButton}
				>
					<Icon aria-hidden className="size-4" name={icon} />
				</ToggleButton>
			))}
		</ToggleButtonGroup>
	);
}

/**
 * A round pill group with visible text labels for choices without an established glyph, such as a
 * named theme identity. It uses the `subtle` button appearance by default. Set `appearance` to
 * `ghost` for controls on a shared surface. Matches `IconToggleButtonGroup` in height, radius, and
 * focus treatment.
 */
export function TextToggleButtonGroup<Value extends string>({
	appearance = 'subtle',
	label,
	onChange,
	options,
	value,
}: TextToggleButtonGroupProps<Value>) {
	return (
		<ToggleButtonGroup
			aria-label={label}
			className={groupClassName(appearance)}
			disallowEmptySelection
			onSelectionChange={toSelectionChangeHandler(options, onChange)}
			orientation="horizontal"
			selectedKeys={[value]}
			selectionMode="single"
		>
			{options.map(({ label: optionLabel, value: optionValue }) => (
				<ToggleButton
					{...toggleButtonStyles(appearance)}
					id={optionValue}
					key={optionValue}
					render={renderToggleButton}
				>
					{optionLabel}
				</ToggleButton>
			))}
		</ToggleButtonGroup>
	);
}

const GROUP_CLASS_NAME = 'flex items-center gap-2';
const GROUP_WELL_CLASS_NAME = 'bg-fd-secondary p-0.5';

function groupClassName(appearance: ToggleButtonAppearance) {
	return cx(GROUP_CLASS_NAME, appearance === 'subtle' && GROUP_WELL_CLASS_NAME);
}

function toggleButtonStyles(appearance: ToggleButtonAppearance) {
	return buttonRecipe({
		appearance,
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
