import { pluginInstances } from "@plugins";
import AddonPage from "./components/AddonPage";
import PluginCard from "./components/PluginCard";
import { developer } from "@plugins/types";
import { findAssetId } from "@lib/api/assets";
import { settings } from "@lib/api/settings";
import { awaitStorage, useObservable } from "@lib/api/storage";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByProps } from "@metro";
import { Card } from "@metro/common/components";
import { ComponentProps } from "react";
import { View } from "react-native";

import { UnifiedPluginModel } from "./models";
import unifyRainPlugin from "./models/rain";
import { ErrorBoundary } from "@lib/ui/components";

interface PluginPageProps
  extends Partial<ComponentProps<typeof AddonPage<UnifiedPluginModel>>> {
  useItems: () => unknown[];
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
            ?.map((a: developer | string) => (typeof a === "string" ? a : a.name))
            .join() || "",
      ]}
      sortOptions={{
        "Name (A-Z)": (a, b) => a.name.localeCompare(b.name),
        "Name (Z-A)": (a, b) => b.name.localeCompare(a.name),
      }}
      items={items}
      {...props}
    />
  );
}

export default function Plugins() {

  awaitStorage(settings)
  useObservable([settings]);

  return (
    <PluginPage
      useItems={() => {
        const rainPlugins = [...pluginInstances.values()];
        return rainPlugins.map(plugin => unifyRainPlugin(plugin));
      }}
    />
  );
}
