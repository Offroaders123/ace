export type OOPConstructor = Record<string,any>;

export function inherits(ctor: OOPConstructor, superCtor: OOPConstructor): void {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
};

export type Mixin = Record<string,any>;

export function mixin<T extends Mixin>(obj: Mixin, mixin: Mixin): T {
    for (var key in mixin) {
        obj[key] = mixin[key];
    }
    return obj as T;
};

export function implement(proto: Mixin, mixinObj: Mixin): void {
    mixin(proto, mixinObj);
};
