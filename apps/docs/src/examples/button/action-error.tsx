import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Text } from '@luke-ui/react/text';
import type { FallbackProps } from 'react-error-boundary';
import { ErrorBoundary } from 'react-error-boundary';

export default () => {
	return (
		<ErrorBoundary FallbackComponent={ErrorFallback}>
			<Button pressAction={save}>Save changes</Button>
		</ErrorBoundary>
	);
};

async function save() {
	await new Promise((resolve) => {
		setTimeout(resolve, 400);
	});
	throw new Error('Could not save changes');
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
	const message = error instanceof Error ? error.message : 'Something went wrong';

	return (
		<Box display="flex" flexDirection="column" gap="sp12">
			<Text color="danger" role="alert">
				{message}
			</Text>
			<Button onPress={resetErrorBoundary}>Try again</Button>
		</Box>
	);
}
