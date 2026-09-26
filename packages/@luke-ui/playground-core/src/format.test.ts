import { expect, test } from 'vite-plus/test';
import { formatPlaygroundSource } from './format.js';

test('formats badly formatted valid TSX', async () => {
	const source = 'const foo=()=>{return <Button label="Foo"/>}';
	const formatted = await formatPlaygroundSource(source);
	const expected = 'const foo = () => {\n\treturn <Button label="Foo" />;\n};\n';
	expect(formatted).toBe(expected);
});

test('returns no edit for already formatted source', async () => {
	const source = 'const foo = () => {\n\treturn <Button label="Foo" />;\n};\n';
	const formatted = await formatPlaygroundSource(source);
	expect(formatted).toBe(source);
});

test('returns no edit for incomplete TSX', async () => {
	const formatted = await formatPlaygroundSource('const incomplete = (');
	expect(formatted).toBeNull();
});
