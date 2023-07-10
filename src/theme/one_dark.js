export const isDark = true;
    export const cssClass = "ace-one-dark";
    import cssText from "./one_dark-css.js";
    
    import { importCssString } from "../lib/dom.js";
    importCssString(cssText, cssClass, false);

    export { cssText };
