import { createPluginStore } from "@api/storage";

interface HideCallButtonsSettings {
    upHideVoiceButton: boolean;
    upHideVideoButton: boolean;
    dmHideCallButton: boolean;
    dmHideVideoButton: boolean;
    hideVCVideoButton: boolean;
}

export const {
    useStore: useHideCallButtonsSettings,
    settings: hidecallbuttonsSettings,
} = createPluginStore<HideCallButtonsSettings>("hidecallbuttons", {
    upHideVoiceButton: true,
    upHideVideoButton: true,
    dmHideCallButton: true,
    dmHideVideoButton: true,
    hideVCVideoButton: false,
});
