export const isDark = true;
export const cssClass = "ace-solarized-dark";
import cssText from "./solarized_dark-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
