import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { ExamplePreviewRunner } from '../../components/example-preview-runner.js';

export const Route = createFileRoute('/examples/preview')({
	component: ExamplePreview,
	head: () => ({
		meta: [{ title: 'Example preview — Luke UI' }],
	}),
	validateSearch: (search) => ({
		mode: search.mode === 'full-bleed' ? ('full-bleed' as const) : ('inset' as const),
		src: typeof search.src === 'string' ? search.src : undefined,
	}),
});

function ExamplePreview() {
	const { mode, src } = Route.useSearch();

	return (
		<ClientOnly fallback={null}>
			<ExamplePreviewRunner key={src} mode={mode} src={src} />
		</ClientOnly>
	);
}
