import './theme.css.js';
import { createSprinkles } from './baseline.css.js';
import { createBox } from './box.js';
import { mount } from './main.js';
import { mountPerf } from './perf.js';

const Box = createBox(createSprinkles as never);
if (location.pathname.includes('perf')) mountPerf(Box);
else mount(Box);
