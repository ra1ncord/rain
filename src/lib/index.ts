import "../global.d.ts"; // eslint-disable-line import-alias/import-alias
import "../modules.d.ts"; // eslint-disable-line import-alias/import-alias

export * as api from "./api";
export * as utils from "./utils";
export * as metro from "@metro";

/** @internal */
export * as _jsx from "react/jsx-runtime";

/**
 * @internal
 * @deprecated Moved to top level (bunny.*)
 */

const _disposer = [] as Array<() => unknown>;

export function unload() {
    for (const d of _disposer) if (typeof d === "function") d();
    // @ts-expect-error
    delete window.rain;
    delete window.bunny;
}

/**
 * For internal use only, do not use!
 * @internal
 */
unload.push = (fn: typeof _disposer[number]) => {
    _disposer.push(fn);
};

// todo: rewrite this