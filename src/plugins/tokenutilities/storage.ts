/* eslint-disable indent */
import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Settings {
  takenResponsability?: boolean;
}

type TokenUtilitiesSettingsStore = PluginStore<Settings>;

export const useTokenUtilitiesSettings = create<TokenUtilitiesSettingsStore>()(
  persist(
    set => ({
      takenResponsability: false,
      _hasHydrated: false,
      updateSettings: newSettings =>
        set(state => ({ ...state, ...newSettings })),
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: "userHasTakenResponsability",
      storage: createJSONStorage(() =>
        createFileStorage("plugins/tokenutilities.json"),
      ),
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export const tokenUtilitiesSettings = new Proxy({} as Settings, {
  get(target, prop: string) {
    return useTokenUtilitiesSettings.getState()[prop as keyof Settings];
  },
  set(target, prop: string, value: any) {
    useTokenUtilitiesSettings
      .getState()
      .updateSettings({ [prop]: value } as Partial<Settings>);
    return true;
  },
});
