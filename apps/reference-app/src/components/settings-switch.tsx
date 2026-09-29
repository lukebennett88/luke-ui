export function SettingsSwitch({
	checked,
	disabled,
	id,
	label,
	onChange,
}: {
	checked: boolean;
	disabled?: boolean;
	id: string;
	label: string;
	onChange: (checked: boolean) => void;
}) {
	return (
		<button
			aria-checked={checked}
			aria-label={label}
			className="settings-switch"
			disabled={disabled}
			id={id}
			onClick={() => onChange(!checked)}
			role="switch"
			type="button"
		>
			<span className="settings-switch-thumb" />
		</button>
	);
}
