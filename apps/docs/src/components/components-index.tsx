import type { JSX } from 'react';
import type { ComponentIndexGroup } from '../generated/components-index.generated.js';
import { componentIndexGroups } from '../generated/components-index.generated.js';
import { DocsLink } from './docs-link.js';

/**
 * Purpose-grouped index of every component guide, generated from the guides themselves. The
 * components landing page renders from this component so the documented set never drifts.
 */
export function ComponentsIndex(): JSX.Element {
	return (
		<div className="not-prose flex flex-col gap-10">
			{componentIndexGroups.map((group) => (
				<CategoryGroup group={group} key={group.title} />
			))}
		</div>
	);
}

function CategoryGroup({ group }: { group: ComponentIndexGroup }) {
	return (
		<section>
			<h2 className="mb-3 mt-0 flex items-baseline gap-2 font-semibold text-fd-foreground text-lg">
				{group.title}
				<span className="text-fd-muted-foreground text-sm tabular-nums">
					{group.entries.length}
				</span>
			</h2>
			<ul className="m-0 grid list-none grid-cols-1 gap-px overflow-hidden rounded-xl border border-fd-border bg-fd-border p-0 sm:grid-cols-2 lg:grid-cols-3">
				{group.entries.map((entry) => (
					<li className="m-0 p-0" key={entry.url}>
						<DocsLink
							className="flex h-full flex-col gap-1 bg-fd-background p-4 transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring focus-visible:ring-inset"
							params={{ _splat: entry.url.slice(1) }}
							to="/$"
						>
							<span className="font-medium text-fd-foreground text-sm">{entry.name}</span>
							<span className="text-fd-muted-foreground text-sm">{entry.description}</span>
						</DocsLink>
					</li>
				))}
			</ul>
		</section>
	);
}
