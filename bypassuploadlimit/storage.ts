import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type HostType = "catbox" | "litterbox" | "uguu";

export interface UploaderSettings {
    /** Always upload to the selected host, ignoring the file size threshold. */
    alwaysUpload: boolean;
    /** What to do after upload: clipboard, insertonly, insert, nextmsg. */
    uploadAction: "clipboard" | "insertonly" | "insert" | "nextmsg";
    /** The file hosting service to use. */
    selectedHost: HostType;
    /** Catbox user hash for persistent file storage (optional). */
    userHash: string;
    /** Default Litterbox expiry duration in hours (1, 12, 24, or 72). */
    litterboxDuration: string;
}

type UploaderSettingsStore = PluginStore<UploaderSettings>;

export const useUploaderSettings = create<UploaderSettingsStore>()(
    persist(
        set => ({
            alwaysUpload: false,
            uploadAction: "clipboard",
            selectedHost: "catbox",
            userHash: "",
            litterboxDuration: "1",
            _hasHydrated: false,
            updateSettings: (newSettings: Partial<UploaderSettings>) =>
                set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "uploader-settings",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/uploader.json"),
            ),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

export const uploaderSettings = new Proxy({} as UploaderSettings, {
    get(_target, prop: string) {
        return useUploaderSettings.getState()[prop as keyof UploaderSettings];
    },
    set(_target, prop: string, value: unknown) {
        useUploaderSettings
            .getState()
            .updateSettings({ [prop]: value } as Partial<UploaderSettings>);
        return true;
    },
});
