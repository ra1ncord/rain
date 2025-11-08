import { patchLogHook } from "@lib/api/debug";
import { injectFluxInterceptor } from "@lib/api/flux";
import { patchJsx } from "@lib/api/react/jsx";
import * as lib from "./lib";
import { initPlugins } from "@plugins/index";

export default async () => {
    await Promise.all([
        injectFluxInterceptor(),
        patchLogHook(),
        patchJsx(),
        initPlugins(),
    ])

    window.rain = lib;
};