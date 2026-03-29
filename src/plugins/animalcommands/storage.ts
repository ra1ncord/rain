import { createPluginStore } from "@api/storage";

import { sources } from "./sources";

interface AnimalCommandsSettings {
    enabled: Record<string, boolean>;
    source: Record<string, string>;
}

const defaultEnabled = Object.fromEntries(
    sources.map(source => [source.id, true])
);

const defaultSource = Object.fromEntries(
    sources.map(source => [source.id, source.sources[0]?.id ?? ""])
);

export const {
    useStore: useAnimalCommandsSettings,
    settings: animalCommandsSettings,
} = createPluginStore<AnimalCommandsSettings>("animalcommands", {
    enabled: defaultEnabled,
    source: defaultSource,
});

export const isAnimalEnabled = (id: string) => {
    const enabled = useAnimalCommandsSettings.getState().enabled ?? {};
    return enabled[id] ?? true;
};

export const getAnimalSourceId = (id: string) => {
    const selection = useAnimalCommandsSettings.getState().source ?? {};
    const animal = sources.find(source => source.id === id);
    if (!animal) return selection[id];
    const selected = selection[id];
    if (selected && animal.sources.some(source => source.id === selected)) return selected;
    return animal.sources[0]?.id;
};

export const ensureAnimalDefaults = () => {
    const state = useAnimalCommandsSettings.getState();
    const enabled = { ...(state.enabled ?? {}) };
    const sourceSelection = { ...(state.source ?? {}) };
    let changed = false;

    for (const animal of sources) {
        if (enabled[animal.id] === undefined) {
            enabled[animal.id] = true;
            changed = true;
        }
        const defaultSourceId = animal.sources[0]?.id;
        if (defaultSourceId) {
            const selected = sourceSelection[animal.id];
            if (!selected || !animal.sources.some(option => option.id === selected)) {
                sourceSelection[animal.id] = defaultSourceId;
                changed = true;
            }
        }
    }

    if (changed) {
        state.updateSettings({ enabled, source: sourceSelection });
    }
};
