import { useSettings } from "@api/settings";
import { pluginInstances } from "@plugins";
import { developer } from "@plugins/types";
import AddonPage from "@rain/pages/Addon/AddonPage";
import { Strings } from "@i18n";
import { ComponentProps, useMemo } from "react";

import PluginCard from "./components/PluginCard";
import { UnifiedPluginModel } from "./models";
import unifyRainPlugin from "./models/rain";

interface PluginPageProps
  extends Partial<ComponentProps<typeof AddonPage<UnifiedPluginModel>>> {
  useItems: () => unknown[];
}

function PluginPage(props: PluginPageProps) {
    const items = props.useItems() as UnifiedPluginModel[];
    const { pinnedPlugins } = useSettings();

    // Reorder items so pinned ones are at the top
    const reorderedItems = useMemo(() => {
        if (!pinnedPlugins || pinnedPlugins.length === 0) return items;

        const pinned = items.filter(p => pinnedPlugins.includes(p.id));
        const unpinned = items.filter(p => !pinnedPlugins.includes(p.id));

        return [...pinned, ...unpinned];
    }, [items, pinnedPlugins]);

    return (
        <AddonPage<UnifiedPluginModel>
            CardComponent={PluginCard}
            title={Strings.PLUGINS}
            searchKeywords={[
                "name",
                "description",
                p =>
                    p.authors
                        ?.map((a: developer | string) => (typeof a === "string" ? a : a.name))
                        .join() || "",
            ]}
            sortOptions={{
                [Strings.SORT_NAME_AZ]: (a, b) => a.name.localeCompare(b.name),
                [Strings.SORT_NAME_ZA]: (a, b) => b.name.localeCompare(a.name),
                [Strings.ENABLED]: (a, b) => Number(b.isEnabled()) - Number(a.isEnabled()),
                [Strings.DISABLED]: (a, b) => Number(a.isEnabled()) - Number(b.isEnabled()),
            }}
            filterOptions={{
                [Strings.HIDE_CORE]: p => !p.id.startsWith("core"),
                [Strings.SHOW_CORE]: () => true,
            }}
            safeModeHint={{ message: Strings.HINT_SAFE_MODE }}
            defaultFilterKey={Strings.HIDE_CORE}
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
