import { expect, test } from 'vite-plus/test';
import { HOME_INTRO, HOME_SECTIONS, homeMarkdown, INSTALL_COMMAND } from './home-content.js';

test('the markdown twin carries the homepage intro, install command, and every section link', () => {
	const markdown = homeMarkdown();

	expect(markdown.startsWith(`# Luke UI\n\n${HOME_INTRO}\n`)).toBe(true);
	expect(markdown).toContain(`\`\`\`sh\n${INSTALL_COMMAND}\n\`\`\``);
	for (const section of HOME_SECTIONS) {
		expect(markdown).toContain(`- [${section.title}](${section.href}): ${section.description}`);
	}
});
