import { findByStoreName } from "@metro/wrappers";
import { getCurrentTheme } from "@plugins/_core/painter/themes";

import { InactiveReason } from "..";
import patchIcons from "../patches/icons";
import patchMentionLineColors from "../patches/mentionLineColor";
import type { IconpackConfig,IconpackData } from "../types";
import { state, updateState } from "./active";
import constants from "./constants";
import getIconpackData, { type FetchedIconpackData } from "./iconpackDataGetter";
import { cFetch } from "./util";

const UserStore = findByStoreName("UserStore");

export const patches: (() => void)[] = [];

export default async function load() {
    for (const x of patches) {
        x();
    }
    patches.length = 0;

    state.loading = true;
    state.active = false;
    state.iconpack = {
        iconpack: undefined,
        list: [],
        hashes: {},
    };
    state.patches = [];
    state.inactive = [];
    updateState();

    try {
        state.iconpack = {
            iconpack: undefined,
            list: await cFetch<IconpackData>(
                constants.iconpacks.list,
                undefined,
                "json",
            ).then(res => res.list),
            hashes: await cFetch(constants.iconpacks.hashes, undefined, "json"),
        };
    } catch {
        if (
            !state.iconpack.list.length
|| !Object.keys(state.iconpack.hashes).length
        ) {
            state.loading = false;
            state.inactive.push(InactiveReason.NoIconpacksList);
            updateState();
            return;
        }
    }

    const selectedTheme = getCurrentTheme();

    if (!selectedTheme) {
        state.loading = false;
        state.inactive.push(InactiveReason.NoTheme);
        updateState();
        return;
    }

    const plusData = (selectedTheme.data as any)?.plus;
    if (!plusData) {
        state.loading = false;
        state.inactive.push(InactiveReason.ThemesPlusUnsupported);
        updateState();
        return;
    }

    const useIconpack = plusData.iconpack;
    const isCustomIconpack = false;

    const user = UserStore.getCurrentUser();
    state.iconpack.iconpack = state.iconpack.list.find(x => useIconpack === x.id);

    let iconpackConfig: IconpackConfig = {
        biggerStatus: false,
    };
    let tree: string[] = [];

    if (!isCustomIconpack && state.iconpack.iconpack) {
        let dt: FetchedIconpackData;
        try {
            dt = await getIconpackData(
                state.iconpack.iconpack.id,
                state.iconpack.iconpack.config,
            );
        } catch {
            dt = { config: null, tree: null };
        }

        if (dt.tree === null) {
            state.loading = false;
            if (dt.config === null) {
                state.inactive.push(InactiveReason.NoIconpackConfig);
            }
            if (dt.tree === null) {
                state.inactive.push(InactiveReason.NoIconpackFiles);
            }
            updateState();
            return;
        }

        tree = dt.tree;
        if (dt.config) iconpackConfig = dt.config;
    }

    state.active = true;
    state.loading = false;

    patchIcons(plusData, tree, iconpackConfig);
    patchMentionLineColors(plusData);

    updateState();
}
