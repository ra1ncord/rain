import { findAssetId } from "@api/assets";
import { useSettings } from "@api/settings";
import { semanticColors } from "@api/ui/components/color";
import { Strings } from "@i18n";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByNameLazy, findByProps } from "@metro";
import { FluxUtils } from "@metro/common";
import { ActionSheet, Avatar, Card, IconButton, Text } from "@metro/common/components";
import { UserStore } from "@metro/common/stores";
import { ScrollView, View } from "react-native";

import { PluginInfoActionSheetProps } from "./common";
import TitleComponent from "./TitleComponent";

const showUserProfileActionSheet = findByNameLazy("showUserProfileActionSheet");
const { getUser: maybeFetchUser } = lazyDestructure(() => findByProps("getUser", "fetchProfile"));

function AuthorCard({ title, authors }: { title: string; authors: { name: string; id: bigint }[] }) {
    if (!authors?.length) return null;

    const users: any[] = FluxUtils.useStateFromStoresArray([UserStore], () => {
        authors.forEach(a => a.id && maybeFetchUser(a.id));
        return authors.map(a => UserStore.getUser(a.id));
    });

    return (
        <Card>
            <Text
                variant="text-md/semibold"
                style={{
                    marginBottom: 8,
                    color: semanticColors.MOBILE_TEXT_HEADING_PRIMARY,
                }}
            >
                {title}
            </Text>
            <View style={{ gap: 3 }}>
                {authors.map((author, index) => (
                    <View
                        key={index}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            backgroundColor: semanticColors.BACKGROUND_TERTIARY,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                        }}
                    >
                        <Avatar
                            size="small"
                            user={users[index]}
                        />
                        <Text
                            variant="text-md/medium"
                            onPress={() => showUserProfileActionSheet({ userId: author.id })}
                        >
                            {author.name}
                        </Text>
                    </View>
                ))}
            </View>
        </Card>
    );
}

export default function PluginInfoActionSheet({
    plugin,
    navigation,
}: PluginInfoActionSheetProps) {
    plugin.usePluginState?.();
    const { pinnedPlugins, togglePinnedPlugin } = useSettings();
    const isPinned = pinnedPlugins?.includes(plugin.id);

    return (
        <ActionSheet>
            <ScrollView contentContainerStyle={{ gap: 12, marginBottom: 12, paddingTop: 16 }}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 8,
                        justifyContent: "space-between",
                        width: "100%",
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <TitleComponent plugin={plugin} />
                    </View>

                    <View style={{ paddingBottom: 4 }}>
                        <IconButton
                            size="sm"
                            variant={isPinned ? "destructive" : "secondary"}
                            icon={findAssetId("PinIcon")}
                            style={{
                                borderRadius: 100,
                                backgroundColor: isPinned ? semanticColors.BACKGROUND_MODIFIER_ACCENT : "transparent",
                            }}
                            onPress={() => {
                                togglePinnedPlugin(plugin.id);
                            }}
                        />
                    </View>
                </View>

                <Card>
                    <Text
                        variant="text-md/semibold"
                        style={{
                            marginBottom: 4,
                            color: semanticColors.MOBILE_TEXT_HEADING_PRIMARY,
                        }}
                    >
                        {Strings.DESCRIPTION}
                    </Text>
                    <Text variant="text-md/medium">{plugin.description}</Text>
                </Card>

                {plugin.developers?.length ? (
                    <AuthorCard title="Developers" authors={plugin.developers} />
                ) : null}

                {plugin.contributors?.length ? (
                    <AuthorCard title="Contributors" authors={plugin.contributors} />
                ) : null}
            </ScrollView>
        </ActionSheet>
    );
}
