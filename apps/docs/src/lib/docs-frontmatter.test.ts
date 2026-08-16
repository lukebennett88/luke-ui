import { expect, test } from 'vite-plus/test';
import { parseFrontmatterBlocks, readFrontmatter } from './docs-frontmatter.js';

test('reads inline and continued frontmatter values', () => {
	expect(
		readFrontmatter(`---
title: Button
description:
  A labelled control
  for actions.
source: packages/@luke-ui/react/src/button
---

Body.
`),
	).toEqual({
		description: 'A labelled control for actions.',
		source: 'packages/@luke-ui/react/src/button',
		title: 'Button',
	});
});

test('returns null when the document has no YAML fence', () => {
	expect(parseFrontmatterBlocks('# No frontmatter\n')).toBeNull();
});
