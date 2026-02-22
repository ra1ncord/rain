import { useSettings } from "@api/settings";
import { Strings } from "@i18n";
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
            return Number(b.isEnabled()) - Number(a.isEnabled());
        },
        [Strings.DISABLED]: (a: UnifiedPluginModel, b: UnifiedPluginModel) => {
            if (isCore(a.id) !== isCore(b.id)) return isCore(a.id) ? -1 : 1;
            if (isPinned(a.id) !== isPinned(b.id)) return isPinned(b.id) ? 1 : -1;
            return Number(a.isEnabled()) - Number(b.isEnabled());
        },
    };

    const filteredItems = useMemo(() => {
        return items.filter(p => {
            if (p.devOnly && !developerSettings) {
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
                p =>
                    p.authors
                        ?.map((a: developer | string) => (typeof a === "string" ? a : a.name))
                        .join() || "",
            ]}
            sortOptions={sortOptions}
            defaultSortKey="Name (A-Z)"
            filterOptions={{
                [Strings.HIDE_CORE]: p => !p.id.startsWith("core"),
                [Strings.SHOW_CORE]: () => true,
            }}
            safeModeHint={{ message: Strings.HINT_SAFE_MODE }}
            defaultFilterKey={Strings.HIDE_CORE}
            items={filteredItems}
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
