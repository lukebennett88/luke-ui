import { Box } from '@luke-ui/react/box';
import { Icon } from '@luke-ui/react/icon';
import { Lockup, LockupBody, LockupRail } from '@luke-ui/react/lockup';
import { Comparison, ComparisonItem } from '#docs';

export default () => {
	return (
		<Comparison>
			<ComparisonItem label="First line">
				<Box maxInlineSize="18rem">
					<Lockup gap="sp8" railAlignment="firstLine">
						<LockupRail>
							<Icon name="checkCircle" />
						</LockupRail>
						<LockupBody>
							Example message that wraps onto multiple lines when the available space is limited.
						</LockupBody>
					</Lockup>
				</Box>
			</ComparisonItem>
			<ComparisonItem label="Center">
				<Box maxInlineSize="18rem">
					<Lockup gap="sp8" railAlignment="center">
						<LockupRail>
							<Icon name="checkCircle" />
						</LockupRail>
						<LockupBody>
							Example message that wraps onto multiple lines when the available space is limited.
						</LockupBody>
					</Lockup>
				</Box>
			</ComparisonItem>
		</Comparison>
	);
};
