import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { fileExists, readFile, writeFile } from "@api/native/fs";

interface Settings {
	transformEmoji: boolean;
	transformSticker: boolean;
}

interface RealMojiSettingsStore extends Settings {
	updateSettings: (settings: Partial<Settings>) => void;
	_hasHydrated: boolean;
	setHasHydrated: (state: boolean) => void;
}

const createFileStorage = (filePath: string) => {
	return {
		getItem: async (name: string): Promise<string | null> => {
			try {
				const exists = await fileExists(filePath);
				if (!exists) return null;
				return await readFile(filePath);
			} catch (e) {
				console.error(`Failed to read storage from '${filePath}'`, e);
				return null;
			}
		},
		setItem: async (name: string, value: string): Promise<void> => {
			try {
				await writeFile(filePath, value);
			} catch (e) {
				console.error(`Failed to write storage to '${filePath}'`, e);
			}
		},
		removeItem: async (name: string): Promise<void> => {
			// maybe this should be implemented :P
		},
	};
};

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

export async function waitForRealMojiSettingsHydration(): Promise<void> {
	return new Promise((resolve) => {
		if (useRealMojiSettings.getState()._hasHydrated) {
			resolve();
			return;
		}

		const unsubscribe = useRealMojiSettings.subscribe((state) => {
			if (state._hasHydrated) {
				unsubscribe();
				resolve();
			}
		});

		setTimeout(() => {
			unsubscribe();
			resolve();
		}, 5000);
	});
}

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
