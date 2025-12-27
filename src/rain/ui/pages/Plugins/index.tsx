import { pluginInstances } from "@plugins";
import AddonPage from "@rain/ui/components/addons/AddonPage";
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
import { ErrorBoundary } from "@ui/components";
import * as React from "react";

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
        "Name (Z-A)": (a, b) => b.name.localeCompare(b.name),
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