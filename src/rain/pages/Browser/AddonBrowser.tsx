import { findAssetId } from "@api/assets";
import { Search } from "@api/ui/components";
import { hideSheet, showSheet } from "@api/ui/sheets";
import { showToast } from "@api/ui/toasts";
import { formatString,Strings } from "@i18n";
import { lazyDestructure } from "@lib/utils/lazy";
import safeFetch from "@lib/utils/safeFetch";
import { findByProps } from "@metro";
import { clipboard,NavigationNative, React } from "@metro/common";
import { ActionSheet, Button, Card, FlashList, IconButton, Stack, TableRow, TableRowGroup,Text } from "@metro/common/components";
import { View } from "react-native";

const { showSimpleActionSheet } = lazyDestructure(() => findByProps("showSimpleActionSheet"));
const { hideActionSheet } = findByProps("hideActionSheet");

enum Sort {
    NameAZ = "NameAZ",
    NameZA = "NameZA",
}

const SortLabels: Record<Sort, string> = {
    [Sort.NameAZ]: Strings.GENERAL.CORE.SORT_NAME_AZ,
    [Sort.NameZA]: Strings.GENERAL.CORE.SORT_NAME_ZA,
};

interface Addon {
    name: string;
    description: string;
    authors: string[];
    installUrl: string;
}

interface Cache {
    data: Addon[] | null;
}

interface Props {
    type: string;
    url: string;
    useStore: any;
    installFn: (url: string) => Promise<any>;
    removeFn: (id: string) => Promise<any>;
    identityKey: "name" | "installUrl";
    cache: Cache;
}

interface CardProps {
    item: Addon;
    identityKey: "name" | "installUrl";
    installFn: (url: string) => Promise<any>;
    removeFn: (id: string) => Promise<any>;
    isInstalled: boolean;
}

function AddonCard({ item, identityKey, installFn, removeFn, isInstalled }: CardProps) {
    const [isBusy, setIsBusy] = React.useState(false);

    const handleAction = async () => {
        try {
            const id = item[identityKey];
            if (isInstalled) {
                await removeFn(id);
                showToast(formatString("GENERAL.CORE.REMOVED", { name: item.name }), findAssetId("TrashIcon"));
            } else {
                setIsBusy(true);
                await installFn(item.installUrl);
                showToast(formatString("GENERAL.CORE.REMOVED", { name: item.name }), findAssetId("CheckIcon"));
            }
        } catch (e) {
            showToast(e instanceof Error ? e.message : String(e), findAssetId("CircleXIcon-primary"));
        } finally {
            setIsBusy(false);
        }
    };

    const openMenu = () => {
        const sheetKey = "addon-menu";
        showSheet(sheetKey, () => (
            <ActionSheet>
                <TableRowGroup title={Strings.GENERAL.CORE.INFO}>
                    <TableRow
                        label={Strings.GENERAL.CORE.COPY_SOURCE_URL}
                        icon={<TableRow.Icon source={findAssetId("CopyIcon")} />}
                        onPress={() => {
                            clipboard.setString(item.installUrl);
                            hideSheet(sheetKey);
                        }}
                    />
                </TableRowGroup>
            </ActionSheet>
        ));
    };

    return (
        <Card>
            <Stack spacing={16}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexShrink: 1 }}>
                        <Text numberOfLines={1} variant="heading-lg/semibold">
                            {item.name}
                        </Text>
                        <Text variant="text-md/semibold" color="text-muted">
                            by {item.authors?.join(", ") || Strings.GENERAL.CORE.UNKNOWN_AUTHOR}
                        </Text>
                    </View>
                    <View>
                        <Stack direction="horizontal" spacing={8}>
                            <IconButton
                                size="sm"
                                onPress={openMenu}
                                variant="secondary"
                                icon={findAssetId("MoreHorizontalIcon")}
                            />
                            <Button
                                size="sm"
                                variant={isInstalled ? "destructive" : "primary"}
                                icon={findAssetId(isInstalled ? "TrashIcon" : "DownloadIcon")}
                                loading={isBusy}
                                disabled={isBusy}
                                text={isInstalled ? Strings.GENERAL.CORE.UNINSTALL : Strings.GENERAL.CORE.INSTALL}
                                onPress={handleAction}
                            />
                        </Stack>
                    </View>
                </View>
                <Text variant="text-md/medium">
                    {item.description}
                </Text>
            </Stack>
        </Card>
    );
}

export default function AddonBrowser({ type, url, useStore, installFn, removeFn, identityKey, cache }: Props) {
    const navigation = NavigationNative.useNavigation();
    const [list, setList] = React.useState<Addon[]>(cache.data || []);
    const [loading, setLoading] = React.useState(!cache.data);
    const [error, setError] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [sort, setSort] = React.useState<Sort>(Sort.NameAZ);

    const installedItems = useStore((state: any) =>
        type === "fonts" ? state.fonts : state.themes
    );

    const fetchAddons = async (forceRefresh = false) => {
        if (cache.data && !forceRefresh) return;
        setLoading(true);
        setError(null);
        try {
            const response = await safeFetch(url);
            if (!response.ok) throw new Error(Strings.GENERAL.CORE.FAILED_TO_FETCH);
            const data = await response.json();
            const parsed = Array.isArray(data) ? data : (data.fonts || data.themes || []);
            cache.data = parsed;
            setList(parsed);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAddons();
    }, [navigation]);

    const filteredAndSorted = React.useMemo(() => {
        const items = list.filter(i =>
            i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (sort === Sort.NameAZ) items.sort((a, b) => a.name.localeCompare(b.name));
        if (sort === Sort.NameZA) items.sort((a, b) => b.name.localeCompare(a.name));
        return items;
    }, [list, searchQuery, sort]);

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
                <Text variant="heading-lg/bold">{formatString("GENERAL.CORE.FAILED_TO_LOAD", { type })}</Text>
                <Text color="text-muted">{error}</Text>
                <Button size="md" text={Strings.GENERAL.CORE.RETRY} onPress={() => fetchAddons(true)} style={{ marginTop: 10 }} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <View style={{ padding: 10 }}>
                <Stack spacing={12}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Search
                            placeholder={formatString("GENERAL.CORE.SEARCH_PLACEHOLDER", { type })}
                            onChangeText={setSearchQuery}
                            style={{ flex: 1 }}
                            isRound={true}
                        />
                        <IconButton
                            size="md"
                            variant="tertiary"
                            icon={findAssetId("MoreVerticalIcon")}
                            onPress={() => showSimpleActionSheet({
                                key: "SortOptions",
                                header: { title: Strings.GENERAL.CORE.SORT_BY, onClose: () => hideActionSheet("SortOptions") },
                                options: Object.values(Sort).map(value => ({
                                    label: SortLabels[value],
                                    onPress: () => setSort(value)
                                }))
                            })}
                        />
                    </View>
                </Stack>
            </View>
            <FlashList
                data={filteredAndSorted}
                refreshing={loading}
                onRefresh={() => fetchAddons(true)}
                estimatedItemSize={150}
                contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 5 }}
                extraData={installedItems}
                renderItem={({ item }: any) => (
                    <View style={{ paddingVertical: 6, paddingHorizontal: 8 }}>
                        <AddonCard
                            item={item}
                            identityKey={identityKey}
                            installFn={installFn}
                            removeFn={removeFn}
                            isInstalled={!!(installedItems && installedItems[item[identityKey]])}
                        />
                    </View>
                )}
            />
        </View>
    );
}
