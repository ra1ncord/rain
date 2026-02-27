import { semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { findByName, findByStoreName } from "@metro";
import { CDN_URL } from "@plugins/decor/lib/constants";
import { useCurrentUserDecorationsStore } from "@plugins/decor/lib/stores/CurrentUserDecorationsStore";
import discordifyDecoration from "@plugins/decor/lib/utils/discordifyDecoration";
import { Image, View } from "react-native";

const HeaderAvatar = findByName("HeaderAvatar");
const UserStore = findByStoreName("UserStore");

const useStyles = createStyles(_ => ({
    headerAvatarContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: semanticColors.BACKGROUND_FLOATING,
        width: 208,
        height: 208,
        borderRadius: 4
    },
    container: {
        flexDirection: "row",
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 16
    }
}));

// const { UserProfilePreview } = findByName('UserProfilePreview');
// <UserProfilePreview pendingAvatarDecoration={pendingAvatarDecoration} />
// TODO: fix/find proper
// ig not since deco still shows

export default function AvatarDecorationPreviews({ pendingAvatarDecoration }) {
    const styles = useStyles();
    const selectedDecoration = useCurrentUserDecorationsStore(s => s.selectedDecoration);

    const decoration = pendingAvatarDecoration
    ?? (selectedDecoration ? discordifyDecoration(selectedDecoration) : null);

    return (
        <View style={styles.container}>
            <View style={styles.headerAvatarContainer}>
                <HeaderAvatar
                    user={UserStore.getCurrentUser()}
                    pendingAvatarDecoration={decoration}
                    size="editAvatarDecoration"
                    decorationStyle={{ margin: -12 }}
                />
                {decoration && (
                    <Image
                        source={{
                            uri: /^(file|content|ph):\/\//.test(decoration.asset)
                                ? decoration.asset
                                : `${CDN_URL}/${decoration.asset}.png`
                        }}
                        style={{ position: "absolute", width: 180, height: 180 }}
                    />
                )}
            </View>
        </View>
    );
}
