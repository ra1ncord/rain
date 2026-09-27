import { createPluginStore } from "@api/storage";

export type FeatureId = "volume" | "deafen" | "split" | "rotate" | "updates";

export const {
    useStore: useCheeseburger,
    settings: cheeseburger,
} = createPluginStore<Record<FeatureId, boolean>>("cheeseburger", {
    volume: true,
    deafen: true,
    split: true,
    rotate: true,
    updates: true,
});
