import type { ReactNode } from 'react';

export function SettingsSection({
	children,
	description,
	title,
}: {
	children: ReactNode;
	description?: string;
	title: string;
}) {
	return (
		<section className="settings-section">
			<h2 className="settings-section-title">{title}</h2>
			{description ? <p className="settings-section-description">{description}</p> : null}
			<div className="settings-panel">{children}</div>
		</section>
	);
}

export function SettingsRow({
	children,
	hint,
	label,
}: {
	children: ReactNode;
	hint?: string;
	label: string;
}) {
	return (
		<div className="settings-row">
			<div className="settings-row-copy">
				<span className="settings-row-label">{label}</span>
				{hint ? <span className="settings-row-hint">{hint}</span> : null}
			</div>
			<div className="settings-row-control">{children}</div>
		</div>
	);
}
