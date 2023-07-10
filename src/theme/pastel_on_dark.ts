export const isDark = true;
export const cssClass = "ace-pastel-on-dark";
import cssText from "./pastel_on_dark-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
