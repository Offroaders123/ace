export const isDark = true;
export const cssClass = "ace-vibrant-ink";
import cssText from "./vibrant_ink-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
