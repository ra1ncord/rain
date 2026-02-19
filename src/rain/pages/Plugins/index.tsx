import { useSettings } from "@api/settings";
import { pluginInstances } from "@plugins";
import { developer } from "@plugins/types";
import AddonPage from "@rain/pages/Addon/AddonPage";
import { ComponentProps, useMemo } from "react";

import PluginCard from "./components/PluginCard";
import { UnifiedPluginModel } from "./models";
import unifyRainPlugin from "./models/rain";

interface PluginPageProps
  extends Partial<ComponentProps<typeof AddonPage<UnifiedPluginModel>>> {
  useItems: () => unknown[];
}

// Plugins that should only be visible in developer mode
const DEV_ONLY_PLUGINS = ["actionsheetfinder"];

function PluginPage(props: PluginPageProps) {
    const items = props.useItems() as UnifiedPluginModel[];
    const { pinnedPlugins, developerSettings } = useSettings();

    // Filter items based on developer mode and reorder pinned ones to the top
    const reorderedItems = useMemo(() => {
        // Filter out dev-only plugins if developer mode is off
        let filtered = items.filter(p => {
            if (DEV_ONLY_PLUGINS.includes(p.id) && !developerSettings) {
                return false;
            }
            return true;
        });

        // Reorder items so pinned ones are at the top
        if (!pinnedPlugins || pinnedPlugins.length === 0) return filtered;
        
        const pinned = filtered.filter(p => pinnedPlugins.includes(p.id));
        const unpinned = filtered.filter(p => !pinnedPlugins.includes(p.id));
        
        return [...pinned, ...unpinned];
    }, [items, pinnedPlugins, developerSettings]);

    return (
        <AddonPage<UnifiedPluginModel>
            CardComponent={PluginCard}
            title={"plugins"}
            searchKeywords={[
                "name",
                "description",
                p =>
                    p.authors
                        ?.map((a: developer | string) => (typeof a === "string" ? a : a.name))
                        .join() || "",
            ]}
            sortOptions={{
                "Name (A-Z)": (a, b) => a.name.localeCompare(b.name),
                "Name (Z-A)": (a, b) => b.name.localeCompare(a.name),
                "Enabled": (a, b) => Number(b.isEnabled()) - Number(a.isEnabled()),
                "Disabled": (a, b) => Number(a.isEnabled()) - Number(b.isEnabled()),
            }}
            filterOptions={{
                "Hide Core Plugins": p => !p.id.startsWith("core"),
                "Show Core Plugins": () => true,
            }}
            safeModeHint={{ message: "You are in safemode, plugins are not running but can still be toggled" }}
            defaultFilterKey="Hide Core Plugins"
            items={reorderedItems}
            {...props}
        />
    );
}

export default function Plugins() {
    useSettings();

    return (
        <PluginPage
            useItems={() => {
                const rainPlugins = [...pluginInstances.values()];
                return rainPlugins.map(plugin => unifyRainPlugin(plugin));
            }}
        />
    );
}
