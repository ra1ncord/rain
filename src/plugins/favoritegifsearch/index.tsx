import { useState, useMemo } from "react";
import { View } from "react-native";
import { after } from "@api/patcher";
import { findByDisplayName, findByName } from "@metro";
import { Search } from "@api/ui/components";
import ErrorBoundary from "@api/ui/components/ErrorBoundary";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

const patches: (() => boolean)[] = [];

function FavoriteSearchWrapper({ OriginalComponent, ...props }: any) {
  const [query, setQuery] = useState("");
  const resultItems = props.resultItems;

  const filteredItems = useMemo(() => {
    if (!query || !resultItems) return resultItems?.slice();
    const q = query.toLowerCase();
    return resultItems.filter((item: any) => {
      const title = (item.title || "").toLowerCase();
      const url = (item.url || item.src || "").toLowerCase();
      return title.includes(q) || url.includes(q);
    });
  }, [resultItems, query]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 12, paddingBottom: 4 }}>
        <ErrorBoundary>
          <Search
            onChangeText={setQuery}
            placeholder="Search Favorite GIFs"
            isRound={true}
          />
        </ErrorBoundary>
      </View>
      <OriginalComponent {...props} resultItems={filteredItems} />
    </View>
  );
}

export default definePlugin({
  name: "FavoriteGifSearch",
  description: "Add a search bar to your favorite GIFs",
  author: [Developers.Livie],
  id: "favoritegifsearch",
  version: "1.0.0",
  start() {
    const resultsListModule = findByDisplayName("GIFPickerResultsList", false)
      ?? findByName("GIFPickerResultsList", false);

    if (!resultsListModule) {
      console.warn("[FavoriteGifSearch] GIFPickerResultsList module not found");
      return;
    }

    const OriginalComponent = resultsListModule.default;
    if (typeof OriginalComponent !== "function" && !OriginalComponent?.render) {
      console.warn("[FavoriteGifSearch] Default export is not a renderable component");
      return;
    }

    patches.push(
      after("default", resultsListModule, (args: any[], ret: any) => {
        const resultItems = args[0]?.resultItems;
        const firstItem = resultItems?.[0];
        const isFavorites = firstItem != null && typeof firstItem === "object" && "order" in firstItem;
        if (!isFavorites) return;

        return (
          <FavoriteSearchWrapper
            {...args[0]}
            OriginalComponent={OriginalComponent}
          />
        );
      })
    );
  },
  stop() {
    for (const p of patches) {
      try { p(); } catch (e) {
        console.warn("[FavoriteGifSearch] failed to unpatch", e);
      }
    }
    patches.length = 0;
  },
});
