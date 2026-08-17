export type GenerateComponentArgs =
	| { kind: 'interactive' }
	| { kind: 'args'; answers: { docsGroup: string; name: string } };

/**
 * Parses `generate:component` CLI args. `--args <name> <docs-group>` skips prompts
 * and uses the plan defaults for the remaining answers.
 */
export function parseGenerateArgs(argv: ReadonlyArray<string>): GenerateComponentArgs {
	const argsIndex = argv.indexOf('--args');
	if (argsIndex === -1) return { kind: 'interactive' };

	const name = argv[argsIndex + 1];
	const docsGroup = argv[argsIndex + 2];
	const extra = argv[argsIndex + 3];
	if (name == null || name === '' || docsGroup == null || docsGroup === '') {
		throw new Error('Usage: generate:component --args <name> <docs-group>');
	}
	if (extra != null) {
		throw new Error('Usage: generate:component --args <name> <docs-group>');
	}

	return { kind: 'args', answers: { docsGroup, name } };
}
