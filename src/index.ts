import { injectFluxInterceptor } from "@lib/api/flux";
import initSettings, { patchSettings } from "./rain/settings";
import { patchJsx } from "@lib/api/react/jsx";

export default async () => {
    await Promise.all([
        patchSettings(),
        injectFluxInterceptor(),
        initSettings(),
        patchJsx(),
    ])
};