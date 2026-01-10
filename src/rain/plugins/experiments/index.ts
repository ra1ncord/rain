import { patcher } from "@api";
import { UserStore } from "@metro/common/stores";
import { findByProps, findByStoreName } from "@metro";
import { definePlugin } from "@plugins";

let unpatchIsStaffEnv
let unpatchDevStoreProps

function reinitStore() {
    const DeveloperExperimentStore = findByStoreName("DeveloperExperimentStore");
    try {
        if (unpatchDevStoreProps) unpatchDevStoreProps();
        
        unpatchDevStoreProps = patcher.instead("defineProperties", Object, () => {});
        
        DeveloperExperimentStore.initialize();
        
        if (unpatchDevStoreProps) unpatchDevStoreProps();
        unpatchDevStoreProps = undefined;
    } catch (e) {
    }
}

export default definePlugin({
    name: "Experiments",
    description: "Enables Discord Staff settings, continue with caution",
    author: [{ name: "cocobo1", id: 767650984175992833n }],
    id: "dummy",
    version: "v1.0.0",
    start() {
        const targetModule = findByProps("isStaffEnv");

        unpatchIsStaffEnv = patcher.instead("isStaffEnv", targetModule, (args: any[], origFunc: { apply: (arg0: any, arg1: any) => any; }) => {
            const user = args[0];
            if (user === UserStore.getCurrentUser()) {
                return true;
            }
            return origFunc.apply(targetModule, args);
        });

        reinitStore();
    },
    stop() {
        if (unpatchIsStaffEnv) {
            unpatchIsStaffEnv();
            unpatchIsStaffEnv = undefined;
        }
        
        if (unpatchDevStoreProps) {
            unpatchDevStoreProps();
            unpatchDevStoreProps = undefined;
        }

        reinitStore();
    }
});