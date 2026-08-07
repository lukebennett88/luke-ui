import { useThemeScopeProps } from '@luke-ui/react/theme';
import type { PropsWithChildren, ReactNode } from 'react';
import { useRef } from 'react';
import { createPortal } from 'react-dom';

type PopoverProps = PropsWithChildren<{ trigger: ReactNode }>;

export function Popover({ children, trigger }: PopoverProps) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const themeScopeProps = useThemeScopeProps({ sourceRef: triggerRef });

	return (
		<>
			<button ref={triggerRef} type="button">
				{trigger}
			</button>
			{createPortal(<div {...themeScopeProps}>{children}</div>, document.body)}
		</>
	);
}
