import { isWin, isChromeOS, isEdge } from "./useragent.js"; 
const XHTML_NS = "http://www.w3.org/1999/xhtml";

export function buildDom<T extends Node>(arr: T | string | [string,Record<string,string>], parent: HTMLElement, refs?: Record<string,HTMLElement>): T {
    if (typeof arr == "string" && arr) {
        var txt = document.createTextNode(arr);
        if (parent)
            parent.appendChild(txt);
        return txt as unknown as T;
    }
    
    if (!Array.isArray(arr)) {
        if (arr && (arr as T).appendChild && parent)
            parent.appendChild(arr as T);
        return arr as T;
    }
    if (typeof arr[0] != "string" || !arr[0]) {
        var els = [];
        for (var i = 0; i < arr.length; i++) {
            var ch = buildDom(arr[i] as string, parent, refs);
            ch && els.push(ch);
        }
        return els as unknown as T;
    }
    
    var el = document.createElement(arr[0]);
    var options = arr[1];
    var childIndex = 1;
    if (options && typeof options == "object" && !Array.isArray(options))
        childIndex = 2;
    for (var i = childIndex; i < arr.length; i++)
        buildDom(arr[i] as string, el, refs);
    if (childIndex == 2) {
        Object.keys(options).forEach(function(n) {
            var val = options[n];
            if (n === "class") {
                el.className = Array.isArray(val) ? val.join(" ") : val;
            } else if (typeof val == "function" || n == "value" || n[0] == "$") {
                // @ts-expect-error - index signature accessing
                el[n] = val;
            } else if (n === "ref") {
                if (refs) refs[val] = el;
            } else if (n === "style") {
                if (typeof val == "string") el.style.cssText = val;
            } else if (val != null) {
                el.setAttribute(n, val);
            }
        });
    }
    if (parent)
        parent.appendChild(el);
    return el as unknown as T;
};

export function getDocumentHead(doc?: Document): HTMLHeadElement {
    if (!doc)
        doc = document;
    return doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
};

export function createElement<T extends Element>(tag: string, ns?: string): T {
    return (document.createElementNS ?
            document.createElementNS(ns || XHTML_NS, tag) :
            document.createElement(tag)) as unknown as T;
};

export function removeChildren(element: Element): void {
    element.innerHTML = "";
};

export function createTextNode(textContent: string, element?: Element): Text {
    var doc = element ? element.ownerDocument : document;
    return doc.createTextNode(textContent);
};

export function createFragment(element?: Element): DocumentFragment {
    var doc = element ? element.ownerDocument : document;
    return doc.createDocumentFragment();
};

export function hasCssClass(el: Element, name: string): boolean {
    var classes = (el.className + "").split(/\s+/g);
    return classes.indexOf(name) !== -1;
};

/*
* Add a CSS class to the list of classes on the given node
*/
export function addCssClass(el: Element, name: string): void {
    if (!hasCssClass(el, name)) {
        el.className += " " + name;
    }
};

/*
* Remove a CSS class from the list of classes on the given node
*/
export function removeCssClass(el: Element, name: string): void {
    var classes = el.className.split(/\s+/g);
    while (true) {
        var index = classes.indexOf(name);
        if (index == -1) {
            break;
        }
        classes.splice(index, 1);
    }
    el.className = classes.join(" ");
};

export function toggleCssClass(el: Element, name: string): boolean {
    var classes = el.className.split(/\s+/g), add = true;
    while (true) {
        var index = classes.indexOf(name);
        if (index == -1) {
            break;
        }
        add = false;
        classes.splice(index, 1);
    }
    if (add)
        classes.push(name);

    el.className = classes.join(" ");
    return add;
};


/*
    * Add or remove a CSS class from the list of classes on the given node
    * depending on the value of <tt>include</tt>
    */
export function setCssClass(node: Element, className: string, include: boolean): void {
    if (include) {
        addCssClass(node, className);
    } else {
        removeCssClass(node, className);
    }
};

export function hasCssString(id: string, doc: Document): true | undefined {
    var index = 0, sheets;
    doc = doc || document;
    if ((sheets = doc.querySelectorAll("style"))) {
        while (index < sheets.length) {
            if (sheets[index++].id === id) {
                return true;
            }
        }
    }
};

export function removeElementById(id: string, doc: Document): void {
    doc = doc || document;
    if(doc.getElementById(id)) {
        doc.getElementById(id)!.remove();
    }
};

var strictCSP: boolean;
var cssCache: string[][] | null = [];
export function useStrictCSP(value: boolean): void {
    strictCSP = value;
    if (value == false) insertPendingStyles();
    else if (!cssCache) cssCache = [];
};

function insertPendingStyles(): void {
    var cache = cssCache;
    cssCache = null;
    cache && cache.forEach(function(item) {
        importCssString(item[0], item[1]);
    });
}

export function importCssString(cssText: string, id: string, target?: Node): number | null | undefined {
    if (typeof document == "undefined")
        return;
    if (cssCache) {
        if (target) {
            insertPendingStyles();
        } else if (target === false) {
            return cssCache.push([cssText, id]);
        }
    }
    if (strictCSP) return;

    var container: Node = target!;
    if (!target || !target.getRootNode) {
        container = document;
    } else {
        container = target.getRootNode() as Document;
        if (!container || container == target)
            container = document;
    }
    
    var doc = container.ownerDocument || container;
    
    // If style is already imported return immediately.
    if (id && hasCssString(id, container as Document))
        return null;
    
    if (id)
        cssText += "\n/*# sourceURL=ace/css/" + id + " */";
    
    var style = createElement("style");
    style.appendChild((doc as Document).createTextNode(cssText));
    if (id)
        style.id = id;

    if (container == doc)
        container = getDocumentHead(doc as Document);
    container.insertBefore(style, container.firstChild);
}

export function importCssStylsheet(uri: any, doc: any): void {
    buildDom(["link", {rel: "stylesheet", href: uri}], getDocumentHead(doc));
};
export function scrollbarWidth(doc: Document): number {
    var inner = createElement<HTMLElement>("ace_inner");
    inner.style.width = "100%";
    inner.style.minWidth = "0px";
    inner.style.height = "200px";
    inner.style.display = "block";

    var outer = createElement<HTMLElement>("ace_outer");
    var style = outer.style;

    style.position = "absolute";
    style.left = "-10000px";
    style.overflow = "hidden";
    style.width = "200px";
    style.minWidth = "0px";
    style.height = "150px";
    style.display = "block";

    outer.appendChild(inner);

    var body = (doc && doc.documentElement) || (document && document.documentElement);
    if (!body) return 0;

    body.appendChild(outer);

    var noScrollbar = inner.offsetWidth;

    style.overflow = "scroll";
    var withScrollbar = inner.offsetWidth;

    if (noScrollbar === withScrollbar) {
        withScrollbar = outer.clientWidth;
    }

    body.removeChild(outer);

    return noScrollbar - withScrollbar;
};

export function computedStyle(element: Element, style: unknown): CSSStyleDeclaration {
    return window.getComputedStyle(element, "") || {};
};

export type StyleKey = Extract<Exclude<keyof CSSStyleDeclaration,"length" | "parentRule">,string>;

export function setStyle(styles: CSSStyleDeclaration, property: StyleKey, value: string): void {
    if (styles[property] !== value) {
        //console.log("set style", property, styles[property], value);
        styles[property] = value as unknown as any;
    }
};

export let HAS_CSS_ANIMATION = false;
export let HAS_CSS_TRANSFORMS = false;
export let HI_DPI = isWin
    ? typeof window !== "undefined" && window.devicePixelRatio >= 1.5
    : true;

if (isChromeOS) HI_DPI = false;

if (typeof document !== "undefined") {
    // detect CSS transformation support
    var div: HTMLDivElement | null = document.createElement("div");
    if (HI_DPI && div.style.transform  !== undefined)
        HAS_CSS_TRANSFORMS = true;
    if (!isEdge && typeof div.style.animationName !== "undefined")
        HAS_CSS_ANIMATION = true;
    div = null;
}

export const translate: (element: HTMLElement, tx: number, ty: number) => void =
(HAS_CSS_TRANSFORMS) ?
    function(element,tx,ty){
        element.style.transform = "translate(" + Math.round(tx) + "px, " + Math.round(ty) +"px)";
    } :
    function(element,tx,ty){
        element.style.top = Math.round(ty) + "px";
        element.style.left = Math.round(tx) + "px";
    };
