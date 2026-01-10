import { pluginInstances } from "@plugins";
import AddonPage from "@rain/pages/Addon/AddonPage";
import PluginCard from "./components/PluginCard";
import { developer } from "@plugins/types";
import { findAssetId } from "@api/assets";
import { settings } from "@api/settings";
import { awaitStorage, useObservable } from "@api/storage";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByProps } from "@metro";
import { AlertActionButton, AlertActions, AlertModal, Card, FlashList, IconButton, Text } from "@metro/common/components";
import { ComponentProps } from "react";
import { View } from "react-native";
import { UnifiedPluginModel } from "./models";
import { ErrorBoundary } from "@api/ui/components";
import * as React from "react";
import { Author } from "@rain/plugins/_core/traveller/types";
import { isPluginInstalled, pluginSettings, registeredPlugins } from "@rain/plugins/_core/traveller/bunny";
import { VdPluginManager } from "@rain/plugins/_core/traveller/vendetta";
import unifyVdPlugin from "./models/vendetta";
import unifyBunnyPlugin from "./models/bunny";
import { navigation } from "@metro/common";
import { openAlert } from "@api/ui/alerts";

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
        (p) =>
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
        "Hide Core Plugins": (p) => !p.id.startsWith("core"),
        "Show Core Plugins": () => true,
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

  useObservable([settings]);

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
          return await VdPluginManager.installPlugin(url);
        },
      }}
    />
  );
}