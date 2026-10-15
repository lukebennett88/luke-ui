import { Box } from '@luke-ui/react/box';
import { ComboboxField, ComboboxItem } from '@luke-ui/react/combobox-field';
import { Stack } from '@luke-ui/react/stack';
import { Text } from '@luke-ui/react/text';
import { useState } from 'react';
import type { Key } from 'react-aria-components/ComboBox';
import { themeTokens } from '../generated/token-reference.generated.js';
import { tokenRowId } from '../lib/token-navigation.js';
import { findTokens } from '../lib/token-search.js';
import { TokenPath } from './token-reference-parts.js';
import * as styles from './token-reference.css.js';

/** Finds a token without hiding any catalogue section. */
export function TokenFind() {
	const [query, setQuery] = useState('');
	const [selectedPath, setSelectedPath] = useState<Key | null>(null);
	const results = query.trim() === '' ? themeTokens : findTokens(query);

	return (
		<Stack className="not-prose" marginBlockStart="sp24">
			<Box maxInlineSize="32rem">
				<ComboboxField
					inputValue={query}
					items={results}
					label="Find a token"
					onChange={(path) => {
						setSelectedPath(path);
						if (path === null) return;
						window.location.hash = tokenRowId(String(path));
					}}
					onInputChange={setQuery}
					placeholder="Token path or CSS variable"
					value={selectedPath}
				>
					{(token) => (
						<ComboboxItem id={token.path} textValue={`vars.${token.path}`}>
							<Box minInlineSize="0">
								<Text className={styles.code} shouldDisableTrim typography="label">
									<TokenPath path={token.path} />
								</Text>
							</Box>
						</ComboboxItem>
					)}
				</ComboboxField>
			</Box>
		</Stack>
	);
}
