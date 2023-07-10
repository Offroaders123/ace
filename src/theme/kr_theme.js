export const isDark = true;
export const cssClass = "ace-kr-theme";
import cssText from "./kr_theme-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
