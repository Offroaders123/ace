export const isDark = true;
export const cssClass = "ace-dracula";
import cssText from "./dracula-css.js";
export const $selectionColorConflict = true;

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
