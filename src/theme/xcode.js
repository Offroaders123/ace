export const isDark = false;
export const cssClass = "ace-xcode";
import cssText from "./xcode-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
