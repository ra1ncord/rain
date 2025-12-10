import { CardWrapper } from "./AddonCard";
import { findAssetId } from "@lib/api/assets";
import { settings } from "@lib/api/settings";
import { dismissAlert, openAlert } from "@lib/ui/alerts";
import { showSheet } from "@lib/ui/sheets";
import isValidHttpUrl from "@lib/utils/isValidHttpUrl";
import { lazyDestructure, proxyLazy } from "@lib/utils/lazy";
import { findByProps } from "@metro";
import { clipboard, NavigationNative } from "@metro/common";
import { AlertActionButton, AlertModal, Button, FlashList, FloatingActionButton, HelpMessage, IconButton, Stack, Text, TextInput, useSafeAreaInsets } from "@metro/common/components";
import { ErrorBoundary, Search } from "@ui/components";
import { isNotNil } from "es-toolkit";
import fuzzysort from "fuzzysort";
import { ComponentType, ReactNode, useCallback, useEffect, useMemo } from "react";
import { Image, ScrollView, View } from "react-native";

const { showSimpleActionSheet, hideActionSheet } = lazyDestructure(() => findByProps("showSimpleActionSheet"));

type SearchKeywords<T> = Array<string | ((obj: T & {}) => string)>;

interface AddonPageProps<T extends object, I = any> {
    title: string;
    items: I[];
    searchKeywords: SearchKeywords<T>;
    sortOptions?: Record<string, (a: T, b: T) => number>;
    resolveItem?: (value: I) => T | undefined;
    safeModeHint?: {
        message?: string;
        footer?: ReactNode;
    };
    
    OptionsActionSheetComponent?: ComponentType<any>;

    CardComponent: ComponentType<CardWrapper<T>>;
    ListHeaderComponent?: ComponentType<any>;
    ListFooterComponent?: ComponentType<any>;
}

export default function AddonPage<T extends object>({ CardComponent, ...props }: AddonPageProps<T>) {
    const [search, setSearch] = React.useState("");
    const [sortFn, setSortFn] = React.useState<((a: T, b: T) => number) | null>(() => null);
    const navigation = NavigationNative.useNavigation();

    useEffect(() => {
        if (props.OptionsActionSheetComponent) {
            navigation.setOptions({
                headerRight: () => <IconButton
                    size="sm"
                    variant="secondary"
                    icon={findAssetId("MoreHorizontalIcon")}
                    onPress={() => showSheet?.("AddonMoreSheet", props.OptionsActionSheetComponent!)}
                />
            });
        }
    }, [navigation]);

    const results = useMemo(() => {
        let values = props.items;
        if (props.resolveItem) values = values.map(props.resolveItem).filter(isNotNil);
        const items = values.filter(i => isNotNil(i) && typeof i === "object");
        if (!search && sortFn) items.sort(sortFn);

        return fuzzysort.go(search, items, { keys: props.searchKeywords, all: true });
    }, [props.items, sortFn, search]);

    if (results.length === 0 && !search) {
        return <View style={{ gap: 32, flexGrow: 1, justifyContent: "center", alignItems: "center" }}>
            <View style={{ gap: 8, alignItems: "center" }}>
                <Image source={findAssetId("empty_quick_switcher")!} />
                <Text variant="text-lg/semibold" color="text-normal">
                    Oops! Nothing to see here… yet!
                </Text>
            </View>
        </View>;
    }

    const headerElement = (
        <View style={{ paddingBottom: 8 }}>
            {settings.safeMode?.enabled && <View style={{ marginBottom: 10 }}>
                <HelpMessage messageType={0}>
                    {props.safeModeHint?.message}
                </HelpMessage>
                {props.safeModeHint?.footer}
            </View>}
            <View style={{ flexDirection: "row", gap: 8 }}>
                <Search style={{ flexGrow: 1 }} isRound={!!props.sortOptions} onChangeText={v => setSearch(v)} />
                {props.sortOptions && <IconButton
                    icon={findAssetId("ArrowsUpDownIcon")}
                    variant="tertiary"
                    disabled={!!search}
                    onPress={() => showSimpleActionSheet({
                        key: "AddonListSortOptions",
                        header: {
                            title: "Sort Options",
                            onClose: () => hideActionSheet?.("AddonListSortOptions"),
                        },
                        options: Object.entries(props.sortOptions!).map(([name, fn]) => ({
                            label: name,
                            onPress: () => setSortFn(() => fn)
                        }))
                    })}
                />}
            </View>
            {props.ListHeaderComponent && <props.ListHeaderComponent />}
        </View>
    );

    return (
        <ErrorBoundary>
            <FlashList
                data={results}
                extraData={search}
                estimatedItemSize={136}
                //fix
                //ListHeaderComponent={headerElement}
                ListEmptyComponent={() => <View style={{ gap: 12, padding: 12, alignItems: "center" }}>
                    <Image source={findAssetId("devices_not_found")!} />
                    <Text variant="text-lg/semibold" color="text-normal">
                        Hmmm... could not find that!
                    </Text>
                </View>}
                contentContainerStyle={{ padding: 8, paddingHorizontal: 12, paddingBottom: 90 }}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                ListFooterComponent={props.ListFooterComponent}
                //fix
                renderItem={({ item }: any) => <CardComponent item={item.obj} result={item} />}
            />
        </ErrorBoundary>
    );
}
