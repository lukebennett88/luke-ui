import { definePlugin, defineRule } from 'vite-plus/lint/plugins';

const leadingIssueReference = /^[\s*]*#\d+\b/;

const noLeadingIssueReference = defineRule({
	meta: {
		messages: {
			leadingIssueReference:
				'Explain the code, not the issue that changed it. See docs/DOCUMENTATION.md#comments-and-jsdoc.',
		},
	},
	create(context) {
		return {
			Program() {
				for (const comment of context.sourceCode.getAllComments()) {
					if (leadingIssueReference.test(comment.value)) {
						context.report({ loc: comment.loc, messageId: 'leadingIssueReference' });
					}
				}
			},
		};
	},
});

export default definePlugin({
	meta: { name: 'luke-ui' },
	rules: { 'no-leading-issue-reference': noLeadingIssueReference },
});
