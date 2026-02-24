
export interface SettingsCategoryToggles {
  hideAll: boolean;
  [rowKey: string]: boolean;
}

export interface SettingsSections {
  account: SettingsCategoryToggles;
  contentSocial: SettingsCategoryToggles;
  dataPrivacy: SettingsCategoryToggles;
  familyCenter: SettingsCategoryToggles;
  authorizedApps: SettingsCategoryToggles;
  devices: SettingsCategoryToggles;
  connections: SettingsCategoryToggles;
  clips: SettingsCategoryToggles;
  scanQrCode: SettingsCategoryToggles;
  rain: SettingsCategoryToggles;
  plugins: SettingsCategoryToggles;
  themes: SettingsCategoryToggles;
  fonts: SettingsCategoryToggles;
  developer: SettingsCategoryToggles;
  voice: SettingsCategoryToggles;
  appearance: SettingsCategoryToggles;
  accessibility: SettingsCategoryToggles;
  language: SettingsCategoryToggles;
  chat: SettingsCategoryToggles;
  webBrowser: SettingsCategoryToggles;
  notifications: SettingsCategoryToggles;
  appIcon: SettingsCategoryToggles;
  advanced: SettingsCategoryToggles;
  appSettings: SettingsCategoryToggles;
  billing: SettingsCategoryToggles;
  support: SettingsCategoryToggles;
  whatsNew: SettingsCategoryToggles;
  developerSettings: SettingsCategoryToggles;
  buildStatus: SettingsCategoryToggles;
  staffSettings: SettingsCategoryToggles;
}


type SettingsSectionsStore = PluginStore<SettingsSections>;

export const useSettingsSections = create<SettingsSectionsStore>()(
  persist(
    set => ({
      account: { hideAll: false },
      contentSocial: { hideAll: false },
      dataPrivacy: { hideAll: false },
      familyCenter: { hideAll: false },
      authorizedApps: { hideAll: false },
      devices: { hideAll: false },
      connections: { hideAll: false },
      clips: { hideAll: false },
      scanQrCode: { hideAll: false },
      rain: { hideAll: false },
      plugins: { hideAll: false },
      themes: { hideAll: false },
      fonts: { hideAll: false },
      developer: { hideAll: false },
      voice: { hideAll: false },
      appearance: { hideAll: false },
      accessibility: { hideAll: false },
      language: { hideAll: false },
      chat: { hideAll: false },
      webBrowser: { hideAll: false },
      notifications: { hideAll: false },
      appIcon: { hideAll: false },
      advanced: { hideAll: false },
      appSettings: { hideAll: false },
      billing: { hideAll: false },
      support: { hideAll: false },
      whatsNew: { hideAll: false },
      developerSettings: { hideAll: false },
      buildStatus: { hideAll: false },
      staffSettings: { hideAll: false },
      _hasHydrated: false,
      updateSettings: (newSettings: Partial<SettingsSections>) =>
        set(state => ({ ...state, ...newSettings })),
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: "clearmenus-settingssections",
      storage: createJSONStorage(() => createFileStorage("plugins/clearmenus-settingssections.json")),
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    }
  )
);
import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const messageActionLabels = [
  "Reply",
  "Forward",
  "Copy Text",
  "Copy Message Link",
  "Copy ID",
  "Mark Unread",
  "Pin Message",
  "Unpin Message",
  "Add Reaction",
  "Create Thread",
  "Open Thread",
  "Apps",
  "Message",
  "Mention",
  "Edit Message",
  "Remove Embed",
  "Report",
  "Delete Message",
  "Share",
  "Save Image",
  "Save Video",
  "Save Sticker",
  "Download",
];

export interface MessageActionSheetSettings {
  hidden?: Record<string, boolean>;
  hideUnknown?: boolean;
  customLabels?: string;
}

type MessageActionSheetStore = PluginStore<MessageActionSheetSettings>;

export const useMessageActionSheetSettings = create<MessageActionSheetStore>()(
  persist(
    set => ({
      hidden: {},
      hideUnknown: false,
      customLabels: "",
      _hasHydrated: false,
      updateSettings: (newSettings: Partial<MessageActionSheetSettings>) =>
        set(state => ({ ...state, ...newSettings })),
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: "messageactionsheet-settings",
      storage: createJSONStorage(() => createFileStorage("plugins/messageactionsheet.json")),
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    }
  )
);
