import fs from 'node:fs';
import path from 'node:path';
import { parseSync, visitorKeys } from 'oxc-parser';
import type { Node, Program } from 'oxc-parser';

const packageRoot = path.resolve(import.meta.dirname, '..');
const storiesRoot = path.join(packageRoot, 'src');

export type StoryPlayViolation = {
	file: string;
	line: number;
};

export function findStoryPlayViolations(
	files: Array<{ file: string; source: string }>,
): Array<StoryPlayViolation> {
	const violations: Array<StoryPlayViolation> = [];

	for (const { file, source } of files) {
		const parsed = parseSync(file, source, { lang: 'tsx' });
		if (parsed.errors.length > 0) {
			throw new Error(`Could not parse ${file}: ${parsed.errors[0]?.message}`);
		}
		for (const play of findPlayExpressions(parsed.program)) {
			if (!containsAssertion(play.expression, play.functions, new Set<Node>())) continue;
			violations.push({ file, line: lineAt(source, play.expression.start) });
		}
	}

	return violations;
}

function findPlayExpressions(program: Program) {
	const plays: Array<{ expression: Node; functions: Map<string, Node> }> = [];
	const functions = new Map<string, Node>();

	visit(program, (node) => {
		if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.init != null) {
			if (isFunction(node.init)) functions.set(node.id.name, node.init);
		}
		if (node.type === 'FunctionDeclaration' && node.id != null) {
			functions.set(node.id.name, node);
		}
	});

	visit(program, (node) => {
		if (node.type === 'Property' && propertyName(node.key) === 'play') {
			plays.push({ expression: node.value, functions });
		}
	});

	return plays;
}

function containsAssertion(node: Node, functions: Map<string, Node>, visited: Set<Node>): boolean {
	if (visited.has(node)) return false;
	visited.add(node);

	if (node.type === 'Identifier' && node.name !== 'expect') {
		const helper = functions.get(node.name);
		if (helper != null && containsAssertion(helper, functions, visited)) return true;
	}
	if (node.type === 'CallExpression') {
		if (isExpectCall(node.callee)) return true;
		if (node.callee.type === 'Identifier') {
			const helper = functions.get(node.callee.name);
			if (helper != null && containsAssertion(helper, functions, visited)) return true;
		}
	}

	let found = false;
	visit(node, (child) => {
		if (child !== node && !found && containsAssertion(child, functions, visited)) found = true;
	});
	return found;
}

function isExpectCall(node: Node): boolean {
	if (node.type === 'Identifier') return node.name === 'expect';
	if (node.type === 'MemberExpression') {
		return isExpectCall(node.object);
	}
	return false;
}

function isFunction(node: Node): boolean {
	return node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';
}

function propertyName(node: Node): string | undefined {
	if (node.type === 'Identifier') return node.name;
	if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
	return undefined;
}

function visit(node: Node, visitor: (node: Node) => void) {
	visitor(node);
	for (const key of visitorKeys[node.type] ?? []) {
		const child = Reflect.get(node, key);
		if (Array.isArray(child)) {
			for (const item of child) {
				if (isNode(item)) visit(item, visitor);
			}
		} else if (isNode(child)) {
			visit(child, visitor);
		}
	}
}

function isNode(value: unknown): value is Node {
	return (
		typeof value === 'object' && value !== null && typeof Reflect.get(value, 'type') === 'string'
	);
}

function lineAt(source: string, position: number) {
	return source.slice(0, position).split('\n').length;
}

function storyFiles(directory: string): Array<string> {
	const files: Array<string> = [];
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...storyFiles(entryPath));
		else if (entry.name.endsWith('.stories.tsx')) files.push(entryPath);
	}
	return files;
}

const files = storyFiles(storiesRoot).flatMap((file) => {
	if (path.relative(storiesRoot, file).startsWith(`theme${path.sep}`)) return [];
	return [{ file, source: fs.readFileSync(file, 'utf8') }];
});
const violations = findStoryPlayViolations(files);

if (violations.length > 0) {
	// oxlint-disable-next-line no-console
	console.error('Story play functions must drive state, not assert behaviour:');
	for (const violation of violations) {
		// oxlint-disable-next-line no-console
		console.error(`  ${path.relative(packageRoot, violation.file)}:${violation.line}`);
	}
	process.exitCode = 1;
}
