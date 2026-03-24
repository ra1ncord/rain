import { findAssetId } from "@api/assets";
import { resolveSemanticColor, semanticColors } from "@api/ui/components/color";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByName, findByProps } from "@metro";
import { FluxUtils } from "@metro/common";
import { Card, Stack, TableRow, TableRowGroup, Text } from "@metro/common/components";
import { UserStore } from "@metro/common/stores";
import { developer } from "@plugins/types";
import { Developers } from "@rain/Developers";
import { useMemo } from "react";
import { Image, ScrollView, View } from "react-native";
import { Strings } from "@rain/i18n";

const showUserProfileActionSheet = findByName("showUserProfileActionSheet");
const { getUser: maybeFetchUser } = lazyDestructure(() => findByProps("getUser", "fetchProfile"));

type Credit = {
    name: string;
    role: string;
    dev: developer;
};

const developers: Credit[] = [
    { name: "cocobo1", role: "Founder & Main Developer", dev: Developers.cocobo1 },
    { name: "bwlok", role: Strings.GENERAL.CORE.RAIN_DEVELOPER, dev: Developers.Bwlok },
    { name: "kmmiio99o", role: Strings.GENERAL.CORE.RAIN_DEVELOPER, dev: Developers.kmmiio99o },
    { name: "SerStars", role: Strings.GENERAL.CORE.RAIN_DEVELOPER, dev: Developers.SerStars },
    { name: "J", role: Strings.GENERAL.CORE.RAIN_DEVELOPER, dev: Developers.j },
    { name: "Reyyan", role: Strings.GENERAL.CORE.RAIN_CONTRIBUTOR, dev: Developers.reyyan1 },
    { name: "John", role: Strings.GENERAL.CORE.RAIN_CONTRIBUTOR, dev: Developers.John },
];

const donators = [
    "Chocolate Milk",
    "Chloe~♥",
    "bruhours",
    "Mezque",
    "Fizz",
    "snp",
    "Clover",
    "Stella",
    "Twimble Time Mods",

];

export default function DevelopersPage() {
    const accentColor = resolveSemanticColor(semanticColors.BACKGROUND_ACCENT);
    const hexAlpha = (hex: string, alpha: string) => hex + alpha;

    const handleProfilePress = (dev: developer) => {
        if (dev.id) {
            showUserProfileActionSheet({ userId: dev.id });
        }
    };

    const users: any[] = FluxUtils.useStateFromStoresArray([UserStore], () => {
        developers.forEach(d => d.dev.id && maybeFetchUser(d.dev.id));
        return developers.map(d => d.dev.id ? UserStore.getUser(d.dev.id) : null);
    });

    const getDiscordAvatar = (user: any): string | undefined => {
        if (!user?.avatar) return undefined;
        return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    };

    const randomHearts = useMemo(() => {
        const hearts: { top: number; left: number; size: number; opacity: number }[] = [];
        const heartCount = 24;
        const minSize = 20;
        const maxSize = 36;
        const margin = 10;
        const cardWidth = 600;
        const cardHeight = 250;

        for (let i = 0; i < heartCount; i++) {
            const size = minSize + Math.random() * (maxSize - minSize);
            let top: number;
            let left: number;
            let attempts = 0;
            const maxAttempts = 50;

            do {
                top = margin + Math.random() * (cardHeight - size - margin * 2);
                left = margin + Math.random() * (cardWidth - size - margin * 2);
                attempts++;
            } while (
                attempts < maxAttempts &&
                hearts.some(h => {
                    const dx = Math.abs(top - h.top);
                    const dy = Math.abs(left - h.left);
                    const minDist = (size + h.size) / 2 + 5;
                    return dx < minDist && dy < minDist;
                })
            );

            hearts.push({
                top,
                left,
                size,
                opacity: 0.08 + Math.random() * 0.1,
            });
        }
        return hearts;
    }, []);

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title={Strings.GENERAL.CORE.DEVELOPERS}>
                    {developers.map((dev, index) => {
                        const avatarUrl = getDiscordAvatar(users[index]);
                        return (
                            <TableRow
                                key={dev.name}
                                label={dev.name}
                                subLabel={dev.role}
                                icon={
                                    avatarUrl ? (
                                        <Image
                                            source={{ uri: avatarUrl }}
                                            style={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 8,
                                            }}
                                        />
                                    ) : undefined
                                }
                                onPress={() => handleProfilePress(dev.dev)}
                                arrow
                            />
                        );
                    })}
                </TableRowGroup>

                <Card>
                    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
                        {randomHearts.map((heart, i) => (
                            <Image
                                key={i}
                                source={findAssetId("HeartIcon")}
                                style={{
                                    position: "absolute",
                                    top: heart.top,
                                    left: heart.left,
                                    width: heart.size,
                                    height: heart.size,
                                    tintColor: resolveSemanticColor(semanticColors.BACKGROUND_ACCENT),
                                    opacity: heart.opacity,
                                }}
                            />
                        ))}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                        <Text variant="text-md/semibold" style={{ color: "text-default" }}>{Strings.GENERAL.CORE.DONATORS}</Text>
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {donators.map(donator => (
                            <View
                                key={donator}
                                style={{
                                    paddingVertical: 6,
                                    paddingHorizontal: 12,
                                    borderRadius: 16,
                                    backgroundColor: hexAlpha(accentColor, "50"),
                                    borderWidth: 1,
                                    borderColor: hexAlpha(accentColor, "70"),
                                }}
                            >
                                <Text variant="text-sm/normal" style={{ color: "text-default" }}>{donator}</Text>
                            </View>
                        ))}
                    </View>
                </Card>
            </Stack>
        </ScrollView>
    );
}
