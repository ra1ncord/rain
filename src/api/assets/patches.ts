import { indexAssetModuleFlag } from "@metro/internals/caches";
import { getImportingModuleId } from "@metro/internals/modules";

import { after } from "../patcher";

interface AssetModule {
    registerAsset(assetDefinition: any): number;
    getAssetByID(id: number): any;
}

export let assetsModule: AssetModule;

/**
 * @internal
 */
export function patchAssets(module: AssetModule) {
    if (assetsModule) return;
    assetsModule = module;

    const unpatch = after("registerAsset", assetsModule, () => {
        const moduleId = getImportingModuleId();
        if (moduleId !== -1) indexAssetModuleFlag(moduleId);
    });

    return unpatch;
}
