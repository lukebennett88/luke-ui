import { Box } from '@luke-ui/react/box';
import { Link } from '@luke-ui/react/link';
import { Text } from '@luke-ui/react/text';

export default () => {
	return (
		<Box display="flex" flexDirection="column" gap="sp16">
			<Text elementType="p">
				A link like <Link href="#example">this one</Link> can sit inline within a sentence.
			</Text>
			<Link href="#example" isStandalone>
				It can also stand on its own
			</Link>
		</Box>
	);
};
