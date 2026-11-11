import { decodeCodeHash } from '@luke-ui/playground-core/hash';
import { expect, test } from 'vite-plus/test';
import { encodeDocsPlaygroundHash } from './docs-playground-hash.js';

const SAMPLE_CODE =
	"import { Button } from '@luke-ui/react/button';\n\nexport default function Example() {\n\treturn <Button>Save changes</Button>;\n}\n";

// Shared links already in the wild use this exact encoding, so it must not drift.
const SAMPLE_HASH =
	'code=JYWwDg9gTgLgBAbzgIQK4xhAdnAvnAMyghDgHIABAG1QGsBTAWlWAHop6BDAYxlYCN0mLGQDcAKHH0AHpFhwAJvQKdUVeAVRZewbHACi0zuCr0AFAEpE4gJAcYqKDgA8aDNgB8AZU4A3enDcABacWADm9ADOzqxuwh4SuOJAA&shape=0.47%2C0.0%2C0.35%2C2.37%2C0.1%2C0.0';

test('encodes a docs playground link byte for byte', () => {
	expect(encodeDocsPlaygroundHash(SAMPLE_CODE)).toBe(SAMPLE_HASH);
	expect(encodeDocsPlaygroundHash('')).toBe('code=Q&shape=0.0');
});

test('decodes a shared docs playground link', () => {
	expect(decodeCodeHash(`#${SAMPLE_HASH}`)).toBe(SAMPLE_CODE);
});
