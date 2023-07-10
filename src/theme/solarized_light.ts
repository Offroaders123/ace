export const isDark = false;
export const cssClass = "ace-solarized-light";
import cssText from "./solarized_light-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
