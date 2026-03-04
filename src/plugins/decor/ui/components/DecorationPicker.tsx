import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { findByProps, findByStoreName } from "@metro";
import { NavigationNative, ReactNative } from "@metro/common";
import { TableRow, TableRowGroup } from "@metro/common/components";

import { getPresets,Preset as PresetInterface } from "../../lib/api";
import { useAuthorizationStore } from "../../lib/stores/AuthorizationStore";
import { useCurrentUserDecorationsStore } from "../../lib/stores/CurrentUserDecorationsStore";
import discordifyDecoration from "../../lib/utils/discordifyDecoration";
import Submitoin from "../pages/CreateDecoration";
import Presets from "../pages/Presets";
import AvatarDecorationPreviews from "./AvatarDecorationPreviews";

const { View, ActivityIndicator, Pressable } = ReactNative;
const { TextStyleSheet, Text } = findByProps("TextStyleSheet");

const UserStore = findByStoreName("UserStore");
const Parser = findByProps("parse", "parseToAST");
const { showUserProfile } = findByProps("showUserProfile");
const UserUtils = findByProps("getUser", "fetchCurrentUser");

const useStyles = createStyles(_ => ({
    decorationListContainer: {
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    selectedMetaContainer: {
        paddingHorizontal: 4,
        paddingVertical: 8,
        gap: 2,
    },
    presetLabel: {
        color: semanticColors.TEXT_MUTED,
    },
    authorContainer: {
        flexGrow: 0,
        flexShrink: 0,
    },
    warningIcon: {
        tintColor: semanticColors.STATUS_WARNING,
    },
}));

export default function DecorationPicker() {
    const [loading, setLoading] = React.useState<boolean | null>(false);
    const [presets, setPresets] = React.useState<PresetInterface[]>([]);
    const {
        decorations,
        selectedDecoration,
        fetch: fetchUserDecorations,
        clear: clearUserDecorations,
        select: selectDecoration,
    } = useCurrentUserDecorationsStore();

    const { isAuthorized } = useAuthorizationStore();

    React.useEffect(() => {
        if (isAuthorized()) {
            getPresets()
                .then(setPresets)
                .catch(() => void 0);
            fetchUserDecorations()
                .then(() => setLoading(false))
                .catch(() => setLoading(null));
            setLoading(true);
        } else {
            clearUserDecorations();
            setLoading(false);
        }
    }, [isAuthorized]);

    const navigation = NavigationNative.useNavigation();
    const styles = useStyles();

    const isDisabled = !isAuthorized() || loading === null;

    const personalDecorations = decorations.filter(d => d.presetId === null || d.presetId === undefined);
    const hasPendingDecoration = decorations.some(d => d.reviewed === false);
    const decorPreset = presets && selectedDecoration
        ? presets.find(p => p.id === selectedDecoration.presetId)
        : null;

    const loadingTrailing = loading
        ? () => <ActivityIndicator size="small" />
        : loading === null
            ? () => <TableRow.Icon source={findAssetId("ic_warning_24px")} variant="danger" />
            : undefined;

    return (
        <View style={{ gap: 24 }}>
            <AvatarDecorationPreviews
                pendingAvatarDecoration={
                    selectedDecoration ? discordifyDecoration(selectedDecoration) : null
                }
            />

            {selectedDecoration && (
                <View style={styles.selectedMetaContainer}>
                    <Text style={TextStyleSheet["text-lg/semibold"]}>
                        {selectedDecoration.alt}
                    </Text>
                    {decorPreset && (
                        <Text style={[TextStyleSheet["eyebrow"], styles.presetLabel]}>
                            Part of the {decorPreset.name} Preset
                        </Text>
                    )}
                    <Text style={TextStyleSheet["text-md/normal"]}>
                        {"Created by "}
                        <Pressable
                            onPress={() =>
                                UserStore.getUser(selectedDecoration.authorId)
                                    ? showUserProfile({ userId: selectedDecoration.authorId })
                                    : UserUtils.getUser(selectedDecoration.authorId).then(() =>
                                        showUserProfile({ userId: selectedDecoration.authorId })
                                    )
                            }
                            pointerEvents="box-only"
                            style={styles.authorContainer}
                        >
                            {Parser.parse(`<@${selectedDecoration.authorId}>`, true)}
                        </Pressable>
                    </Text>
                </View>
            )}

            {personalDecorations.length > 0 && (
                <TableRowGroup title="Your Decorations">
                    {personalDecorations.map(decoration => {
                        const isSelected = selectedDecoration?.hash === decoration.hash;
                        return (
                            <TableRow
                                key={decoration.hash}
                                label={decoration.alt}
                                icon={<TableRow.Icon source={findAssetId("ic_image_24px")} />}
                                disabled={isDisabled}
                                onPress={() => selectDecoration(isSelected ? null : decoration)}
                                trailing={isSelected
                                    ? () => <Text style={[TextStyleSheet["text-sm/normal"], { color: semanticColors.TEXT_MUTED }]}>Active</Text>
                                    : TableRow.Arrow
                                }
                            />
                        );
                    })}
                </TableRowGroup>
            )}

            <TableRowGroup title="Decoration Actions">

                <TableRow
                    label="Remove Decoration"
                    subLabel={selectedDecoration ? `Currently using: ${selectedDecoration.alt}` : "No decoration selected"}
                    icon={<TableRow.Icon source={findAssetId("img_none")} />}
                    disabled={isDisabled || !selectedDecoration}
                    onPress={() => selectDecoration(null)}
                    trailing={!selectedDecoration ? () => (
                        <Text style={[TextStyleSheet["text-sm/normal"], { color: semanticColors.TEXT_MUTED }]}>Active</Text>
                    ) : TableRow.Arrow}
                />

                <TableRow
                    label="Browse Presets"
                    subLabel={
                        selectedDecoration?.presetId
                            ? `Current preset: ${decorPreset?.name ?? "Unknown"}`
                            : "Explore decoration presets"
                    }
                    icon={<TableRow.Icon source={findAssetId("ic_reaction_smile")} />}
                    arrow
                    disabled={isDisabled}
                    trailing={loadingTrailing ?? TableRow.Arrow}
                    onPress={() =>
                        navigation.push("RAIN_CUSTOM_PAGE", {
                            title: "Presets",
                            render: Presets,
                        })
                    }
                />

                <TableRow
                    label={
                        hasPendingDecoration
                            ? "Decoration Pending Review"
                            : "Submit New Decoration"
                    }
                    subLabel={
                        hasPendingDecoration
                            ? "Your submission is awaiting approval. You cannot submit another until it's reviewed."
                            : "Submit your own custom decoration for review"
                    }
                    icon={
                        <TableRow.Icon
                            source={findAssetId(
                                hasPendingDecoration ? "ic_warning_24px" : "ic_add_24px"
                            )}
                            variant={hasPendingDecoration ? "danger" : undefined}
                        />
                    }
                    disabled={isDisabled || hasPendingDecoration}
                    arrow={!hasPendingDecoration}
                    onPress={() =>
                        navigation.push("RAIN_CUSTOM_PAGE", {
                            title: "Submit a Decoration",
                            render: Submitoin,
                        })
                    }
                />

            </TableRowGroup>
        </View>
    );
}
