import { patchLogHook } from "./api/debug";
import { injectFluxInterceptor } from "./api/flux";
import { patchJsx } from "./api/react/jsx";
import * as lib from "./lib";
import { initEagerPlugins } from "@plugins/index";
import { initPlugins } from "@plugins/index";
import { loaderConfig, settings } from "./api/settings";
import { awaitStorage } from "./api/storage";

export default async () => {
    const critical = await Promise.all([
        patchLogHook(),
        patchJsx(),
        injectFluxInterceptor(),
    ]);

    const core = await Promise.all([
        initEagerPlugins(),
        awaitStorage(settings, loaderConfig),
    ]);

    critical.forEach(f => { if (f !== undefined) lib.unload.push(f); });
    core.forEach(f => { if (f !== undefined) lib.unload.push(f); });

    window.rain = lib;

    initPlugins();
};