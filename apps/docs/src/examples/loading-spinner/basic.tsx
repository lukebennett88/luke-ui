import { LoadingSpinner } from '@luke-ui/react/loading-spinner';
import type { JSX } from 'react';

export const meta = {
	title: 'Loading Spinner — Basic',
	description: 'Indeterminate spinner with a default pending label.',
};

export default function Basic(): JSX.Element {
	return <LoadingSpinner aria-label="Loading" />;
}
