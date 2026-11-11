import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import type { BoxComponent } from './box.js';
import { createFixture } from './fixture.js';

type Published = Record<string, string>;

/** Mounts the fixture, or with `?ssr` server-renders it to a string and hydrates that markup. */
export function mount(Box: BoxComponent, published?: { setA: Published; setB: Published }) {
	const container = document.querySelector('#root')!;
	const report = { hydrationErrors: [] as Array<string>, ready: false, serverHtml: '' };
	Object.assign(window, { report });
	const Fixture = createFixture(Box);
	const app = (portal: boolean) => <Fixture portal={portal} published={published} />;

	if (new URLSearchParams(location.search).has('ssr')) {
		report.serverHtml = renderToString(app(false));
		container.innerHTML = report.serverHtml;
		hydrateRoot(container, app(false), {
			onRecoverableError: (error) => report.hydrationErrors.push(String(error)),
		});
	} else {
		createRoot(container).render(app(true));
	}
	requestAnimationFrame(() => {
		report.ready = true;
	});
}
