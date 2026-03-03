import { React } from "@metro/common";

import { InactiveReason,PatchType } from "..";
import type { IconpackData } from "../types";

export const state = {
    loading: true,
    active: false,
    iconpack: {
        iconpack: undefined as any,
        list: [] as IconpackData[],
        hashes: {} as Record<string, string>,
    },
    patches: [] as PatchType[],
    inactive: [] as InactiveReason[],
};

const listeners = new Set<() => void>();

export function updateState() {
    for (const x of listeners) x();
}

export function useState() {
    const [, setTick] = React.useState(0);
    React.useEffect(() => {
        const listener = () => setTick(t => t + 1);
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, []);
}
