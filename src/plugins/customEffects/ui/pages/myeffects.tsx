import { NavigationNative,ReactNative } from "@metro/common";
import { Forms } from "@metro/common/components";
import React from "react";
import { View } from "react-native";

import { apiFetch } from "../../lib/api";
import EffectCard from "../components/EffectCard";

const { FlatList } = ReactNative;
const { FormDivider, FormTitle } = Forms;

type ListItem =
    | { type: "header"; title: string }
    | { type: "effect"; data: any };

export default function MyEffects() {
    const [items, setItems] = React.useState<ListItem[]>([]);
    const [selected, setSelected] = React.useState<string | null>(null);
    const navigation = NavigationNative.useNavigation();

    async function load() {
        try {
            const me = await apiFetch("/me", { method: "POST" });
            const myEffects = await apiFetch("/my-effects", { method: "POST" });

            setSelected(me.data.selected);

            const list: ListItem[] = [];

            list.push(
                // @ts-ignore
                ...myEffects.map(e => ({
                    type: "effect",
                    data: e
                }))
            );

            setItems(list);
        } catch (e) {
            console.error("Failed loading myeffects", e);
        }
    }

    React.useEffect(() => {
        load();
    }, []);

    return (
        <>
            <FlatList
                data={items}
                keyExtractor={(item, index) =>
                    item.type === "effect"
                        ? item.data.skuId
                        : `header-${index}`
                }
                renderItem={({ item }) => {
                    if (item.type === "header") {
                        return (
                            <View style={{ paddingHorizontal: 12 }}>
                                <FormDivider />
                                <FormTitle title={item.title} />
                            </View>
                        );
                    }

                    return (
                        <EffectCard
                            effect={item.data}
                            selected={selected === item.data.skuId}
                            onSelect={async () => {
                                try {
                                    await apiFetch("/set-effect", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ effectId: item.data.skuId }),
                                    });

                                    const me = await apiFetch("/me", { method: "POST" });
                                    setSelected(item.data.skuId);

                                    navigation.goBack();
                                } catch (e) {
                                    console.error("Failed to select effect", e);
                                }
                            }}
                        />
                    );
                }}
                numColumns={3}
                columnWrapperStyle={{
                    justifyContent: "space-between",
                    paddingHorizontal: 12
                }}
                contentContainerStyle={{
                    paddingVertical: 12
                }}
                ItemSeparatorComponent={() => (
                    <View style={{ height: 12 }} />
                )}
            />
        </>
    );
}
