import { createPluginStore } from "@api/storage";

interface ReviewSettings {
    authToken: string;
    useThemedSend: boolean;
    showWarning: boolean;
}

export const {
    useStore: useReviewDBSettings,
    settings: reviewdbSettings
} = createPluginStore<ReviewSettings>("reviewdb", {
    authToken: "",
    useThemedSend: true,
    showWarning: true,
});
