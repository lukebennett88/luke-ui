import { Icon } from '@luke-ui/react/icon';
import { Text, textRecipe } from '@luke-ui/react/text';
import { rootClassName } from '@luke-ui/react/theme';
import { Track } from '@luke-ui/react/track';
import { cx } from '@luke-ui/react/utils';
import { Button as RacButton } from 'react-aria-components/Button';
import { ListBox, ListBoxItem } from 'react-aria-components/ListBox';
import { Popover } from 'react-aria-components/Popover';
import { Select, SelectValue } from 'react-aria-components/Select';
import * as styles from '../styles/settings.css.js';

type Option = { label: string; value: string };

export function SettingsSelect({
	'aria-describedby': ariaDescribedBy,
	id,
	isPending,
	label,
	onChange,
	options,
	value,
}: {
	'aria-describedby'?: string;
	id: string;
	isPending?: boolean;
	label: string;
	onChange: (value: string) => void;
	options: ReadonlyArray<Option>;
	value: string;
}) {
	return (
		<Select
			aria-label={label}
			aria-describedby={ariaDescribedBy}
			id={id}
			onChange={(key) => {
				if (!isPending && key != null) onChange(String(key));
			}}
			value={value}
		>
			<RacButton className={styles.selectTrigger} isPending={isPending}>
				<SelectValue
					className={cx(
						textRecipe({
							shouldDisableTrim: true,
							typography: 'label',
						}),
						styles.selectTriggerValue,
					)}
				/>
				<Icon
					aria-hidden
					className={styles.selectTriggerChevron}
					name="chevronDown"
					size="xsmall"
				/>
			</RacButton>
			<Popover
				className={cx(rootClassName, styles.selectPopover)}
				containerPadding={16}
				offset={4}
				placement="bottom end"
			>
				<ListBox className={styles.selectList} items={options}>
					{(option) => (
						<ListBoxItem className={styles.selectItem} id={option.value} textValue={option.label}>
							{({ isSelected }) => (
								<Track
									className={styles.selectItemTrack}
									gap="sp8"
									railAlignment="firstLine"
									railEnd={
										isSelected ? (
											<Icon
												aria-hidden
												className={styles.selectItemCheck}
												name="check"
												size="xsmall"
											/>
										) : undefined
									}
								>
									<Text shouldDisableTrim typography="label">
										{option.label}
									</Text>
								</Track>
							)}
						</ListBoxItem>
					)}
				</ListBox>
			</Popover>
		</Select>
	);
}
