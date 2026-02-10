import { findAssetId } from "@api/assets";
import { settings } from "@api/settings";
import { dismissAlert, openAlert } from "@api/ui/alerts";
import { ErrorBoundary, Search } from "@api/ui/components";
import { showSheet } from "@api/ui/sheets";
import isValidHttpUrl from "@lib/utils/isValidHttpUrl";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByProps } from "@metro";
import { clipboard, NavigationNative } from "@metro/common";
import { AlertActionButton, AlertModal, Button, FlashList, FloatingActionButton, HelpMessage, IconButton, Stack, Text, TextInput, useSafeAreaInsets } from "@metro/common/components";
import { isNotNil } from "es-toolkit";
import fuzzysort from "fuzzysort";
import { ComponentType, ReactNode, useCallback, useEffect, useMemo } from "react";
import * as React from "react";
import { Image, ScrollView, View } from "react-native";

import { CardWrapper } from "./AddonCard";

const { showSimpleActionSheet, hideActionSheet } = lazyDestructure(() => findByProps("showSimpleActionSheet"));

type SearchKeywords<T> = Array<string | ((obj: T & {}) => string)>;

interface AddonPageProps<T extends object, I = any> {
    title: string;
    items: I[];
    searchKeywords: SearchKeywords<T>;
    sortOptions?: Record<string, (a: T, b: T) => number>;
    filterOptions?: Record<string, (item: T) => boolean>;
    defaultFilterKey?: string;
    resolveItem?: (value: I) => T | undefined;
    installBrowserAction?: {
        label?: string;
        // Ignored when onPress is defined!
        fetchFn?: (url: string) => Promise<void>;
        onPress?: () => void;
    };
    installAction?: {
        label?: string;
        // Ignored when onPress is defined!
        fetchFn?: (url: string) => Promise<void>;
        onPress?: () => void;
    };
    safeModeHint?: {
        message?: string;
        footer?: ReactNode;
    };

    OptionsActionSheetComponent?: ComponentType<any>;

    CardComponent: ComponentType<CardWrapper<T>>;
    ListHeaderComponent?: ComponentType<any>;
    ListFooterComponent?: ComponentType<any>;
}

type ActionSheetOption = { label: string; onPress: () => void; } | { label: string; type: "header"; onPress?: () => void };

function InputAlert(props: { label: string, fetchFn: (url: string) => Promise<void>; }) {
    const [value, setValue] = React.useState("");
    const [error, setError] = React.useState("");
    const [isFetching, setIsFetching] = React.useState(false);

    function onConfirmWrapper() {
        setIsFetching(true);

        props.fetchFn(value)
            .then(() => dismissAlert("AddonInputAlert"))
            .catch((e: unknown) => e instanceof Error ? setError(e.message) : String(e))
            .finally(() => setIsFetching(false));
    }

    return <AlertModal
        title={props.label}
        content="Type in the source URL you want to install from:"
        extraContent={
            <Stack style={{ marginTop: -12 }}>
                <TextInput
                    autoFocus={true}
                    isClearable={true}
                    value={value}
                    onChange={(v: string) => {
                        setValue(v);
                        if (error) setError("");
                    }}
                    returnKeyType="done"
                    onSubmitEditing={onConfirmWrapper}
                    state={error ? "error" : undefined}
                    errorMessage={error || undefined}
                />
                <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    style={{ gap: 8 }}
                >
                    <Button
                        size="sm"
                        variant="tertiary"
                        text="Import from clipboard"
                        icon={findAssetId("ClipboardListIcon")}
                        onPress={() => clipboard.getString().then((str: string) => setValue(str))}
                    />
                </ScrollView>
            </Stack>
        }
        actions={
            <Stack>
                {/* Manual button as we don't want alert to immediately dismiss when we tap on it */}
                <Button
                    loading={isFetching}
                    text="Install"
                    variant="primary"
                    disabled={!value || !isValidHttpUrl(value)}
                    onPress={onConfirmWrapper}
                />
                <AlertActionButton
                    disabled={isFetching}
                    text="Cancel"
                    variant="secondary"
                />
            </Stack>
        }
    />;
}

export default function AddonPage<T extends object>({ CardComponent, ...props }: AddonPageProps<T>) {
    const [search, setSearch] = React.useState("");
    const [sortFn, setSortFn] = React.useState<((a: T, b: T) => number) | null>(() => null);
    const [filterFn, setFilterFn] = React.useState<((item: T) => boolean) | null>(() => props.defaultFilterKey && props.filterOptions ? props.filterOptions[props.defaultFilterKey] : null);
    const { bottom: bottomInset } = useSafeAreaInsets();
    const { right: rightInset } = useSafeAreaInsets();
    const navigation = NavigationNative.useNavigation();

    useEffect(() => {
        if (props.OptionsActionSheetComponent) {
            navigation.setOptions({
                headerRight: () => <IconButton
                    size="sm"
                    variant="secondary"
                    icon={findAssetId("MoreHorizontalIcon")}
                    onPress={() => showSheet("AddonMoreSheet", props.OptionsActionSheetComponent!)}
                />
            });
        }
    }, [navigation]);

    const results = useMemo(() => {
        let values = props.items;
        if (props.resolveItem) values = values.map(props.resolveItem).filter(isNotNil);

        let items = values.filter(i => isNotNil(i) && typeof i === "object") as T[];

        if (filterFn) {
            items = items.filter(filterFn);
        }

        if (!search && sortFn) items.sort(sortFn);

        return fuzzysort.go(search, items, { keys: props.searchKeywords, all: true });
    }, [props.items, sortFn, filterFn, search]);

    const onInstallPress = useCallback(() => {
        if (!props.installAction) return () => { };
        const { label, onPress, fetchFn } = props.installAction;
        if (fetchFn) {
            openAlert("AddonInputAlert", <InputAlert label={label ?? "Install"} fetchFn={fetchFn} />);
        } else {
            onPress?.();
        }
    }, [props.installAction]);

    const onInstallBrowserPress = useCallback(() => {
        if (!props.installBrowserAction) return () => { };
        const { label, onPress, fetchFn } = props.installBrowserAction;
        if (fetchFn) {
            openAlert("AddonInputAlert", <InputAlert label={label ?? "Install"} fetchFn={fetchFn} />);
        } else {
            onPress?.();
        }
    }, [props.installBrowserAction]);

    if (results.length === 0 && !search) {
        return <View style={{ gap: 32, flexGrow: 1.5, justifyContent: "center", alignItems: "center" }}>
            <View style={{ gap: 8, alignItems: "center" }}>
                <Image source={findAssetId("empty_quick_switcher")!} />
                <Text variant="text-lg/semibold" color="text-strong">
                    Oops! Nothing to see here… yet!
                </Text>
            </View>
            {props.installAction && <Button
                size="lg"
                icon={findAssetId("CompassIcon")}
                text={props.installBrowserAction.label ?? "Install"}
                onPress={onInstallBrowserPress}
            />}
            {props.installAction && <Button
                size="lg"
                icon={findAssetId("DownloadIcon")}
                text={props.installAction.label ?? "Install"}
                onPress={onInstallPress}
            />}
        </View>;
    }

    const sortOptions = props.sortOptions ? Object.entries(props.sortOptions).map(([name, fn]) => ({
        label: name,
        onPress: () => setSortFn(() => fn)
    })) : [];

    const filterOptions = props.filterOptions ? Object.entries(props.filterOptions).map(([name, fn]) => ({
        label: name,
        onPress: () => setFilterFn(() => fn)
    })) : [];

    const actionSheetOptions: ActionSheetOption[] = [
        ...sortOptions,
        ...filterOptions,
    ];

    const headerElement = (
        <View style={{ paddingBottom: 8 }}>
            {settings.safeMode?.enabled && <View style={{ marginBottom: 10 }}>
                <HelpMessage messageType={0}>
                    {props.safeModeHint?.message}
                </HelpMessage>
                {props.safeModeHint?.footer}
            </View>}
            <View style={{ flexDirection: "row", gap: 8 }}>
                <Search
                    style={{ flexGrow: 1 }}
                    isRound={!!props.sortOptions || !!props.filterOptions}
                    onChangeText={v => setSearch(v)}
                />
                {(props.sortOptions || props.filterOptions) && <IconButton
                    icon={findAssetId("ArrowsUpDownIcon")}
                    variant="tertiary"
                    disabled={!!search}
                    onPress={() => showSimpleActionSheet({
                        key: "AddonListSortAndFilterOptions",
                        header: {
                            title: "List Options",
                            onClose: () => hideActionSheet("AddonListSortAndFilterOptions"),
                        },
                        options: actionSheetOptions,
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
                ListHeaderComponent={headerElement}
                ListEmptyComponent={() => <View style={{ gap: 12, padding: 12, alignItems: "center" }}>
                    <Image source={findAssetId("devices_not_found")!} />
                    <Text variant="text-lg/semibold" color="text-normal">
                        Hmmm... could not find that!
                    </Text>
                </View>}
                contentContainerStyle={{ padding: 8, paddingHorizontal: 12, paddingBottom: 90 }}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                ListFooterComponent={props.ListFooterComponent}
                renderItem={({ item }: any) => <CardComponent item={item.obj} result={item} />}
            />
            {props.installBrowserAction && <FloatingActionButton
                positionBottom={bottomInset + 8}
                icon={findAssetId("CompassIcon")}
                onPress={onInstallBrowserPress}
            />}
            {props.installAction && <FloatingActionButton
                positionBottom={bottomInset + 8}
                positionRight={rightInset + 86}
                icon={findAssetId("PlusLargeIcon")}
                onPress={onInstallPress}
            />}
        </ErrorBoundary>
    );
}
