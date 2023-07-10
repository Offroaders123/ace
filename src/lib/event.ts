import { KEY_MODS, MODIFIER_KEYS, FUNCTION_KEYS, PRINTABLE_KEYS } from "./keys.js";
import { isMac, isIE, isChromeOS, isOldGecko, isOpera, isOldIE } from "./useragent.js";

var pressedKeys = null;
var ts = 0;

var activeListenerOptions;
function detectListenerOptionsSupport() {
    activeListenerOptions = false;
    try {
        document.createComment("").addEventListener("test", function() {}, { 
            get passive() { 
                activeListenerOptions = {passive: false};
            }
        });
    } catch(e) {}
}

function getListenerOptions() {
    if (activeListenerOptions == undefined)
        detectListenerOptionsSupport();
    return activeListenerOptions;
}

class EventListener {
constructor(elem, type, callback) {
    this.elem = elem;
    this.type = type;
    this.callback = callback;
}
destroy() {
    removeListener(this.elem, this.type, this.callback);
    this.elem = this.type = this.callback = undefined;
}
};

export function addListener(elem, type, callback, destroyer) {
    elem.addEventListener(type, callback, getListenerOptions());
    if (destroyer)
        destroyer.$toDestroy.push(new EventListener(elem, type, callback));
};

export function removeListener(elem, type, callback) {
    elem.removeEventListener(type, callback, getListenerOptions());
};

/*
* Prevents propagation and clobbers the default action of the passed event
*/
export function stopEvent(e) {
    stopPropagation(e);
    preventDefault(e);
    return false;
};

export function stopPropagation(e) {
    if (e.stopPropagation)
        e.stopPropagation();
};

export function preventDefault(e) {
    if (e.preventDefault)
        e.preventDefault();
};

/*
 * @return {Number} 0 for left button, 1 for middle button, 2 for right button
 */
export function getButton(e) {
    if (e.type == "dblclick")
        return 0;
    if (e.type == "contextmenu" || (isMac && (e.ctrlKey && !e.altKey && !e.shiftKey)))
        return 2;

    // DOM Event
    return e.button;
};

export function capture(el, eventHandler, releaseCaptureHandler) {
    var ownerDocument = el && el.ownerDocument || document;
    function onMouseUp(e) {
        eventHandler && eventHandler(e);
        releaseCaptureHandler && releaseCaptureHandler(e);

        removeListener(ownerDocument, "mousemove", eventHandler);
        removeListener(ownerDocument, "mouseup", onMouseUp);
        removeListener(ownerDocument, "dragstart", onMouseUp);
    }

    addListener(ownerDocument, "mousemove", eventHandler);
    addListener(ownerDocument, "mouseup", onMouseUp);
    addListener(ownerDocument, "dragstart", onMouseUp);
    
    return onMouseUp;
};

export function addMouseWheelListener(el, callback, destroyer) {
    addListener(el, "wheel",  function(e) {
        var factor = 0.15;
        // workaround for firefox changing deltaMode based on which property is accessed first
        var deltaX = e.deltaX || 0;
        var deltaY = e.deltaY || 0;
        switch (e.deltaMode) {
            case e.DOM_DELTA_PIXEL:
                e.wheelX = deltaX * factor;
                e.wheelY = deltaY * factor;
                break;
            case e.DOM_DELTA_LINE:
                var linePixels = 15;
                e.wheelX = deltaX * linePixels;
                e.wheelY = deltaY * linePixels;
                break;
            case e.DOM_DELTA_PAGE:
                var pagePixels = 150;
                e.wheelX = deltaX * pagePixels;
                e.wheelY = deltaY * pagePixels;
                break;
        }
        callback(e);
    }, destroyer);
};

export function addMultiMouseDownListener(elements, timeouts, eventHandler, callbackName, destroyer) {
    var clicks = 0;
    var startX, startY, timer; 
    var eventNames = {
        2: "dblclick",
        3: "tripleclick",
        4: "quadclick"
    };

    function onMousedown(e) {
        if (getButton(e) !== 0) {
            clicks = 0;
        } else if (e.detail > 1) {
            clicks++;
            if (clicks > 4)
                clicks = 1;
        } else {
            clicks = 1;
        }
        if (isIE) {
            var isNewClick = Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5;
            if (!timer || isNewClick)
                clicks = 1;
            if (timer)
                clearTimeout(timer);
            timer = setTimeout(function() {timer = null;}, timeouts[clicks - 1] || 600);

            if (clicks == 1) {
                startX = e.clientX;
                startY = e.clientY;
            }
        }
        
        e._clicks = clicks;

        eventHandler[callbackName]("mousedown", e);

        if (clicks > 4)
            clicks = 0;
        else if (clicks > 1)
            return eventHandler[callbackName](eventNames[clicks], e);
    }
    if (!Array.isArray(elements))
        elements = [elements];
    elements.forEach(function(el) {
        addListener(el, "mousedown", onMousedown, destroyer);
    });
};

var getModifierHash = function(e) {
    return 0 | (e.ctrlKey ? 1 : 0) | (e.altKey ? 2 : 0) | (e.shiftKey ? 4 : 0) | (e.metaKey ? 8 : 0);
};

export function getModifierString(e) {
    return KEY_MODS[getModifierHash(e)];
};

function normalizeCommandKeys(callback, e, keyCode) {
    var hashId = getModifierHash(e);

    if (!isMac && pressedKeys) {
        if (e.getModifierState && (e.getModifierState("OS") || e.getModifierState("Win")))
            hashId |= 8;
        if (pressedKeys.altGr) {
            if ((3 & hashId) != 3)
                pressedKeys.altGr = 0;
            else
                return;
        }
        if (keyCode === 18 || keyCode === 17) {
            var location = "location" in e ? e.location : e.keyLocation;
            if (keyCode === 17 && location === 1) {
                if (pressedKeys[keyCode] == 1)
                    ts = e.timeStamp;
            } else if (keyCode === 18 && hashId === 3 && location === 2) {
                var dt = e.timeStamp - ts;
                if (dt < 50)
                    pressedKeys.altGr = true;
            }
        }
    }
    
    if (keyCode in MODIFIER_KEYS) {
        keyCode = -1;
    }
    
    if (!hashId && keyCode === 13) {
        var location = "location" in e ? e.location : e.keyLocation;
        if (location === 3) {
            callback(e, hashId, -keyCode);
            if (e.defaultPrevented)
                return;
        }
    }
    
    if (isChromeOS && hashId & 8) {
        callback(e, hashId, keyCode);
        if (e.defaultPrevented)
            return;
        else
            hashId &= ~8;
    }

    // If there is no hashId and the keyCode is not a function key, then
    // we don't call the callback as we don't handle a command key here
    // (it's a normal key/character input).
    if (!hashId && !(keyCode in FUNCTION_KEYS) && !(keyCode in PRINTABLE_KEYS)) {
        return false;
    }
    
    return callback(e, hashId, keyCode);
}


export function addCommandKeyListener(el, callback, destroyer) {
    if (isOldGecko || (isOpera && !("KeyboardEvent" in window))) {
        // Old versions of Gecko aka. Firefox < 4.0 didn't repeat the keydown
        // event if the user pressed the key for a longer time. Instead, the
        // keydown event was fired once and later on only the keypress event.
        // To emulate the 'right' keydown behavior, the keyCode of the initial
        // keyDown event is stored and in the following keypress events the
        // stores keyCode is used to emulate a keyDown event.
        var lastKeyDownKeyCode = null;
        addListener(el, "keydown", function(e) {
            lastKeyDownKeyCode = e.keyCode;
        }, destroyer);
        addListener(el, "keypress", function(e) {
            return normalizeCommandKeys(callback, e, lastKeyDownKeyCode);
        }, destroyer);
    } else {
        var lastDefaultPrevented = null;

        addListener(el, "keydown", function(e) {
            pressedKeys[e.keyCode] = (pressedKeys[e.keyCode] || 0) + 1;
            var result = normalizeCommandKeys(callback, e, e.keyCode);
            lastDefaultPrevented = e.defaultPrevented;
            return result;
        }, destroyer);

        addListener(el, "keypress", function(e) {
            if (lastDefaultPrevented && (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey)) {
                stopEvent(e);
                lastDefaultPrevented = null;
            }
        }, destroyer);

        addListener(el, "keyup", function(e) {
            pressedKeys[e.keyCode] = null;
        }, destroyer);

        if (!pressedKeys) {
            resetPressedKeys();
            addListener(window, "focus", resetPressedKeys);
        }
    }
};
function resetPressedKeys() {
    pressedKeys = Object.create(null);
}

if (typeof window == "object" && window.postMessage && !isOldIE) {
    var postMessageId = 1;
    exports.nextTick = function(callback, win) {
        win = win || window;
        var messageName = "zero-timeout-message-" + (postMessageId++);
        
        var listener = function(e) {
            if (e.data == messageName) {
                stopPropagation(e);
                removeListener(win, "message", listener);
                callback();
            }
        };
        
        addListener(win, "message", listener);
        win.postMessage(messageName, "*");
    };
}

export const $idleBlocked = false;
export function onIdle(cb, timeout) {
    return setTimeout(function handler() {
        if (!$idleBlocked) {
            cb();
        } else {
            setTimeout(handler, 100);
        }
    }, timeout);
};

export const $idleBlockId = null;
export function blockIdle(delay) {
    if ($idleBlockId)
        clearTimeout($idleBlockId);
        
    exports.$idleBlocked = true;
    exports.$idleBlockId = setTimeout(function() {
        exports.$idleBlocked = false;
    }, delay || 100);
};

declare global {
    var mozRequestAnimationFrame: typeof requestAnimationFrame;
    var webkitRequestAnimationFrame: typeof requestAnimationFrame;
    var msRequestAnimationFrame: typeof requestAnimationFrame;
    var oRequestAnimationFrame: typeof requestAnimationFrame;
}

export const nextFrame = typeof window == "object" && (window.requestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.msRequestAnimationFrame
    || window.oRequestAnimationFrame);

if (nextFrame)
    exports.nextFrame = nextFrame.bind(window);
else
    exports.nextFrame = function(callback) {
        setTimeout(callback, 17);
    };
