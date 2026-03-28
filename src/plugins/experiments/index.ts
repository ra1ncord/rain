import { patcher } from "@api";
import { useSettings } from "@api/settings";
import { showConfirmationAlert } from "@api/ui/alerts";
import { findByProps, findByStoreName } from "@metro";
import { UserStore } from "@metro/common/stores";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

let unpatchIsStaffEnv: any;
let unpatchDevStoreProps: any;

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
    author: [Developers.cocobo1],
    id: "dummy",
    version: "1.1.0",
    async start() {
        const settings = useSettings.getState();
        const hasConfirmed = settings.experimentsConfirmed !== false;

        if (!hasConfirmed) {
            const confirmed = await new Promise<boolean>(resolve => {
                showConfirmationAlert({
                    title: "WARNING!!",
                    content: "Enabling staff only settings has its risks. rain dev team does not bear any responsibility for any issues faced when using these experimental settings, including possible account termination. **Use at your own risk**\n\nA manual restart is required for the plugin to take effect",
                    confirmText: "I understand the risks",
                    confirmColor: "red",
                    onConfirm: () => {
                        resolve(true);
                    },
                    cancelText: "Cancel",
                    onCancel: () => {
                        resolve(false);
                    }
                });
            });

            if (!confirmed) {
                throw new Error("User aborted");
            }

            useSettings.setState({ experimentsConfirmed: true });
        }

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
        useSettings.setState({ experimentsConfirmed: false });
    }
});
