export const isDark = false;
export const cssClass = "ace-tomorrow";
import cssText from "./tomorrow-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
