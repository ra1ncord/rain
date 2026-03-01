import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createFileStorage } from "@api/storage";

interface CacheStore {
iconpacks: Record<string, any>;
setIconpack: (id: string, data: any) => void;
}

export const useCacheStore = create<CacheStore>()(
persist(
(set) => ({
iconpacks: {},
setIconpack: (id, data) =>
set((state) => ({
iconpacks: { ...state.iconpacks, [id]: data },
})),
}),
{
name: "themes-plus-cache",
storage: createJSONStorage(() => createFileStorage("plugins/themes-plus-cache.json")),
},
),
);
