export const isDark = false;
export const cssClass = "ace-dawn";
import cssText from "./dawn-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
