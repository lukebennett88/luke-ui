import { Button as RacButton } from 'react-aria-components/Button';
import { ListBox, ListBoxItem } from 'react-aria-components/ListBox';
import { Popover } from 'react-aria-components/Popover';
import type { Key } from 'react-aria-components/Select';
import { Select, SelectValue } from 'react-aria-components/Select';
import * as styles from '../styles/settings.css.js';

type Option = { label: string; value: string };

export function SettingsSelect({
	id,
	isDisabled,
	label,
	onChange,
	options,
	value,
}: {
	id: string;
	isDisabled?: boolean;
	label: string;
	onChange: (value: string) => void;
	options: ReadonlyArray<Option>;
	value: string;
}) {
	return (
		<Select
			aria-label={label}
			id={id}
			isDisabled={isDisabled}
			onSelectionChange={(key: Key | null) => {
				if (key != null) onChange(String(key));
			}}
			selectedKey={value}
		>
			<RacButton className={styles.selectTrigger}>
				<SelectValue />
			</RacButton>
			<Popover className={styles.selectPopover} placement="bottom end">
				<ListBox className={styles.selectList}>
					{options.map((option) => (
						<ListBoxItem
							className={styles.selectItem}
							id={option.value}
							key={option.value}
							textValue={option.label}
						>
							{option.label}
						</ListBoxItem>
					))}
				</ListBox>
			</Popover>
		</Select>
	);
}
