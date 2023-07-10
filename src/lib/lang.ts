export function last<T extends string | any[] | readonly any[]>(a: T): T extends [...infer _,infer K] ? K : T extends readonly [...infer _,infer L] ? L : string {
    return a[a.length - 1];
};

export function stringReverse(string: string): string {
    return string.split("").reverse().join("");
};

export function stringRepeat(string: string, count: number): string {
    var result = '';
    while (count > 0) {
        if (count & 1)
            result += string;

        if (count >>= 1)
            string += string;
    }
    return result;
};

var trimBeginRegexp = /^\s\s*/;
var trimEndRegexp = /\s\s*$/;

export function stringTrimLeft(string: string): string {
    return string.replace(trimBeginRegexp, '');
};

export function stringTrimRight(string: string): string {
    return string.replace(trimEndRegexp, '');
};

export function copyObject<T extends object>(obj: T): T {
    var copy: T = {} as T;
    for (var key in obj) {
        copy[key] = obj[key];
    }
    return copy;
};

export function copyArray<T extends any[] | readonly any[]>(array: T): T {
    var copy: any[] = [];
    for (var i=0, l=array.length; i<l; i++) {
        if (array[i] && typeof array[i] == "object")
            copy[i] = copyObject(array[i]);
        else 
            copy[i] = array[i];
    }
    return copy as T;
};

export function deepCopy<T>(obj: T): T {
    if (typeof obj !== "object" || !obj)
        return obj;
    var copy: T;
    if (Array.isArray(obj)) {
        copy = [] as T;
        for (var key = 0; key < obj.length; key++) {
            // @ts-expect-error - index access
            copy[key] = deepCopy(obj[key]);
        }
        return copy;
    }
    if (Object.prototype.toString.call(obj) !== "[object Object]")
        return obj;
    
    copy = {} as T;
    for (let key in obj)
        copy[key] = deepCopy(obj[key]);
    return copy;
};

export type ArrayToMap<T extends any[] | readonly any[]> = { [K in T[number]]: 1; };

export function arrayToMap<T extends any[] | readonly any[]>(arr: T): ArrayToMap<T> {
    var map = {} as ArrayToMap<T>;
    for (var i: T[number] = 0; i < arr.length; i++) {
        map[arr[i]] = 1;
    }
    return map;

};

export function createMap<T extends object>(props: T): T {
    var map = Object.create(null);
    for (var i in props) {
        map[i] = props[i];
    }
    return map;
};

/*
 * splice out of 'array' anything that === 'value'
 */
export function arrayRemove(array: any[], value: any): void {
  for (var i = 0; i <= array.length; i++) {
    if (value === array[i]) {
      array.splice(i, 1);
    }
  }
};

export function escapeRegExp(str: string): string {
    return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
};

export function escapeHTML(str: string): string {
    return ("" + str).replace(/&/g, "&#38;").replace(/"/g, "&#34;").replace(/'/g, "&#39;").replace(/</g, "&#60;");
};

export interface MatchOffsets {
    offset: number;
    length: number;
}

export function getMatchOffsets(string: string, regExp: RegExp): MatchOffsets[] {
    var matches: MatchOffsets[] = [];

    string.replace(regExp, function(str) {
        matches.push({
            offset: arguments[arguments.length-2],
            length: str.length
        });
        return "";
    });

    return matches;
};

/** @deprecated */
export function deferredCall(fcn: () => void) {
    var timer: number | null | undefined = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    class deferred {
    static schedule: typeof deferred;
    constructor(timeout: number) {
        deferred.cancel();
        timer = setTimeout(callback, timeout || 0);
        return deferred;
    }
    static call() {
        this.cancel();
        fcn();
        return deferred;
    }
    static cancel() {
        clearTimeout(timer!);
        timer = null;
        return deferred;
    }
    static isPending() {
        return timer;
    }
    };
    deferred.schedule = deferred;

    return deferred;
};


export function delayedCall(fcn: () => void, defaultTimeout: number) {
    var timer: number | null | undefined = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    class _self {
    static schedule: typeof _self;
    constructor(timeout: number) {
        if (timer == null)
            timer = setTimeout(callback, timeout || defaultTimeout);
    }
    static delay(timeout: number) {
        timer && clearTimeout(timer);
        timer = setTimeout(callback, timeout || defaultTimeout);
    }
    static call() {
        this.cancel();
        fcn();
    }
    static cancel() {
        timer && clearTimeout(timer);
        timer = null;
    }
    static isPending() {
        return timer;
    }
    };
    _self.schedule = _self;

    return _self;
};
