import { implement } from "../lib/oop.js";
import { createElement, buildDom } from "../lib/dom.js";
import { stringRepeat } from "../lib/lang.js";
import { onIdle } from "../lib/event.js";
import { isIE } from "../lib/useragent.js";
import { EventEmitter } from "../lib/event_emitter.js";

var CHAR_COUNT = 512;
var USE_OBSERVER = typeof ResizeObserver == "function";
var L = 200;

export class FontMetrics {
    $characterSize = {width: 0, height: 0};

    constructor(parentEl) {
        this.el = createElement("div");
        this.$setMeasureNodeStyles(this.el.style, true);

        this.$main = createElement("div");
        this.$setMeasureNodeStyles(this.$main.style);

        this.$measureNode = createElement("div");
        this.$setMeasureNodeStyles(this.$measureNode.style);


        this.el.appendChild(this.$main);
        this.el.appendChild(this.$measureNode);
        parentEl.appendChild(this.el);

        this.$measureNode.textContent = stringRepeat("X", CHAR_COUNT);

        this.$characterSize = {width: 0, height: 0};


        if (USE_OBSERVER)
            this.$addObserver();
        else
            this.checkForSizeChanges();
    }
    
    $setMeasureNodeStyles(style, isRoot) {
        style.width = style.height = "auto";
        style.left = style.top = "0px";
        style.visibility = "hidden";
        style.position = "absolute";
        style.whiteSpace = "pre";

        if (isIE < 8) {
            style["font-family"] = "inherit";
        } else {
            style.font = "inherit";
        }
        style.overflow = isRoot ? "hidden" : "visible";
    }

    checkForSizeChanges(size) {
        if (size === undefined)
            size = this.$measureSizes();
        if (size && (this.$characterSize.width !== size.width || this.$characterSize.height !== size.height)) {
            this.$measureNode.style.fontWeight = "bold";
            var boldSize = this.$measureSizes();
            this.$measureNode.style.fontWeight = "";
            this.$characterSize = size;
            this.charSizes = Object.create(null);
            this.allowBoldFonts = boldSize && boldSize.width === size.width && boldSize.height === size.height;
            this._emit("changeCharacterSize", {data: size});
        }
    }
    
    $addObserver() {
        var self = this;
        this.$observer = new window.ResizeObserver(function(e) {
            // e[0].contentRect is broken on safari when zoomed;
            self.checkForSizeChanges();
        });
        this.$observer.observe(this.$measureNode);
    }

    $pollSizeChanges() {
        if (this.$pollSizeChangesTimer || this.$observer)
            return this.$pollSizeChangesTimer;
        var self = this;
        
        return this.$pollSizeChangesTimer = onIdle(function cb() {
            self.checkForSizeChanges();
            onIdle(cb, 500);
        }, 500);
    }
    
    setPolling(val) {
        if (val) {
            this.$pollSizeChanges();
        } else if (this.$pollSizeChangesTimer) {
            clearInterval(this.$pollSizeChangesTimer);
            this.$pollSizeChangesTimer = 0;
        }
    }

    $measureSizes(node) {
        var size = {
            height: (node || this.$measureNode).clientHeight,
            width: (node || this.$measureNode).clientWidth / CHAR_COUNT
        };
        
        // Size and width can be null if the editor is not visible or
        // detached from the document
        if (size.width === 0 || size.height === 0)
            return null;
        return size;
    }

    $measureCharWidth(ch) {
        this.$main.textContent = stringRepeat(ch, CHAR_COUNT);
        var rect = this.$main.getBoundingClientRect();
        return rect.width / CHAR_COUNT;
    }
    
    getCharacterWidth(ch) {
        var w = this.charSizes[ch];
        if (w === undefined) {
            w = this.charSizes[ch] = this.$measureCharWidth(ch) / this.$characterSize.width;
        }
        return w;
    }

    destroy() {
        clearInterval(this.$pollSizeChangesTimer);
        if (this.$observer)
            this.$observer.disconnect();
        if (this.el && this.el.parentNode)
            this.el.parentNode.removeChild(this.el);
    }

    
    $getZoom(element) {
        if (!element || !element.parentElement) return 1;
        return (window.getComputedStyle(element).zoom || 1) * this.$getZoom(element.parentElement);
    }
    
    $initTransformMeasureNodes() {
        var t = function(t, l) {
            return ["div", {
                style: "position: absolute;top:" + t + "px;left:" + l + "px;"
            }];
        };
        this.els = buildDom([t(0, 0), t(L, 0), t(0, L), t(L, L)], this.el);
    }
    // general transforms from element coordinates x to screen coordinates u have the form
    // | m1[0] m2[0] t[0] |   | x |       | u |
    // | m1[1] m2[1] t[1] | . | y |  == k | v |
    // | h[0]  h[1]  1    |   | 1 |       | 1 |
    // this function finds the coeeficients of the matrix using positions of four points
    //  
    transformCoordinates(clientPos, elPos) {
        if (clientPos) {
            var zoom = this.$getZoom(this.el);
            clientPos = mul(1 / zoom, clientPos);
        }
        function solve(l1, l2, r) {
            var det = l1[1] * l2[0] - l1[0] * l2[1];
            return [
                (-l2[1] * r[0] + l2[0] * r[1]) / det,
                (+l1[1] * r[0] - l1[0] * r[1]) / det
            ];
        }
        function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
        function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
        function mul(a, b) { return [a * b[0], a * b[1]]; }

        if (!this.els)
            this.$initTransformMeasureNodes();
        
        function p(el) {
            var r = el.getBoundingClientRect();
            return [r.left, r.top];
        }

        var a = p(this.els[0]);
        var b = p(this.els[1]);
        var c = p(this.els[2]);
        var d = p(this.els[3]);

        var h = solve(sub(d, b), sub(d, c), sub(add(b, c), add(d, a)));

        var m1 = mul(1 + h[0], sub(b, a));
        var m2 = mul(1 + h[1], sub(c, a));
        
        if (elPos) {
            var x = elPos;
            var k = h[0] * x[0] / L + h[1] * x[1] / L + 1;
            var ut = add(mul(x[0], m1), mul(x[1], m2));
            return  add(mul(1 / k / L, ut), a);
        }
        var u = sub(clientPos, a);
        var f = solve(sub(m1, mul(h[0], u)), sub(m2, mul(h[1], u)), u);
        return mul(L, f);
    }
    
}

implement(FontMetrics.prototype, EventEmitter);