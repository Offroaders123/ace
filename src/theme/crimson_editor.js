export const isDark = false;
import cssText from "./crimson_editor-css.js";
export { cssText };

export const cssClass = "ace-crimson-editor";

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
