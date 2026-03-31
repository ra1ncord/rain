import { NavigationNative, ReactNative } from "@metro/common";
import React from "react";
import { View } from "react-native";

import { apiFetch } from "../../lib/api";
import EffectCard from "../components/EffectCard";

const { FlatList } = ReactNative;

export default function Presets() {
    const [effects, setEffects] = React.useState<any[]>([]);
    const [selected, setSelected] = React.useState<string | null>(null);
    const navigation = NavigationNative.useNavigation();

    const load = React.useCallback(async () => {
        try {
            const me = await apiFetch("/me", { method: "POST" });
            const presets = await apiFetch("/presets", { method: "POST" });

            setSelected(me?.data?.selected || null);
            setEffects(Array.isArray(presets) ? presets : []);
        } catch (e) {
            console.error("Failed loading presets", e);
        }
    }, []);

    React.useEffect(() => {
        load();
        
        const unsubscribe = navigation.addListener("focus", () => {
            load();
        });
        
        return unsubscribe;
    }, [load, navigation]);

    const handleSelectEffect = React.useCallback(
        async (effect: any) => {
            try {
                await apiFetch("/set-effect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ effectId: effect.skuId }),
                });

                setSelected(effect.skuId);
                navigation.goBack();
            } catch (e) {
                console.error("Failed to select effect", e);
            }
        },
        [navigation]
    );

    const renderItem = React.useCallback(
        ({ item }: { item: any }) => (
            <EffectCard
                effect={item}
                selected={selected === item.skuId}
                onSelect={() => handleSelectEffect(item)}
            />
        ),
        [selected, handleSelectEffect]
    );

    return (
        <FlatList
            data={effects}
            keyExtractor={(item) => item.skuId}
            renderItem={renderItem}
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
    );
}
