import "../global.d.ts";
import "../modules.d.ts";

export * as utils from "./utils";
export * as api from "@api/index.js";
export * as metro from "@metro";

/** @internal */
export * as _jsx from "react/jsx-runtime";

/**
 * @internal
 */

const _disposer = [] as Array<() => unknown>;

export function unload() {
    for (const d of _disposer) if (typeof d === "function") d();
    // @ts-expect-error
    delete window.rain;
}

/**
 * For internal use only, do not use!
 * @internal
 */
unload.push = (fn: typeof _disposer[number]) => {
    _disposer.push(fn);
};

// todo: rewrite this
