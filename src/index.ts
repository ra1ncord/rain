import { initFetchI18nStrings } from "@i18n";
import { initEagerPlugins, initPlugins } from "@plugins/index";

import { initDebugger, patchLogHook } from "./api/debug";
import { injectFluxInterceptor } from "./api/flux";
import { patchJsx } from "./api/react/jsx";
import * as lib from "./lib";

export default async () => {
    const critical = await Promise.all([
        patchLogHook(),
        patchJsx(),
        injectFluxInterceptor(),
    ]);

    const core = await Promise.all([
        initEagerPlugins(),
        initFetchI18nStrings(),
    ]);

    critical.forEach(f => { if (f !== undefined) lib.unload.push(f); });
    core.forEach(f => { if (f !== undefined) lib.unload.push(f); });

    window.rain = lib

    initDebugger();
};

export { initPlugins };
