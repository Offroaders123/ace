export const isDark = false;
export const cssClass = "ace-dreamweaver";
import cssText from "./dreamweaver-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
