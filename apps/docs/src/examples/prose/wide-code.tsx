import { Code } from '@luke-ui/react/code';
import { Prose, ProsePre } from '@luke-ui/react/prose';

export default () => {
	return (
		<Prose>
			<ProsePre aria-label="Grid template columns example">
				<Code>
					{
						'grid-template-columns: [full-start] minmax(var(--luke-space-sp24), 1fr) [content-start] minmax(0, 60rem) [content-end] minmax(var(--luke-space-sp24), 1fr) [full-end];'
					}
				</Code>
			</ProsePre>
		</Prose>
	);
};
