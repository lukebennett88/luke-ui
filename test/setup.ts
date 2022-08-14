import 'vitest-axe/extend-expect';
import 'vitest-dom/extend-expect';

import { expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';
import * as domMatchers from 'vitest-dom/matchers';

expect.extend(axeMatchers);
expect.extend(domMatchers);
