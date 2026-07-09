import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { MonitorIcon, SmartphoneIcon, TabletIcon } from 'lucide-react';

const VIEWPORTS = [
	{ Icon: MonitorIcon, label: 'Desktop', width: '100%' },
	{ Icon: TabletIcon, label: 'Tablet', width: '768px' },
	{ Icon: SmartphoneIcon, label: 'Mobile', width: '375px' },
] as const;

export type ViewportWidth = (typeof VIEWPORTS)[number]['width'];

type ViewportToggleProps = {
	onChange: (width: ViewportWidth) => void;
	value: ViewportWidth;
};

export function ViewportToggle({ onChange, value }: ViewportToggleProps) {
	return (
		<div className="flex items-center gap-1" role="group" aria-label="Preview viewport">
			{VIEWPORTS.map(({ Icon, label, width }) => (
				<button
					aria-label={label}
					aria-pressed={value === width}
					className={buttonVariants({
						className: value === width ? 'bg-fd-accent text-fd-accent-foreground' : undefined,
						size: 'icon-sm',
						variant: 'ghost',
					})}
					key={width}
					onClick={() => onChange(width)}
					title={label}
					type="button"
				>
					<Icon className="size-4" />
				</button>
			))}
		</div>
	);
}
