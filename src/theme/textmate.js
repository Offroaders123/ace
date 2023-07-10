
export const isDark = false;
export const cssClass = "ace-tm";
import cssText from "./textmate-css.js";
export const $id = "ace/theme/textmate";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
