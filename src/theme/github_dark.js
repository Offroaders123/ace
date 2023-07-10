export const isDark = true;
export const cssClass = "ace-github-dark";
import cssText from "./github_dark-css.js";

export { cssText };

    import { importCssString } from "../lib/dom.js";
    importCssString(cssText, cssClass, false);

