import type { NodePath, PluginObject } from '@babel/core';
import { types as t } from '@babel/core';

/** Expands `recipe({...})` into StyleX declarations and a structure-only runtime mapping. */
export function recipeAuthoringBabelPlugin(): PluginObject {
	return {
		name: 'luke-ui-recipe-authoring',
		visitor: {
			Program(programPath: NodePath<t.Program>) {
				const recipeBindings = findRecipeBindings(programPath);
				if (recipeBindings.localNames.size === 0) return;

				const state: ExpansionState = {
					compiledRefs: collectCompiledStyleProvenance(programPath),
					compiledStyleListNames: recipeBindings.compiledStyleListNames,
					compiledStyleNames: recipeBindings.compiledStyleNames,
					recipeCount: 0,
					usesSlottedHelper: false,
					usesSinglePartHelper: false,
				};

				programPath.traverse({
					VariableDeclarator(declaratorPath: NodePath<t.VariableDeclarator>) {
						const init = declaratorPath.node.init;
						if (init == null || !isRecipeCall(init, recipeBindings.localNames)) return;
						expandRecipe(declaratorPath, init, state);
					},
					CallExpression(callPath: NodePath<t.CallExpression>) {
						// Reject unsupported call sites before `recipe()` can reach runtime.
						if (!isRecipeCall(callPath.node, recipeBindings.localNames)) return;
						throw callPath.buildCodeFrameError(
							'recipe() must be assigned to a variable declaration.',
						);
					},
				});

				ensureStylexNamespaceImport(programPath);
				addRuntimeHelperImport(programPath, recipeBindings.source, state);

				// Remove marker imports that the transform no longer references.
				for (const specifierPath of recipeBindings.specifiers) {
					if (hasReferencedBinding(programPath, specifierPath.node.local.name)) continue;
					const declarationPath = specifierPath.parentPath;
					if (
						declarationPath.isImportDeclaration() &&
						declarationPath.node.specifiers.length === 1
					) {
						declarationPath.remove();
					} else {
						specifierPath.remove();
					}
				}
			},
		},
	};
}

function hasReferencedBinding(programPath: NodePath<t.Program>, name: string): boolean {
	let referenced = false;
	programPath.traverse({
		Identifier(identifierPath: NodePath<t.Identifier>) {
			if (identifierPath.node.name === name && identifierPath.isReferencedIdentifier()) {
				referenced = true;
			}
		},
	});
	return referenced;
}

interface RecipeBindings {
	compiledStyleListNames: Set<string>;
	compiledStyleNames: Set<string>;
	localNames: Set<string>;
	source: string;
	specifiers: Array<NodePath<t.ImportSpecifier>>;
}

interface ExpansionState {
	compiledRefs: CompiledStyleProvenance;
	compiledStyleListNames: ReadonlySet<string>;
	compiledStyleNames: ReadonlySet<string>;
	recipeCount: number;
	usesSinglePartHelper: boolean;
	usesSlottedHelper: boolean;
}

interface CompiledStyleProvenance {
	/** Local names bound directly to a compiled style. */
	styles: Set<string>;
	/** Local names bound to objects whose members are compiled styles. */
	styleObjects: Set<string>;
}

/** The module specifier suffix a recipe imports the authoring factory from. */
const RECIPE_MODULE_PATTERN = /recipe-authoring\.js$/;

/** A valid JavaScript identifier for a generated key. */
const IDENTIFIER_NAME_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** Characters that cannot occur in a generated key. */
const NON_IDENTIFIER_CHARACTER_PATTERN = /[^A-Za-z0-9_$]/g;

function findRecipeBindings(programPath: NodePath<t.Program>): RecipeBindings {
	const compiledStyleListNames = new Set<string>();
	const compiledStyleNames = new Set<string>();
	const localNames = new Set<string>();
	const specifiers: Array<NodePath<t.ImportSpecifier>> = [];
	let source = '';

	for (const statementPath of programPath.get('body')) {
		if (!statementPath.isImportDeclaration()) continue;
		if (!RECIPE_MODULE_PATTERN.test(statementPath.node.source.value)) continue;

		for (const specifierPath of statementPath.get('specifiers')) {
			if (!specifierPath.isImportSpecifier()) continue;
			if (specifierPath.node.importKind === 'type') continue;
			const imported = specifierPath.node.imported;
			const importedName = t.isIdentifier(imported) ? imported.name : imported.value;
			if (importedName === 'recipe') {
				localNames.add(specifierPath.node.local.name);
				specifiers.push(specifierPath);
				source = statementPath.node.source.value;
			} else if (importedName === 'compiledStyle') {
				compiledStyleNames.add(specifierPath.node.local.name);
				specifiers.push(specifierPath);
			} else if (importedName === 'compiledStyleList') {
				compiledStyleListNames.add(specifierPath.node.local.name);
				specifiers.push(specifierPath);
			}
		}
	}

	return {
		compiledStyleListNames,
		compiledStyleNames,
		localNames,
		source,
		specifiers,
	};
}

/** Ensure the generated `stylex.create` call has the namespace import StyleX recognises. */
function ensureStylexNamespaceImport(programPath: NodePath<t.Program>): void {
	for (const statement of programPath.node.body) {
		if (!t.isImportDeclaration(statement)) continue;
		if (statement.source.value !== '@stylexjs/stylex') continue;
		for (const specifier of statement.specifiers) {
			if (t.isImportNamespaceSpecifier(specifier) && specifier.local.name === 'stylex') return;
		}
	}

	const existingBinding = programPath.scope.getBinding('stylex');
	if (existingBinding !== undefined) {
		throw existingBinding.path.buildCodeFrameError(
			'recipe() expansion needs the name `stylex`, but it is already bound. Rename the existing binding.',
		);
	}

	programPath.node.body.unshift(
		t.importDeclaration(
			[t.importNamespaceSpecifier(t.identifier('stylex'))],
			t.stringLiteral('@stylexjs/stylex'),
		),
	);
}

function isRecipeCall(node: t.Node, localNames: ReadonlySet<string>): node is t.CallExpression {
	return (
		t.isCallExpression(node) && t.isIdentifier(node.callee) && localNames.has(node.callee.name)
	);
}

/** Collect local names proven to hold compiled StyleX styles. */
function collectCompiledStyleProvenance(programPath: NodePath<t.Program>): CompiledStyleProvenance {
	const createResults = new Set<string>();
	const styles = new Set<string>();
	const styleObjects = new Set<string>();

	for (const statement of programPath.node.body) {
		if (t.isImportDeclaration(statement)) continue;

		const declaration = t.isExportNamedDeclaration(statement) ? statement.declaration : statement;
		if (!t.isVariableDeclaration(declaration)) continue;

		for (const declarator of declaration.declarations) {
			if (!t.isIdentifier(declarator.id) || declarator.init == null) continue;
			const name = declarator.id.name;
			const init = unwrapTypeAssertion(declarator.init);

			if (isStylexCreateCall(init)) {
				createResults.add(name);
				continue;
			}

			if (isCompiledStyleMember(init, createResults, styleObjects)) {
				styles.add(name);
				continue;
			}

			if (isCompiledStyleObjectLiteral(init, createResults, styleObjects)) {
				styleObjects.add(name);
			}
		}
	}

	// A `stylex.create` result is itself an object whose members are compiled styles.
	for (const name of createResults) styleObjects.add(name);

	return { styles, styleObjects };
}

/** `x as const` and `x satisfies T` wrap the value without changing it. */
function unwrapTypeAssertion(node: t.Expression): t.Expression {
	if (t.isTSAsExpression(node) || t.isTSSatisfiesExpression(node)) {
		return unwrapTypeAssertion(node.expression);
	}
	return node;
}

function isStylexCreateCall(node: t.Expression): boolean {
	return (
		t.isCallExpression(node) &&
		t.isMemberExpression(node.callee) &&
		!node.callee.computed &&
		t.isIdentifier(node.callee.object, { name: 'stylex' }) &&
		t.isIdentifier(node.callee.property, { name: 'create' })
	);
}

/** A non-computed member of a name already known to hold compiled styles. */
function isCompiledStyleMember(
	node: t.Expression,
	createResults: ReadonlySet<string>,
	styleObjects: ReadonlySet<string>,
): boolean {
	return (
		t.isMemberExpression(node) &&
		!node.computed &&
		t.isIdentifier(node.object) &&
		(createResults.has(node.object.name) || styleObjects.has(node.object.name))
	);
}

/** An object literal whose every value is itself a compiled style member. */
function isCompiledStyleObjectLiteral(
	node: t.Expression,
	createResults: ReadonlySet<string>,
	styleObjects: ReadonlySet<string>,
): boolean {
	if (!t.isObjectExpression(node) || node.properties.length === 0) return false;

	return node.properties.every((property) => {
		if (!t.isObjectProperty(property) || property.computed) return false;
		if (!t.isExpression(property.value)) return false;
		return isCompiledStyleMember(unwrapTypeAssertion(property.value), createResults, styleObjects);
	});
}

/** One style-bearing position, resolved to what the mapping literal should say about it. */
type StyleEntry =
	| { key: string; tag: 'key' }
	| { reference: t.Expression; tag: 'ref' }
	| { reference: t.Expression; tag: 'refs' }
	| { entries: Array<StyleEntry>; tag: 'list' };

/** The generated `stylex.create` argument, built as inline literals are lowered into it. */
interface StyleLowering {
	keys: Set<string>;
	properties: Array<t.ObjectProperty>;
}

function expandRecipe(
	declaratorPath: NodePath<t.VariableDeclarator>,
	callNode: t.CallExpression,
	state: ExpansionState,
): void {
	const argument = callNode.arguments[0];
	if (argument === undefined || !t.isObjectExpression(argument)) {
		throw declaratorPath.buildCodeFrameError('recipe() takes a single object literal.');
	}

	const stylesName = `_recipeStyles${state.recipeCount}`;
	state.recipeCount += 1;

	const lowering: StyleLowering = { keys: new Set(), properties: [] };
	const slotsNode = findProperty(declaratorPath, argument, 'slots');
	const mapping =
		slotsNode === undefined
			? buildSinglePartMapping(declaratorPath, argument, state, lowering)
			: buildSlottedMapping(declaratorPath, argument, slotsNode, state, lowering);

	if (slotsNode === undefined) state.usesSinglePartHelper = true;
	else state.usesSlottedHelper = true;

	const helperName = slotsNode === undefined ? 'recipeFromCompiled' : 'slottedRecipeFromCompiled';

	// Keep declarations above the generated call in their authored order.
	declaratorPath.parentPath.insertBefore(
		t.variableDeclaration('const', [
			t.variableDeclarator(
				t.identifier(stylesName),
				t.callExpression(t.memberExpression(t.identifier('stylex'), t.identifier('create')), [
					t.objectExpression(lowering.properties),
				]),
			),
		]),
	);

	declaratorPath
		.get('init')
		.replaceWith(t.callExpression(t.identifier(helperName), [t.identifier(stylesName), mapping]));
}

function buildSinglePartMapping(
	declaratorPath: NodePath<t.VariableDeclarator>,
	config: t.ObjectExpression,
	state: ExpansionState,
	lowering: StyleLowering,
): t.ObjectExpression {
	const baseNode = findProperty(declaratorPath, config, 'base');
	const baseEntries =
		baseNode === undefined
			? []
			: [resolveStyleEntry(declaratorPath, baseNode, state, lowering, 'base', 'base')];

	const variants = readVariantGroups(declaratorPath, config, (groupName, valueName, valueNode) => {
		if (t.isNullLiteral(valueNode)) return t.nullLiteral();
		const key = generatedKey(declaratorPath, [groupName, valueName]);
		return styleEntryNode(
			resolveStyleEntry(
				declaratorPath,
				valueNode,
				state,
				lowering,
				key,
				`variants.${groupName}.${valueName}`,
			),
		);
	});

	const compoundVariants = readCompoundVariants(declaratorPath, config, (index, styleNode) =>
		styleEntryNode(
			resolveStyleEntry(
				declaratorPath,
				styleNode,
				state,
				lowering,
				`compound${index}`,
				`compoundVariants[${index}].style`,
			),
		),
	);

	return t.objectExpression([
		t.objectProperty(
			t.identifier('base'),
			t.arrayExpression(baseEntries.map((entry) => styleEntryNode(entry))),
		),
		t.objectProperty(t.identifier('compoundVariants'), compoundVariants),
		t.objectProperty(t.identifier('defaultVariants'), readDefaultVariants(declaratorPath, config)),
		t.objectProperty(t.identifier('variants'), variants),
	]);
}

function buildSlottedMapping(
	declaratorPath: NodePath<t.VariableDeclarator>,
	config: t.ObjectExpression,
	slotsNode: t.Expression,
	state: ExpansionState,
	lowering: StyleLowering,
): t.ObjectExpression {
	const slotsObject = assertObjectExpression(declaratorPath, slotsNode, 'slots');
	const slotNames: Array<string> = [];
	const baseProperties: Array<t.ObjectProperty> = [];

	for (const property of slotsObject.properties) {
		const { name, value } = readStaticProperty(declaratorPath, property, 'slots');
		slotNames.push(name);
		const entry = resolveStyleEntry(
			declaratorPath,
			value,
			state,
			lowering,
			generatedKey(declaratorPath, ['slot', name]),
			`slots.${name}`,
		);
		baseProperties.push(
			t.objectProperty(propertyKey(name), t.arrayExpression([styleEntryNode(entry)])),
		);
	}

	const variants = readVariantGroups(declaratorPath, config, (groupName, valueName, valueNode) => {
		if (t.isNullLiteral(valueNode)) return t.nullLiteral();
		const perSlot = assertObjectExpression(
			declaratorPath,
			valueNode,
			`variants.${groupName}.${valueName}`,
		);
		return buildPerSlotStyles(declaratorPath, perSlot, state, lowering, slotNames, [
			groupName,
			valueName,
		]);
	});

	const compoundVariants = readCompoundVariants(declaratorPath, config, (index, styleNode) => {
		const perSlot = assertObjectExpression(
			declaratorPath,
			styleNode,
			`compoundVariants[${index}].style`,
		);
		return buildPerSlotStyles(declaratorPath, perSlot, state, lowering, slotNames, [
			`compound${index}`,
		]);
	});

	return t.objectExpression([
		t.objectProperty(t.identifier('base'), t.objectExpression(baseProperties)),
		t.objectProperty(t.identifier('compoundVariants'), compoundVariants),
		t.objectProperty(t.identifier('defaultVariants'), readDefaultVariants(declaratorPath, config)),
		t.objectProperty(
			t.identifier('slotNames'),
			t.arrayExpression(slotNames.map((name) => t.stringLiteral(name))),
		),
		t.objectProperty(t.identifier('variants'), variants),
	]);
}

/** Lower a slot-to-styles map. */
function buildPerSlotStyles(
	declaratorPath: NodePath<t.VariableDeclarator>,
	perSlot: t.ObjectExpression,
	state: ExpansionState,
	lowering: StyleLowering,
	slotNames: ReadonlyArray<string>,
	keyPrefix: ReadonlyArray<string>,
): t.ObjectExpression {
	const properties: Array<t.ObjectProperty> = [];

	for (const property of perSlot.properties) {
		const context = keyPrefix.join('.');
		const { name, value } = readStaticProperty(declaratorPath, property, context);

		if (!slotNames.includes(name)) {
			throw declaratorPath.buildCodeFrameError(
				`"${name}" at ${context} is not a declared slot. Declared slots: ${slotNames.join(', ')}.`,
			);
		}

		if (t.isNullLiteral(value)) {
			properties.push(t.objectProperty(propertyKey(name), t.nullLiteral()));
			continue;
		}

		const entry = resolveStyleEntry(
			declaratorPath,
			value,
			state,
			lowering,
			generatedKey(declaratorPath, [...keyPrefix, name]),
			`${context}.${name}`,
		);
		properties.push(t.objectProperty(propertyKey(name), styleEntryNode(entry)));
	}

	return t.objectExpression(properties);
}

/** Read `variants` in author order. */
function readVariantGroups(
	declaratorPath: NodePath<t.VariableDeclarator>,
	config: t.ObjectExpression,
	readValue: (groupName: string, valueName: string, valueNode: t.Expression) => t.Expression,
): t.ArrayExpression {
	const variantsNode = findProperty(declaratorPath, config, 'variants');
	if (variantsNode === undefined) return t.arrayExpression([]);

	const variantsObject = assertObjectExpression(declaratorPath, variantsNode, 'variants');
	const groups: Array<t.ObjectExpression> = [];

	for (const groupProperty of variantsObject.properties) {
		const group = readStaticProperty(declaratorPath, groupProperty, 'variants');
		const valuesObject = assertObjectExpression(
			declaratorPath,
			group.value,
			`variants.${group.name}`,
		);

		const values = valuesObject.properties.map((valueProperty) => {
			const value = readStaticProperty(declaratorPath, valueProperty, `variants.${group.name}`);
			return t.objectProperty(
				propertyKey(value.name),
				readValue(group.name, value.name, value.value),
			);
		});

		groups.push(
			t.objectExpression([
				t.objectProperty(t.identifier('group'), t.stringLiteral(group.name)),
				t.objectProperty(t.identifier('values'), t.objectExpression(values)),
			]),
		);
	}

	return t.arrayExpression(groups);
}

/** Read `compoundVariants` into conditions and styles. */
function readCompoundVariants(
	declaratorPath: NodePath<t.VariableDeclarator>,
	config: t.ObjectExpression,
	readStyle: (index: number, styleNode: t.Expression) => t.Expression,
): t.ArrayExpression {
	const compoundsNode = findProperty(declaratorPath, config, 'compoundVariants');
	if (compoundsNode === undefined) return t.arrayExpression([]);

	if (!t.isArrayExpression(compoundsNode)) {
		throw declaratorPath.buildCodeFrameError('compoundVariants must be an array literal.');
	}

	const compounds = compoundsNode.elements.map((element, index) => {
		if (element == null || !t.isObjectExpression(element)) {
			throw declaratorPath.buildCodeFrameError(
				`compoundVariants[${index}] must be an object literal with a \`style\` property.`,
			);
		}

		const conditions: Array<t.ObjectProperty> = [];
		let styleNode: t.Expression | undefined;

		for (const property of element.properties) {
			const { name, value } = readStaticProperty(
				declaratorPath,
				property,
				`compoundVariants[${index}]`,
			);
			if (name === 'style') styleNode = value;
			else conditions.push(t.objectProperty(propertyKey(name), value));
		}

		if (styleNode === undefined) {
			throw declaratorPath.buildCodeFrameError(`compoundVariants[${index}] has no \`style\`.`);
		}

		return t.objectExpression([
			t.objectProperty(t.identifier('conditions'), t.objectExpression(conditions)),
			t.objectProperty(t.identifier('style'), readStyle(index, styleNode)),
		]);
	});

	return t.arrayExpression(compounds);
}

function readDefaultVariants(
	declaratorPath: NodePath<t.VariableDeclarator>,
	config: t.ObjectExpression,
): t.ObjectExpression {
	const defaultsNode = findProperty(declaratorPath, config, 'defaultVariants');
	if (defaultsNode === undefined) return t.objectExpression([]);
	return assertObjectExpression(declaratorPath, defaultsNode, 'defaultVariants');
}

/** Resolve an inline style, compiled reference, or ordered array of both. */
function resolveStyleEntry(
	declaratorPath: NodePath<t.VariableDeclarator>,
	node: t.Expression,
	state: ExpansionState,
	lowering: StyleLowering,
	key: string,
	context: string,
): StyleEntry {
	if (t.isObjectExpression(node)) {
		if (lowering.keys.has(key)) {
			throw declaratorPath.buildCodeFrameError(
				`Two styles at ${context} generate the same StyleX key "${key}".`,
			);
		}
		lowering.keys.add(key);
		lowering.properties.push(t.objectProperty(propertyKey(key), node));
		return { key, tag: 'key' };
	}

	if (t.isArrayExpression(node)) {
		const entries = node.elements.map((element, index) => {
			if (t.isSpreadElement(element)) {
				if (!isMarkerCall(element.argument, state.compiledStyleListNames)) {
					throw declaratorPath.buildCodeFrameError(
						`${context}[${index}] can spread only compiledStyleList(...).`,
					);
				}
				return {
					reference: markerArgument(declaratorPath, element.argument, 'compiledStyleList'),
					tag: 'refs',
				} as const;
			}
			if (element == null || !t.isExpression(element)) {
				throw declaratorPath.buildCodeFrameError(
					`${context}[${index}] must be an inline style literal or a compiled StyleX style.`,
				);
			}
			return resolveStyleEntry(
				declaratorPath,
				element,
				state,
				lowering,
				`${key}_${index}`,
				`${context}[${index}]`,
			);
		});
		return { entries, tag: 'list' };
	}

	if (isMarkerCall(node, state.compiledStyleNames)) {
		return {
			reference: markerArgument(declaratorPath, node, 'compiledStyle'),
			tag: 'ref',
		};
	}

	if (isMarkerCall(node, state.compiledStyleListNames)) {
		throw declaratorPath.buildCodeFrameError(
			`${context} can use compiledStyleList(...) only in an array spread.`,
		);
	}

	if (isCompiledStyleReference(node, state.compiledRefs)) {
		return { reference: node, tag: 'ref' };
	}

	throw declaratorPath.buildCodeFrameError(
		`Unsupported style value at ${context}. Use an inline style literal or a compiled StyleX style.`,
	);
}

function isMarkerCall(node: t.Node, markerNames: ReadonlySet<string>): node is t.CallExpression {
	return (
		t.isCallExpression(node) && t.isIdentifier(node.callee) && markerNames.has(node.callee.name)
	);
}

function markerArgument(
	declaratorPath: NodePath<t.VariableDeclarator>,
	call: t.CallExpression,
	name: string,
): t.Expression {
	if (call.arguments.length !== 1 || !t.isExpression(call.arguments[0])) {
		throw declaratorPath.buildCodeFrameError(`${name}() takes one expression.`);
	}
	return call.arguments[0];
}

/** Whether `node` names a value proven above to hold a compiled StyleX style. */
function isCompiledStyleReference(
	node: t.Expression,
	compiledRefs: CompiledStyleProvenance,
): boolean {
	if (t.isIdentifier(node)) return compiledRefs.styles.has(node.name);

	return (
		t.isMemberExpression(node) &&
		!node.computed &&
		t.isIdentifier(node.object) &&
		compiledRefs.styleObjects.has(node.object.name)
	);
}

/** Renders a resolved entry as the mapping literal the runtime reads. */
function styleEntryNode(entry: StyleEntry): t.ObjectExpression {
	if (entry.tag === 'key') {
		return t.objectExpression([
			t.objectProperty(t.identifier('key'), t.stringLiteral(entry.key)),
			t.objectProperty(t.identifier('tag'), t.stringLiteral('key')),
		]);
	}

	if (entry.tag === 'ref' || entry.tag === 'refs') {
		return t.objectExpression([
			t.objectProperty(t.identifier('ref'), entry.reference),
			t.objectProperty(t.identifier('tag'), t.stringLiteral(entry.tag)),
		]);
	}

	return t.objectExpression([
		t.objectProperty(
			t.identifier('entries'),
			t.arrayExpression(entry.entries.map((child) => styleEntryNode(child))),
		),
		t.objectProperty(t.identifier('tag'), t.stringLiteral('list')),
	]);
}

function findProperty(
	declaratorPath: NodePath<t.VariableDeclarator>,
	config: t.ObjectExpression,
	name: string,
): t.Expression | undefined {
	for (const property of config.properties) {
		const read = readStaticProperty(declaratorPath, property, 'recipe()');
		if (read.name === name) return read.value;
	}
	return undefined;
}

/** Reads one plain `key: value` property, rejecting spreads, methods, and computed keys. */
function readStaticProperty(
	declaratorPath: NodePath<t.VariableDeclarator>,
	property: t.ObjectExpression['properties'][number],
	context: string,
): { name: string; value: t.Expression } {
	if (!t.isObjectProperty(property)) {
		throw declaratorPath.buildCodeFrameError(
			`${context} accepts only plain \`key: value\` properties.`,
		);
	}

	if (property.computed) {
		throw declaratorPath.buildCodeFrameError(`${context} accepts only literal keys.`);
	}

	if (!t.isExpression(property.value)) {
		throw declaratorPath.buildCodeFrameError(`${context} accepts only value expressions.`);
	}

	return { name: staticKeyName(declaratorPath, property.key, context), value: property.value };
}

function staticKeyName(
	declaratorPath: NodePath<t.VariableDeclarator>,
	key: t.Node,
	context: string,
): string {
	if (t.isIdentifier(key)) return key.name;
	if (t.isStringLiteral(key)) return key.value;
	if (t.isNumericLiteral(key)) return String(key.value);
	throw declaratorPath.buildCodeFrameError(
		`${context} accepts only identifier, string, or numeric keys, not ${key.type}.`,
	);
}

function assertObjectExpression(
	declaratorPath: NodePath<t.VariableDeclarator>,
	node: t.Expression,
	context: string,
): t.ObjectExpression {
	if (!t.isObjectExpression(node)) {
		throw declaratorPath.buildCodeFrameError(
			`${context} must be an object literal, not ${node.type}.`,
		);
	}
	return node;
}

/** Build a generated `stylex.create` key. */
function generatedKey(
	declaratorPath: NodePath<t.VariableDeclarator>,
	fragments: ReadonlyArray<string>,
): string {
	for (const fragment of fragments) {
		if (fragment.length === 0) {
			throw declaratorPath.buildCodeFrameError('A variant value or slot name cannot be empty.');
		}
	}
	return fragments.map((fragment) => sanitiseKeyFragment(fragment)).join('_');
}

function sanitiseKeyFragment(fragment: string): string {
	return fragment.replace(NON_IDENTIFIER_CHARACTER_PATTERN, '_');
}

/** Use an identifier for valid generated keys and a string literal otherwise. */
function propertyKey(name: string): t.Identifier | t.StringLiteral {
	return IDENTIFIER_NAME_PATTERN.test(name) ? t.identifier(name) : t.stringLiteral(name);
}

/** Import the runtime helpers from the recipe authoring module. */
function addRuntimeHelperImport(
	programPath: NodePath<t.Program>,
	source: string,
	state: ExpansionState,
): void {
	const helpers: Array<string> = [];
	if (state.usesSinglePartHelper) helpers.push('recipeFromCompiled');
	if (state.usesSlottedHelper) helpers.push('slottedRecipeFromCompiled');
	if (helpers.length === 0) return;

	programPath.node.body.unshift(
		t.importDeclaration(
			helpers.map((helper) => t.importSpecifier(t.identifier(helper), t.identifier(helper))),
			t.stringLiteral(source),
		),
	);
}
