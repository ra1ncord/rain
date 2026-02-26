import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { findByName, findByProps, findByStoreName } from "@metro";
import { NavigationNative, ReactNative } from "@metro/common";
import { Forms } from "@metro/common/components";

import { Preset } from "../../lib/api";
import { useCurrentUserDecorationsStore } from "../../lib/stores/CurrentUserDecorationsStore";
import DecorationCard from "./DecorationCard";

const { FormTitle } = Forms;
const { View, FlatList, Image } = ReactNative;
const { TextStyleSheet, Text } = findByProps("TextStyleSheet");
const { default: SummarizedIconRow, OverflowCircle } = findByName("SummarizedIconRow", false);
const { type: Avatar } = findByProps("AvatarSizes");// .default;

const useStyles = createStyles(_ => ({
    wrapper: {
        borderWidth: 2,
        borderRadius: 20,
        borderColor: semanticColors.BACKGROUND_SECONDARY,
        backgroundColor: semanticColors.BACKGROUND_SECONDARY
    }
}));

const UserUtils = findByProps("getUser", "fetchCurrentUser");
const UserStore = findByStoreName("UserStore");

const defaultAvatars = [
    findAssetId("default_avatar_0"),
    findAssetId("default_avatar_1"),
    findAssetId("default_avatar_2"),
    findAssetId("default_avatar_3"),
    findAssetId("default_avatar_4"),
    findAssetId("default_avatar_5")
];

// Broken, i assume because of missing/undefined props
/*
function renderAvatar({user, id}) {
    if (user) return <Avatar user={user} size="size16"/>;
    else {
        const defaultAvatarIndex = Number((BigInt(id) >> 22n) % 6n);
        return (
            <Image
                source={defaultAvatars[defaultAvatarIndex]}
                style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8
                }}
            />
        );
    }
}
icon={
                        <SummarizedIconRow
                            iconWrapperStyle={styles.wrapper}
                            items={preset.authorIds.map((id) => {
                                const user = UserStore.getUser(id);

                                console.log(user)

                                // Hopefully next time the user will be fetched
                                if (!user) UserUtils.getUser(id);

                                return {user, id};
                            })}
                            max={5}
                            offsetAmount={-8}
                            overflowComponent={OverflowCircle}
                            overflowStyle={styles.wrapper}
                            style={{
                                height: 16
                            }}
                            renderItem={renderAvatar}
                        />
                    }

 */


export default function Preset({ preset }: { preset: Preset }) {
    const select = useCurrentUserDecorationsStore(state => state.select);
    const navigation = NavigationNative.useNavigation();
    const styles = useStyles();

    return (
        <View>
            <View>
                <FormTitle
                    title={preset.name}


                />
                {preset.description && (
                    <Text style={[TextStyleSheet["text-sm/medium"], {
                        paddingHorizontal: 16,
                        paddingBottom: 8
                    }]}>{preset.description}</Text>
                )}
            </View>

            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={preset.decorations}
                renderItem={({ item }) => (
                    <DecorationCard
                        decoration={item}
                        onPress={() => {
                            select(item);
                            navigation.pop();
                        }}
                    />
                )}
                ItemSeparatorComponent={() => <View style={{ width: 4 }}/>}
                snapToInterval={74}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 8 }}
            />
        </View>
    );
}

/*

 */

/* export default function Preset({preset}: { preset: Preset }) {
    const select = useCurrentUserDecorationsStore((state) => state.select);
    const navigation = NavigationNative.useNavigation();

	/*
	<FormTitle
                    title={preset.name}
                    icon={
                        <SummarizedIconRow
                            iconWrapperStyle={styles.wrapper}
                            items={preset.authorIds.map((id) => {
                                const user = UserStore.getUser(id);

                                // Hopefully next time the user will be fetched
                                if (!user) UserUtils.getUser(id);

                                return {user, id};
                            })}
                            max={5}
                            offsetAmount={-8}
                            overflowComponent={OverflowCircle}
                            overflowStyle={styles.wrapper}
                            style={{
                                height: 16
                            }}
                            renderItem={renderAvatar}
                        />
                    }
                />
	 *


    return (
        <View>
            <View>

                {preset.description && (
                    <Text style={[TextStyleSheet['text-sm/medium'], {
                        paddingHorizontal: 16,
                        paddingBottom: 8
                    }]}>{preset.description}</Text>
                )}
            </View>

            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={preset.decorations}
                renderItem={({item}) => (
                    <View style={{backgroundColor: "rgba(255,0,0,0.2)"}}>

                        <DecorationCard
                            decoration={item}
                            onPress={() => {
                                select(item);
                                navigation.pop();
                            }}
                        />
                    </View>

                )}
                ItemSeparatorComponent={() => <View style={{width: 4}}/>}
                snapToInterval={74}
                decelerationRate="fast"
                contentContainerStyle={{paddingHorizontal: 8}}
            />
        </View>
    );
}*/
