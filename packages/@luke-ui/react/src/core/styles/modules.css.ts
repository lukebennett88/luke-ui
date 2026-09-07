// Style-producing modules in the shipped stylesheet. Named layers set cross-layer priority, but
// same-layer, same-specificity CSS still resolves by source order: later wins. List a module
// that another one composes or overrides before that other module, so the later module's own
// styles win the tie (e.g. `primitives/field` before `primitives/checkbox`, which reads
// `fieldMessageIcon` from it and must override it). The component and primitive generators
// preserve this order. They append new imports to the end and do not sort it.
import '../primitives/button/recipe.css.js';
import '../primitives/field/recipe.css.js';
import '../primitives/checkbox/recipe.css.js';
import '../primitives/combobox/styles.css.js';
import '../primitives/input-group/recipe.css.js';
import '../text/recipe.css.js';
import '../blockquote/recipe.css.js';
import '../button/styles.css.js';
import '../code/recipe.css.js';
import '../icon-button/recipe.css.js';
import '../icon/recipe.css.js';
import '../kbd/recipe.css.js';
import '../link/recipe.css.js';
import '../loading-skeleton/styles.css.js';
import '../loading-spinner/recipe.css.js';
import '../overlays/mobile-overlay.css.js';
import '../prose/recipe.css.js';
import '../visually-hidden/recipe.css.js';
