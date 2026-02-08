import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createFileStorage } from "@api/storage";

interface Settings {
	transformEmoji: boolean;
	transformSticker: boolean;
}

interface RealMojiSettingsStore extends Settings {
	updateSettings: (settings: Partial<Settings>) => void;
	_hasHydrated: boolean;
	setHasHydrated: (state: boolean) => void;
}

export const useRealMojiSettings = create<RealMojiSettingsStore>()(
	persist(
		(set) => ({
			transformEmoji: true,
			transformSticker: true,
			_hasHydrated: false,
			updateSettings: (newSettings) =>
				set((state) => ({ ...state, ...newSettings })),
			setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
		}),
		{
			name: "realmoji-settings",
			storage: createJSONStorage(() =>
				createFileStorage("plugins/realmoji.json"),
			),
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true);
			},
		},
	),
);

export const realmojiSettings = new Proxy({} as Settings, {
	get(target, prop: string) {
		return useRealMojiSettings.getState()[prop as keyof Settings];
	},
	set(target, prop: string, value: any) {
		useRealMojiSettings
			.getState()
			.updateSettings({ [prop]: value } as Partial<Settings>);
		return true;
	},
});
