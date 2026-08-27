import { expect, test } from 'vite-plus/test';
import { parseFrontmatterBlocks, readFrontmatter } from './docs-frontmatter.js';

test('reads inline and continued frontmatter values', () => {
	expect(
		readFrontmatter(`---
title: Button
description:
  A labelled control
  for actions.
source: packages/@luke-ui/react/src/exports/button.ts
---

Body.
`),
	).toEqual({
		description: 'A labelled control for actions.',
		source: 'packages/@luke-ui/react/src/exports/button.ts',
		title: 'Button',
	});
});

test('returns null when the document has no YAML fence', () => {
	expect(parseFrontmatterBlocks('# No frontmatter\n')).toBeNull();
});
