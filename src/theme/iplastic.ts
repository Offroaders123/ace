export const isDark = false;
export const cssClass = "ace-iplastic";
import cssText from "./iplastic-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
