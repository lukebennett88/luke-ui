import type { Root } from 'fumadocs-core/page-tree';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import type { ReactNode } from 'react';
import { DocsShell } from './docs-shell.js';
import { DocsTreePathnameProvider } from './docs-tree-pathname-provider.js';

function ContentContainer({ children }: { children?: ReactNode }) {
	return <>{children}</>;
}

function EmptySlot() {
	return null;
}

export function FumadocsLayoutAdapter({ children, tree }: { children: ReactNode; tree: Root }) {
	return (
		<DocsTreePathnameProvider>
			<DocsShell tree={tree}>
				<DocsLayout
					nav={{ enabled: false }}
					slots={{
						container: ContentContainer,
						header: EmptySlot,
						sidebar: {
							collapseTrigger: EmptySlot,
							provider: ContentContainer,
							root: EmptySlot,
							trigger: EmptySlot,
							useSidebar: () => ({ collapsed: false, open: false, setOpen: () => {} }),
						},
					}}
					tabs={false}
					tree={tree}
				>
					{children}
				</DocsLayout>
			</DocsShell>
		</DocsTreePathnameProvider>
	);
}
