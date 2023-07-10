export const isDark = true;
export const cssClass = "ace-idle-fingers";
import cssText from "./idle_fingers-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
