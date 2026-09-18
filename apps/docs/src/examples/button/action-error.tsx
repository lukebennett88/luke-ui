import { Button } from '@luke-ui/react/button';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import type { FallbackProps } from 'react-error-boundary';
import { ErrorBoundary } from 'react-error-boundary';

export default () => {
	return (
		<Stack minBlockSize="4.5rem">
			<ErrorBoundary FallbackComponent={ErrorFallback}>
				<Button pressAction={save}>Save changes</Button>
			</ErrorBoundary>
		</Stack>
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
		<Stack gap="sp12">
			<Text color="danger" role="alert">
				{message}
			</Text>
			<Button onPress={resetErrorBoundary}>Try again</Button>
		</Stack>
	);
}
