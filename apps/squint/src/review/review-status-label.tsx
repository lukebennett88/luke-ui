import { Icon } from '@luke-ui/react/icon';
import { Text } from '@luke-ui/react/text';
import type { Review } from '../api/review-api.js';
import { REVIEW_STATUSES } from './review-status.js';
import { status } from './review.css.js';

/** A review's state in its tone, with the decision's icon. `children` is the text to show. */
export function ReviewStatusLabel({ children, review }: { children: string; review: Review }) {
	const { icon, tone } = REVIEW_STATUSES[review.state];
	return (
		<Text className={status} color={tone} typography="label">
			{icon ? <Icon name={icon} size="xsmall" /> : null}
			{children}
		</Text>
	);
}
