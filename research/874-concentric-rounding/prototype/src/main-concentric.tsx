import './theme.css.js';
import { createBox } from './box.js';
import { createSprinkles, publishedNames } from './concentric.css.js';
import { mount } from './main.js';
import { mountPerf } from './perf.js';

const Box = createBox(createSprinkles as never);
if (location.pathname.includes('perf')) mountPerf(Box, 'concentric');
else mount(Box, publishedNames);
