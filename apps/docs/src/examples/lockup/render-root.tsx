import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';
import { vars } from '@luke-ui/react/theme';

export default () => {
	return (
		<Lockup gap="sp12" margin="0" renderRoot={(domProps) => <figure {...domProps} />}>
			<LockupRail>
				<img
					alt="Looking up between tall canyon walls at a strip of blue sky"
					src="https://images.unsplash.com/photo-1479030160180-b1860951d696?auto=format&fit=crop&w=200&q=80"
					style={{
						blockSize: '4rem',
						borderRadius: vars.radius.detail,
						inlineSize: '4rem',
						objectFit: 'cover',
					}}
				/>
			</LockupRail>
			<LockupBody renderRoot={(domProps) => <figcaption {...domProps} />}>
				Example caption
			</LockupBody>
		</Lockup>
	);
};
