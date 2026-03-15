import { callBridgeMethod } from "../bridge";

export default {
    nativeBundleClear: () => callBridgeMethod("updater.clear"),
    nativeDownload:    () => callBridgeMethod("updater.download"),
    nativeReload:      () => callBridgeMethod("updater.reload"),
};
