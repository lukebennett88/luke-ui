import { Numeral } from '@luke-ui/react/numeral';
import type { JSX } from 'react';

export default function Basic(): JSX.Element {
	return <Numeral value={12_345.67} />;
}
