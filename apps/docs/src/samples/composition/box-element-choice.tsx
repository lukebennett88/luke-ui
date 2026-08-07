import { Box } from '@luke-ui/react/box';
import type { ComponentPropsWithRef } from 'react';

export function AccountLink() {
	// Changes the rendered element. Box's DOM props follow that element.
	return (
		<Box elementType="a" href="/account" padding="400">
			Account summary
		</Box>
	);
}

export function WrappedSummary() {
	// Keeps the rendered element a `div` and wraps it with a compatible custom component.
	return (
		<Box padding="400" render={(props) => <CompatibleWrapper {...props} />}>
			Account summary
		</Box>
	);
}

function CompatibleWrapper(props: ComponentPropsWithRef<'div'>) {
	return <div {...props} />;
}
