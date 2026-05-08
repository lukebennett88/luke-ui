# Utils

## Import

```ts
import {
	cx,
	ObjectEntry,
	pxToRem,
	typedEntries,
	typedKeys,
	typedObjectFromEntries,
} from '@luke-ui/react/utils';
```

## Exports

### `cx`

```ts
function cx(parts: (string | false | null | undefined)[]): string;
```

Joins class names and skips empty values.

### `ObjectEntry`

```ts
type ObjectEntry = { [K in keyof T]-?: [K, T[K]] }[keyof T];
```

Typed key-value pair from an object.

### `pxToRem`

```ts
function pxToRem(px: number, base: number): string;
```

Converts a pixel value to rem.

### `typedEntries`

```ts
function typedEntries(value: T): ObjectEntry<T>[];
```

An alternative to `Object.entries()` that avoids type widening.

### `typedKeys`

```ts
function typedKeys(value: T): (keyof T)[];
```

An alternative to `Object.keys()` that avoids type widening.

### `typedObjectFromEntries`

```ts
function typedObjectFromEntries(entries: ObjectEntry<T>[]): T;
```

An alternative to `Object.fromEntries()` that avoids type widening. Must be
used in conjunction with `typedEntries` or `typedKeys`.
