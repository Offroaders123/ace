export const isDark = false;
export const cssClass = "ace-clouds";
import cssText from "./clouds-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
