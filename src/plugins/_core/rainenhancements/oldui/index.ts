import { findByProps } from "@metro";

const RefreshModule = findByProps("isMobileVisualRefreshEnabled", "MobileVisualRefreshExperiment");

export function oldUI() {
    if (RefreshModule.MobileVisualRefreshExperiment) {
        RefreshModule.MobileVisualRefreshExperiment.useConfig = () => ({
            enabled: false,
            chatInputHideApps: false
        });
    }
}
