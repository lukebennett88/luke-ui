import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

const PreviewRunner = lazy(() => import('../../components/playground/preview-runner'));

export const Route = createFileRoute('/playground/preview')({
	component: PlaygroundPreview,
	head: () => ({
		meta: [{ title: 'Playground preview — Luke UI' }],
	}),
});

function PlaygroundPreview() {
	return (
		<ClientOnly fallback={null}>
			<Suspense fallback={null}>
				<PreviewRunner />
			</Suspense>
		</ClientOnly>
	);
}
