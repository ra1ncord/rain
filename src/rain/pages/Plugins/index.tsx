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
        [Strings.GENERAL.CORE.SORT_NAME_AZ]: (a: UnifiedPluginModel, b: UnifiedPluginModel) => {
            if (isCore(a.id) !== isCore(b.id)) return isCore(a.id) ? -1 : 1;
            if (isPinned(a.id) !== isPinned(b.id)) return isPinned(b.id) ? 1 : -1;
            return a.name.localeCompare(b.name);
        },
        [Strings.GENERAL.CORE.SORT_NAME_ZA]: (a: UnifiedPluginModel, b: UnifiedPluginModel) => {
            if (isCore(a.id) !== isCore(b.id)) return isCore(a.id) ? -1 : 1;
            if (isPinned(a.id) !== isPinned(b.id)) return isPinned(b.id) ? 1 : -1;
            return b.name.localeCompare(a.name);
        },
        [Strings.GENERAL.CORE.ENABLED]: (a: UnifiedPluginModel, b: UnifiedPluginModel) => {
            if (isCore(a.id) !== isCore(b.id)) return isCore(a.id) ? -1 : 1;
            if (isPinned(a.id) !== isPinned(b.id)) return isPinned(b.id) ? 1 : -1;
            return Number(b.isEnabled()) - Number(a.isEnabled());
        },
        [Strings.GENERAL.CORE.DISABLED]: (a: UnifiedPluginModel, b: UnifiedPluginModel) => {
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
            title={Strings.GENERAL.CORE.PLUGINS}
            searchKeywords={[
                "name",
                "description",
                p => {
                    const allAuthors = [...(p.developers ?? []), ...(p.contributors ?? [])];
                    return allAuthors.map((a: developer) => a.name).join() || "";
                },
            ]}
            sortOptions={sortOptions}
            defaultSortKey="Name (A-Z)"
            filterOptions={{
                [Strings.GENERAL.CORE.HIDE_CORE]: p => !p.id.startsWith("core"),
                [Strings.GENERAL.CORE.SHOW_CORE]: () => true,
            }}
            safeModeHint={{ message: Strings.GENERAL.CORE.HINT_SAFE_MODE }}
            defaultFilterKey={Strings.GENERAL.CORE.HIDE_CORE}
            items={filteredItems}
            {...props}
        />
    );
}

export default function Plugins() {
    useSettings();

    const items = useMemo(() => {
        return Array.from(pluginInstances.values()).map(unifyRainPlugin);
    }, []); 

    return (
        <PluginPage
            useItems={() => items}
        />
    );
}
