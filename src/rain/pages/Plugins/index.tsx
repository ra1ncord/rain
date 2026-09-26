import { findAssetId } from "@api/assets";
import { installPluginFromCode, installPluginFromUrl, updateAllExternalPlugins, useExternalPlugins } from "@api/external/plugins";
import { useSettings } from "@api/settings";
import { hideSheet } from "@api/ui/sheets";
import { Strings } from "@i18n";
import { ActionSheet, BottomSheetTitleHeader, TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { pluginInstances, usePluginSettings } from "@plugins";
import { developer } from "@plugins/types";
import { openAddonInstallAlert } from "@rain/pages/Addon/AddonInstallAlert";
import AddonPage from "@rain/pages/Addon/AddonPage";
import { ComponentProps, useMemo } from "react";
import { View } from "react-native";

import PluginCard from "./components/PluginCard";
import { UnifiedPluginModel } from "./models";
import unifyRainPlugin from "./models/rain";

interface PluginPageProps
  extends Partial<ComponentProps<typeof AddonPage<UnifiedPluginModel>>> {
  useItems: () => unknown[];
}


function PluginPage(props: PluginPageProps) {
    const items = props.useItems() as UnifiedPluginModel[];
    const { pinnedPlugins, developerSettings } = useSettings();

    const isPinned = (id: string) => pinnedPlugins?.includes(id);
    const isCore = (id: string) => id.startsWith("core");

    const sortOptions = {
        [Strings.SORT_NAME_AZ]: (a: UnifiedPluginModel, b: UnifiedPluginModel) => {
            if (isCore(a.id) !== isCore(b.id)) return isCore(a.id) ? -1 : 1;
            if (isPinned(a.id) !== isPinned(b.id)) return isPinned(b.id) ? 1 : -1;
            return a.name.localeCompare(b.name);
        },
        [Strings.SORT_NAME_ZA]: (a: UnifiedPluginModel, b: UnifiedPluginModel) => {
            if (isCore(a.id) !== isCore(b.id)) return isCore(a.id) ? -1 : 1;
            if (isPinned(a.id) !== isPinned(b.id)) return isPinned(b.id) ? 1 : -1;
            return b.name.localeCompare(a.name);
        },
        [Strings.ENABLED]: (a: UnifiedPluginModel, b: UnifiedPluginModel) => {
            if (isCore(a.id) !== isCore(b.id)) return isCore(a.id) ? -1 : 1;
            if (isPinned(a.id) !== isPinned(b.id)) return isPinned(b.id) ? 1 : -1;
            return Number(b.isEnabled()) - Number(a.isEnabled()) || a.name.localeCompare(b.name);
        },
        [Strings.DISABLED]: (a: UnifiedPluginModel, b: UnifiedPluginModel) => {
            if (isCore(a.id) !== isCore(b.id)) return isCore(a.id) ? -1 : 1;
            if (isPinned(a.id) !== isPinned(b.id)) return isPinned(b.id) ? 1 : -1;
            return Number(a.isEnabled()) - Number(b.isEnabled()) || a.name.localeCompare(b.name);
        },
    };

    const filteredItems = useMemo(() => {
        return items.filter(p => {
            if (p.devOnly && !developerSettings) {
                return false;
            }
            if (p.isPlatformSupported && !p.isPlatformSupported()) {
                return false;
            }
            if (p.arePredicatesMet && !p.arePredicatesMet()) {
                return false;
            }
            return true;
        });
    }, [items, pinnedPlugins, developerSettings]);

    return (
        <AddonPage<UnifiedPluginModel>
            CardComponent={PluginCard}
            title={Strings.PLUGINS}
            searchKeywords={[
                "name",
                "description",
                p => {
                    const allAuthors = [...(p.developers ?? []), ...(p.contributors ?? [])];
                    return allAuthors.map((a: developer) => a.name).join() || "";
                },
            ]}
            sortOptions={sortOptions}
            defaultSortKey={Strings.ENABLED}
            filterOptions={{
                [Strings.HIDE_CORE]: p => !p.id.startsWith("core"),
                [Strings.SHOW_CORE]: () => true,
                "Third-party": p => !!p.isExternal,
            }}
            installAction={{
                label: "Install Plugin",
                onPress: openPluginInstallAlert,
            }}
            OptionsActionSheetComponent={ExternalOptionsSheet}
            safeModeHint={{ message: Strings.HINT_SAFE_MODE }}
            defaultFilterKey={Strings.HIDE_CORE}
            items={filteredItems}
            {...props}
        />
    );
}

function openPluginInstallAlert() {
    openAddonInstallAlert({
        title: "Install Plugin",
        description: "Link or .js file. Only install stuff you trust.",
        onUrl: installPluginFromUrl,
        onCode: installPluginFromCode,
    });
}

function ExternalOptionsSheet() {
    const autoUpdate = useExternalPlugins(s => s.autoUpdate);
    const count = useExternalPlugins(s => Object.keys(s.plugins).length);

    return (
        <ActionSheet>
            <BottomSheetTitleHeader title="Plugins" />
            <View style={{ paddingVertical: 20, gap: 12 }}>
                <TableRowGroup title={`${count} installed`}>
                    <TableRow
                        label="Install Plugin"
                        icon={<TableRow.Icon source={findAssetId("DownloadIcon")} />}
                        onPress={() => {
                            hideSheet("AddonMoreSheet");
                            openPluginInstallAlert();
                        }}
                    />
                    <TableRow
                        label="Check for Updates"
                        icon={<TableRow.Icon source={findAssetId("RetryIcon")} />}
                        onPress={() => void updateAllExternalPlugins()}
                    />
                    <TableSwitchRow
                        label="Auto-update"
                        value={autoUpdate}
                        onValueChange={(v: boolean) => useExternalPlugins.getState().setAutoUpdate(v)}
                    />
                </TableRowGroup>
            </View>
        </ActionSheet>
    );
}

export default function Plugins() {
    useSettings();
    const external = useExternalPlugins(s => s.plugins);
    usePluginSettings(s => s.settings);

    const items = useMemo(() => {
        return Array.from(pluginInstances.values()).map(unifyRainPlugin);
    }, [external]);

    return (
        <PluginPage
            useItems={() => items}
        />
    );
}
