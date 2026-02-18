import { findAssetId,iterateAssets } from "@api/assets";
import { useAssetBrowserSettings } from "@api/settings";
import { ErrorBoundary, Search } from "@api/ui/components";
import { showSheet } from "@api/ui/sheets";
import { ActionSheet, BottomSheetTitleHeader,IconButton, TableCheckboxRow, TableRowGroup } from "@metro/common/components";
import { NavigationNative } from "@metro/common";
import { useCallback,useMemo, useState, useEffect } from "react";
import { FlatList, View } from "react-native";

import AssetDisplay from "./AssetDisplay";

export const IMAGE_FILES = [
    { id: "png", label: "PNG", defaultEnabled: true },
    { id: "jpg", label: "JPG", defaultEnabled: true },
    { id: "jpeg", label: "JPEG", defaultEnabled: true },
    { id: "svg", label: "SVG", defaultEnabled: true },
    { id: "gif", label: "GIF", defaultEnabled: true },
];

export const TEXT_FILES = [
    { id: "jsona", label: "JSONA", defaultEnabled: false },
    { id: "json", label: "JSON", defaultEnabled: false },
    { id: "lottie", label: "Lottie", defaultEnabled: false },
];

export default function AssetBrowser() {
    const [search, setSearch] = useState("");
    const [updateTick, setUpdateTick] = useState(0);
    const navigation = NavigationNative.useNavigation();

    useEffect(() => {
        navigation.setOptions({ title: "ASSET_BROWSER" });
    }, [navigation]);

    const settings = useAssetBrowserSettings();
    const enabledFilters = settings.enabledFilters;

    const getFilteredAssets = useCallback(() => {
        return Array.from(iterateAssets()).filter(asset => {
            const type = String(asset.type ?? "").toLowerCase();
            return enabledFilters[type] === true;
        });
    }, [enabledFilters, updateTick]);

    const all = useMemo(() => getFilteredAssets(), [getFilteredAssets]);

    const toggleFilter = (filterId: string) => {
        settings.updateSettings({
            enabledFilters: {
                ...enabledFilters,
                [filterId]: !enabledFilters[filterId]
            }
        });
        setUpdateTick(prev => prev + 1);
    };

    const handleFilterPress = () => {
        showSheet("AssetBrowserFilter", () => {
            const sheetSettings = useAssetBrowserSettings();
            const sheetFilters = sheetSettings.enabledFilters;

            const toggleSheetFilter = (filterId: string) => {
                sheetSettings.updateSettings({
                    enabledFilters: {
                        ...sheetFilters,
                        [filterId]: !sheetFilters[filterId]
                    }
                });
            };

            return (
                <ActionSheet>
                    <BottomSheetTitleHeader title="ASSET_TYPES" />
                    <TableRowGroup title="IMAGE_FILES">
                        {IMAGE_FILES.map(fileType => (
                            <TableCheckboxRow
                                key={fileType.id}
                                label={fileType.label}
                                checked={sheetFilters[fileType.id] === true}
                                onPress={() => toggleSheetFilter(fileType.id)}
                            />
                        ))}
                    </TableRowGroup>
                    <TableRowGroup title="TEXT_FILES">
                        {TEXT_FILES.map(fileType => (
                            <TableCheckboxRow
                                key={fileType.id}
                                label={fileType.label}
                                checked={sheetFilters[fileType.id] === true}
                                onPress={() => toggleSheetFilter(fileType.id)}
                            />
                        ))}
                    </TableRowGroup>
                </ActionSheet>
            );
        });
    };

    return (
        <ErrorBoundary>
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", margin: 10, gap: 8, alignItems: "center" }}>
                    <Search
                        style={{ flex: 1 }}
                        isRound
                        onChangeText={(v: string) => setSearch(v)}
                    />
                    <IconButton
                        icon={findAssetId("FileIcon")}
                        variant="tertiary"
                        onPress={handleFilterPress}
                    />
                </View>
                <View
                    style={{
                        flex: 1,
                        borderRadius: 16,
                        paddingHorizontal: 12,
                        overflow: "hidden",
                        backgroundColor: "transparent",
                    }}
                >
                    <FlatList
                        data={all.filter(
                            a => (a.name.includes(search) || a.id.toString() === search),
                        )}
                        renderItem={({ item }: any) => <AssetDisplay asset={item} />}
                        contentContainerStyle={{
                            overflow: "hidden",
                            backgroundColor: "transparent",
                            borderRadius: 16,
                        }}
                        keyExtractor={a => a.name}
                    />
                </View>
            </View>
        </ErrorBoundary>
    );
}
