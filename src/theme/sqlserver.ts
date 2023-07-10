export const isDark = false;
export const cssClass = "ace-sqlserver";
import cssText from "./sqlserver-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
