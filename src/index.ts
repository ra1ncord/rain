import { patchLogHook } from "@lib/api/debug";
import { injectFluxInterceptor } from "@lib/api/flux";
import { patchJsx } from "@lib/api/react/jsx";
import * as lib from "./lib";
import { initLazyPlugins } from "@plugins/index";
import { initPlugins } from "@plugins/index";
import { loaderConfig, settings } from "@lib/api/settings";
import { awaitStorage } from "@lib/api/storage";

export default async () => {
    const critical = await Promise.all([
        patchLogHook(),
        patchJsx(),
        injectFluxInterceptor(),
    ]);

    const core = await Promise.all([
        initPlugins(),
        awaitStorage(settings, loaderConfig),
    ]);

    critical.forEach(f => { if (f !== undefined) lib.unload.push(f); });
    core.forEach(f => { if (f !== undefined) lib.unload.push(f); });

    window.rain = lib;

    initLazyPlugins();
};