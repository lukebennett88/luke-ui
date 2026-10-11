import type { ReactNode } from 'react';
import { Button } from 'react-aria-components/Button';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Popover } from 'react-aria-components/Popover';

/** A React Aria popover opened from a dark scope. It portals to `<body>`, so it repeats the mode. */
export function DarkPanelHelp({ children }: { children: ReactNode }) {
	return (
		<section data-color-mode="dark">
			<DialogTrigger>
				<Button>Help</Button>
				<Popover data-color-mode="dark">
					<Dialog aria-label="Help">{children}</Dialog>
				</Popover>
			</DialogTrigger>
		</section>
	);
}
