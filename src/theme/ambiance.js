export const isDark = true;
export const cssClass = "ace-ambiance";
import cssText from "./ambiance-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
