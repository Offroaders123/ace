export const isDark = true;
export const cssClass = "ace-nord-dark";
import cssText from "./nord_dark-css.js";
export const $selectionColorConflict = true;

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
