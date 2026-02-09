import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createFileStorage, PluginStore } from "@api/storage";

interface Settings {
	blocked: boolean;
	ignored: boolean;
	removeReplies: boolean;
}

type HideBlockedAndIgnoredMessagesSettingsStore = PluginStore<Settings>;

export const useHideBlockedAndIgnoredMessagesSettings = create<HideBlockedAndIgnoredMessagesSettingsStore>()(
	persist(
		(set) => ({
			blocked: true,
			ignored: true,
			removeReplies: true,
			_hasHydrated: false,
			updateSettings: (newSettings) =>
				set((state) => ({ ...state, ...newSettings })),
			setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
		}),
		{
			name: "hideblockedandignoredmessages-settings",
			storage: createJSONStorage(() =>
				createFileStorage("plugins/hideblockedandignored.json"),
			),
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true);
			},
		},
	),
);

export const hideblockedandignoredmessagesSettings = new Proxy({} as Settings, {
	get(target, prop: string) {
		return useHideBlockedAndIgnoredMessagesSettings.getState()[prop as keyof Settings];
	},
	set(target, prop: string, value: any) {
		useHideBlockedAndIgnoredMessagesSettings
			.getState()
			.updateSettings({ [prop]: value } as Partial<Settings>);
		return true;
	},
});
