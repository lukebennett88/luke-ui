import { Prose } from '@luke-ui/react/prose';

export default () => {
	return (
		<Prose style={{ maxInlineSize: '18rem' }}>
			<figure>
				<img
					alt="Looking up between tall canyon walls at a strip of blue sky"
					height={800}
					src="https://images.unsplash.com/photo-1479030160180-b1860951d696?auto=format&fit=crop&w=1200&q=80"
					width={1200}
				/>
			</figure>
		</Prose>
	);
};
