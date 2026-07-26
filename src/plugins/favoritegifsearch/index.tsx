import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { View } from "react-native";
import { after } from "@api/patcher";
import { findByDisplayName, findByName } from "@metro";
import { Text } from "@metro/common/components";
import { Search } from "@api/ui/components";
import ErrorBoundary from "@api/ui/components/ErrorBoundary";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

const patches: (() => boolean)[] = [];

function fuzzySearch(searchQuery: string, searchString: string) {
  let searchIndex = 0;
  let score = 0;

  for (let i = 0; i < searchString.length; i++) {
    if (searchString[i] === searchQuery[searchIndex]) {
      score++;
      searchIndex++;
    } else {
      score--;
    }

    if (searchIndex === searchQuery.length) return score;
  }

  return null;
}

function normalizeUrl(urlStr: string) {
  let url: string;
  try {
    url = new URL(urlStr).pathname.split("/").at(-1) ?? urlStr;
  } catch {
    url = urlStr;
  }
  return url.replace(/(%20|[_-])/g, " ").toLowerCase();
}

function FavoriteSearchWrapper({ OriginalComponent, ...props }: any) {
  const [query, setQuery] = useState("");
  const deadRef = useRef(false);
  const resultItems = props.resultItems;

  const filteredItems = useMemo(() => {
    if (!query || !resultItems) return resultItems?.slice();

    const q = query.toLowerCase();

    const scored = resultItems
      .map((item: any) => {
        const target = normalizeUrl(item.url || item.src || "");
        const title = (item.title || "").toLowerCase();
        const score = fuzzySearch(q, target) ?? fuzzySearch(q, title);
        return score != null ? { item, score } : null;
      })
      .filter(Boolean) as { item: any; score: number }[];

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.item);
  }, [resultItems, query]);

  useEffect(() => {
    return () => { deadRef.current = true; };
  }, []);

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
      {query && filteredItems?.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text variant="text-md/medium" color="text-muted">No search results found</Text>
        </View>
      ) : (
        <OriginalComponent key={query || "all"} {...props} resultItems={filteredItems} />
      )}
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
