import { findAssetId } from "@api/assets";
import { ReactNative as RN } from "@metro/common";
import { Card, Stack, TableRow, TableRowGroup, Text } from "@metro/common/components";
import { useMemo } from "react";
import { Image, ScrollView, View } from "react-native";

const ACCENT_COLOR = "#EB459E";

type Credit = {
    name: string;
    role: string;
    github: string | undefined;
};

const developers: Credit[] = [
    { name: "cocobo1", role: "Founder & Main Developer", github: "C0C0B01" },
    { name: "bwlok", role: "Rain Developer", github: "bwlok" },
    { name: "kmmiio99o", role: "Rain Developer", github: "kmmiio99o" },
    { name: "CatStars", role: "Rain Developer", github: "SerStars" },
    { name: "J", role: "Rain Developer", github: "joamoncab" },
    { name: "Reyyan", role: "Rain Contributor", github: "Reyyancli" },
    { name: "John", role: "Rain Contributor", github: "janisslsm" },
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
    const handleProfilePress = (github: string | undefined) => {
        if (github) {
            RN.Linking.openURL(`https://github.com/${github}`);
        }
    };

    const randomHearts = useMemo(() => {
        const hearts: { top: number; left: number; size: number; opacity: number }[] = [];
        const rows = 4;
        const cols = 4;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                hearts.push({
                    top: 20 + row * 45 + (Math.random() - 0.5) * 10,
                    left: 20 + col * 65 + (Math.random() - 0.5) * 10,
                    size: 24 + Math.random() * 16,
                    opacity: 0.1 + Math.random() * 0.12,
                });
            }
        }
        return hearts;
    }, []);

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Developers">
                    {developers.map(developer => (
                        <TableRow
                            key={developer.name}
                            label={developer.name}
                            subLabel={developer.role}
                            icon={
                                developer.github ? (
                                    <Image
                                        source={{ uri: `https://github.com/${developer.github}.png` }}
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 8,
                                            resizeMode: "cover",
                                        }}
                                    />
                                ) : undefined
                            }
                            onPress={() => handleProfilePress(developer.github)}
                            arrow
                        />
                    ))}
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
                                    tintColor: ACCENT_COLOR,
                                    opacity: heart.opacity,
                                }}
                            />
                        ))}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                        <Text variant="text-md/semibold" style={{ color: "text-default" }}>Donators</Text>
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {donators.map(donator => (
                            <View
                                key={donator}
                                style={{
                                    paddingVertical: 6,
                                    paddingHorizontal: 12,
                                    borderRadius: 16,
                                    backgroundColor: ACCENT_COLOR + "50",
                                    borderWidth: 1,
                                    borderColor: ACCENT_COLOR + "70",
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
