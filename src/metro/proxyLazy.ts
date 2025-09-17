const factorySymbol = Symbol("lazyFactory");
const cacheSymbol = Symbol("lazyCache");

const unconfigurable = ["arguments", "caller", "prototype"];
const isUnconfigurable = (key: PropertyKey) => typeof key === "string" && unconfigurable.includes(key);

const lazyHandler: ProxyHandler<any> = {
    ...Object.fromEntries(Object.getOwnPropertyNames(Reflect).map(fnName => {
        return [fnName, (target: any, ...args: any[]) => {
            return Reflect[fnName](target[factorySymbol](), ...args);
        }];
    })),
    ownKeys: target => {
        const cacheKeys = Reflect.ownKeys(target[factorySymbol]());
        unconfigurable.forEach(key => isUnconfigurable(key) && cacheKeys.push(key));
        return cacheKeys;
    },
    getOwnPropertyDescriptor: (target, p) => {
        if (isUnconfigurable(p)) return Reflect.getOwnPropertyDescriptor(target, p);

        const descriptor = Reflect.getOwnPropertyDescriptor(target[factorySymbol](), p);
        if (descriptor) Object.defineProperty(target, p, descriptor);
        return descriptor;
    },
};

/**
 * Lazy proxy that will only call the factory function when needed (when a property is accessed)
 * @param factory Factory function to create the object
 * @returns A proxy that will call the factory function only when needed
 */
export default function proxyLazy<T>(factory: () => T): T {
    const dummy = (() => void 0) as any;
    dummy[factorySymbol] = () => dummy[cacheSymbol] ??= factory();

    return new Proxy(dummy, lazyHandler) as any;
}

type ExemptedEntries = Record<symbol | string, unknown>;
const factories = new WeakMap<any, () => any>();

interface LazyOptions<E extends ExemptedEntries> {
    hint?: "function" | "object";
    exemptedEntries?: E
}

export function lazyDestructure<
    T extends Record<PropertyKey, unknown>,
    I extends ExemptedEntries
>(factory: () => T, opts: LazyOptions<I> = {}): T {
    const proxiedObject = proxyLazy(factory);

    return new Proxy({}, {
        get(_, property) {
            if (property === Symbol.iterator) {
                return function* () {
                    yield proxiedObject;
                    yield new Proxy({}, {
                        get: (_, p) => proxyLazy(() => proxiedObject[p])
                    });
                    throw new Error("This is not a real iterator, this is likely used incorrectly");
                };
            }
            return proxyLazy(() => proxiedObject[property]);
        }
    }) as T;
}

export function getProxyFactory<T>(obj: T): (() => T) | void {
    return factories.get(obj) as (() => T) | void;
}
