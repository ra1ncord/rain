import { useSettings } from "@api/settings";
import { awaitStorage, useObservable } from "@api/storage/bnstorage";
import { AlertModal, Text } from "@metro/common/components";
import AddonPage from "@rain/pages/Addon/AddonPage";
import { findPluginById } from "@rain/plugins";
import { isPluginInstalled, pluginSettings, registeredPlugins } from "@rain/plugins/traveller/bunny";
import { Author } from "@rain/plugins/traveller/types";
import { VdPluginManager } from "@rain/plugins/traveller/vendetta";
import { ComponentProps } from "react";
import * as React from "react";

import PluginCard from "./components/PluginCard";
import { bunnyToRainMap } from "./map";
import { UnifiedPluginModel } from "./models";
import unifyBunnyPlugin from "./models/bunny";
import unifyVdPlugin from "./models/vendetta";

interface PluginPageProps
  extends Partial<ComponentProps<typeof AddonPage<UnifiedPluginModel>>> {
  useItems: () => unknown[];
}

function isCorePlugin(id: string): boolean {
    return id.startsWith("core");
}

function PluginPage(props: PluginPageProps) {
    const items = props.useItems();
    return (
        <AddonPage<UnifiedPluginModel>
            CardComponent={PluginCard}
            title={"plugins"}
            searchKeywords={[
                "name",
                "description",
                p =>
                    p.authors
                        ?.map((a: Author | string) => (typeof a === "string" ? a : a.name))
                        .join() || "",
            ]}
            sortOptions={{
                "Name (A-Z)": (a, b) => a.name.localeCompare(b.name),
                "Name (Z-A)": (a, b) => b.name.localeCompare(a.name),
                "Enabled": (a, b) => Number(b.isEnabled()) - Number(a.isEnabled()),
                "Disabled": (a, b) => Number(a.isEnabled()) - Number(b.isEnabled()),
            }}
            filterOptions={{
            }}
            defaultFilterKey="Hide Core Plugins"
            items={items}
            {...props}
        />
    );
}

export default function Plugins() {
    const [isReady, setIsReady] = React.useState(false);

    React.useEffect(() => {
        awaitStorage(VdPluginManager.plugins, pluginSettings).then(() => {
            setIsReady(true);
        });
    }, []);

    useSettings();

    if (!isReady) {
        return <Text>Loading plugins...</Text>;
    }

    return (
        <PluginPage
            useItems={() => {
                useObservable([VdPluginManager.plugins, pluginSettings]);
                const vdPlugins = Object.values(VdPluginManager.plugins).map(unifyVdPlugin);
                const bnPlugins = [...registeredPlugins.values()]
                    .filter(p => isPluginInstalled(p.id) && !isCorePlugin(p.id))
                    .map(unifyBunnyPlugin);
                return [...vdPlugins, ...bnPlugins];
            }}
            installAction={{
                label: "Install a plugin",
                fetchFn: async (url: string) => {
                    const alternative = bunnyToRainMap[url];
                    findPluginById(alternative);
                    replaceWithRainPlugin();
                    // startPlugin(alternative);
                    // return await VdPluginManager.installPlugin(url);
                },
            }}
        />
    );
}

function replaceWithRainPlugin() {
    return(<AlertModal
        title={"Hey wait!"}
        content="Theres a rain plugin for that, are you sure you want to install the vendetta version?"
    />
    );
}
