import { buttonRecipe } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import type { IconName } from '@luke-ui/react/icon';
import { Icon } from '@luke-ui/react/icon';
import type { ComponentProps, PropsWithChildren, ReactNode } from 'react';
import { useId } from 'react';
import type { Selection } from 'react-aria-components/GridList';
import { ToggleButton } from 'react-aria-components/ToggleButton';
import { ToggleButtonGroup } from 'react-aria-components/ToggleButtonGroup';

type IconToggleItem<Value extends string> = {
	icon: IconName;
	label: string;
	value: Value;
};

type IconToggleButtonGroupBaseProps<Value extends string> = {
	/** Read by assistive technology after the label, for example to say what no selection means. */
	description?: string;
	label: string;
	options: ReadonlyArray<IconToggleItem<Value>>;
};

type RequiredIconToggleButtonGroupProps<Value extends string> =
	IconToggleButtonGroupBaseProps<Value> & {
		allowEmptySelection?: false;
		onChange: (value: Value) => void;
		value: Value;
	};

type OptionalIconToggleButtonGroupProps<Value extends string> =
	IconToggleButtonGroupBaseProps<Value> & {
		/** Lets the pressed toggle be pressed again to leave nothing selected. */
		allowEmptySelection: true;
		/** Called with `null` when the pressed toggle is pressed again. */
		onChange: (value: Value | null) => void;
		value: Value | null;
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
 * A round icon-only pill group for choices with well-known glyphs, such as a preview viewport.
 * One toggle is always selected unless `allowEmptySelection` lets the selected one be pressed again,
 * which reports `null`.
 */
export function IconToggleButtonGroup<Value extends string>(
	props: RequiredIconToggleButtonGroupProps<Value>,
): ReactNode;
export function IconToggleButtonGroup<Value extends string>(
	props: OptionalIconToggleButtonGroupProps<Value>,
): ReactNode;
export function IconToggleButtonGroup<Value extends string>(
	props: RequiredIconToggleButtonGroupProps<Value> | OptionalIconToggleButtonGroupProps<Value>,
) {
	const { description, label, options } = props;
	return (
		<ToggleGroup
			allowEmptySelection={props.allowEmptySelection === true}
			description={description}
			label={label}
			onChange={(selected) => {
				if (props.allowEmptySelection) props.onChange(selected);
				else if (selected !== null) props.onChange(selected);
			}}
			options={options}
			value={props.value}
		>
			{options.map(({ icon, label: optionLabel, value: optionValue }) => (
				<PillToggle ariaLabel={optionLabel} key={optionValue} value={optionValue}>
					<Icon name={icon} size="xsmall" />
				</PillToggle>
			))}
		</ToggleGroup>
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
		<ToggleGroup
			label={label}
			onChange={(selected) => {
				if (selected !== null) onChange(selected);
			}}
			options={options}
			value={value}
		>
			{options.map((option) => (
				<PillToggle key={option.value} value={option.value}>
					{option.label}
				</PillToggle>
			))}
		</ToggleGroup>
	);
}

type ToggleGroupProps<Value extends string> = PropsWithChildren<{
	allowEmptySelection?: boolean;
	description?: string;
	label: string;
	onChange: (value: Value | null) => void;
	options: ReadonlyArray<{ value: Value }>;
	value: Value | null;
}>;

function ToggleGroup<Value extends string>({
	allowEmptySelection = false,
	children,
	description,
	label,
	onChange,
	options,
	value,
}: ToggleGroupProps<Value>) {
	const descriptionId = useId();

	return (
		<Cluster
			flexWrap="nowrap"
			gap="space.8"
			renderRoot={(domProps) => (
				<ToggleButtonGroup
					{...domProps}
					aria-describedby={description ? descriptionId : undefined}
					aria-label={label}
					disallowEmptySelection={!allowEmptySelection}
					onSelectionChange={toSelectionChangeHandler(options, onChange)}
					orientation="horizontal"
					selectedKeys={value === null ? [] : [value]}
					selectionMode="single"
				/>
			)}
		>
			{description ? (
				<span hidden id={descriptionId}>
					{description}
				</span>
			) : null}
			{children}
		</Cluster>
	);
}

type PillToggleProps = PropsWithChildren<{ ariaLabel?: string; value: string }>;

function PillToggle({ ariaLabel, children, value }: PillToggleProps) {
	return (
		<ToggleButton
			aria-label={ariaLabel}
			className={buttonRecipe({
				prominence: 'low',
				size: 'small',
				tone: 'neutral',
			})}
			id={value}
			render={renderToggleButton}
		>
			{children}
		</ToggleButton>
	);
}

type RenderToggleButton = ComponentProps<typeof ToggleButton>['render'];

/**
 * Keeps `data-pressed` set while selected, so the selected toggle reuses `buttonRecipe`'s pressed
 * styles. It is only a styling hook; `aria-pressed` comes from RAC's selection props.
 */
const renderToggleButton: RenderToggleButton = (domProps, state) => {
	return <button {...domProps} data-pressed={state.isPressed || state.isSelected || undefined} />;
};

function toSelectionChangeHandler<Value extends string>(
	options: ReadonlyArray<{ value: Value }>,
	onChange: (value: Value | null) => void,
) {
	return (selection: Selection) => {
		if (selection === 'all') return;

		const selectedKey = selection.values().next().value;
		if (selectedKey === undefined) {
			onChange(null);
			return;
		}
		const selectedOption = options.find((option) => option.value === selectedKey);
		if (!selectedOption) return;

		onChange(selectedOption.value);
	};
}
