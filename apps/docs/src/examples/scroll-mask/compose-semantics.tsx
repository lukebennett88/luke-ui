import { Box } from '@luke-ui/react/box';
import { Link } from '@luke-ui/react/link';
import { ScrollMask } from '@luke-ui/react/scroll-mask';

export default () => {
	return (
		<nav aria-label="Example navigation">
			<ScrollMask aria-label="Example destinations" inlineSize="16rem" padding="sp12">
				<Box display="flex" gap="sp16">
					{['First', 'Second', 'Third', 'Fourth'].map((item) => (
						<Link key={item} href={`#${item.toLowerCase()}-destination`} style={{ flex: 'none' }}>
							{item} destination
						</Link>
					))}
				</Box>
			</ScrollMask>
		</nav>
	);
};
