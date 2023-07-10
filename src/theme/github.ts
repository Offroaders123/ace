export const isDark = false;
export const cssClass = "ace-github";
import cssText from "./github-css.js";

export { cssText };

    import { importCssString } from "../lib/dom.js";
    importCssString(cssText, cssClass, false);
