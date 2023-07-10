export const isDark = true;
export const cssClass = "ace-chaos";
import cssText from "./chaos-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
