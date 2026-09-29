type Option = { label: string; value: string };

export function SettingsSelect({
	disabled,
	id,
	label,
	onChange,
	options,
	value,
}: {
	disabled?: boolean;
	id: string;
	label: string;
	onChange: (value: string) => void;
	options: ReadonlyArray<Option>;
	value: string;
}) {
	return (
		<select
			aria-label={label}
			className="settings-select"
			disabled={disabled}
			id={id}
			onChange={(event) => onChange(event.target.value)}
			value={value}
		>
			{options.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	);
}
