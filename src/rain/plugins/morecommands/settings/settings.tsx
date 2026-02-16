import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { React } from "@metro/common";
import { NavigationNative } from "@metro/common";
import { Stack, TableRow, TableRowGroup } from "@metro/common/components";
import { ScrollView } from "react-native";

import { useMoreCommandsSettings } from "../storage";
import Header from "./components/Header";
import AliucordPage from "./pages/AliucordPage";
import CreditsPage from "./pages/CreditsPage";
import FactsSettingsPage from "./pages/FactsSettingsPage";
import GaryAPIPage from "./pages/GaryAPIPage";
import HiddenSettingsPage from "./pages/HiddenSettingsPage";
import ImageSettingsPage from "./pages/ImageSettingsPage";
import OtherSettingsPage from "./pages/OtherSettingsPage";
import SpotifySettingsPage from "./pages/SpotifySettingsPage";

export default function Settings() {
    const storage = useMoreCommandsSettings();
    const navigation = NavigationNative.useNavigation();
    const [, forceUpdate] = React.useReducer(x => ~x, 0);

    React.useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {
            forceUpdate();
        });
        return unsubscribe;
    }, [navigation]);

    const garySource = storage.garySettings.imageSource;

    const getGarySourceDisplay = (source: string) => {
        switch (source) {
            case "gary": return "Gary API";
            case "catapi": return "Cat API";
            case "minker": return "Minker API";
            case "goober": return "Goober API";
            default: return "Gary API";
        }
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <Header />

                <TableRowGroup title="Command Categories">
                    <TableRow
                        label="Facts Commands"
                        subLabel="Cat facts, dog facts, and useless facts"
                        icon={<TableRow.Icon source={findAssetId("BookmarkIcon")} />}
                        arrow
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "Facts Commands",
                                render: FactsSettingsPage,
                            })
                        }
                    />
                    <TableRow
                        label="Image Commands"
                        subLabel="PetPet, KonoChan, and image utilities"
                        icon={<TableRow.Icon source={findAssetId("ImageIcon")} />}
                        arrow
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "Image Commands",
                                render: ImageSettingsPage,
                            })
                        }
                    />
                    <TableRow
                        label="Gary Commands"
                        subLabel={`Gary images - Current: ${getGarySourceDisplay(garySource)}`}
                        icon={<TableRow.Icon source={findAssetId("CameraIcon")} />}
                        arrow
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "Gary Commands",
                                render: GaryAPIPage,
                            })
                        }
                    />
                    <TableRow
                        label="Spotify Commands"
                        subLabel="Share your Spotify activity"
                        icon={<TableRow.Icon source={findAssetId("SpotifyNeutralIcon")} />}
                        arrow
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "Spotify Commands",
                                render: SpotifySettingsPage,
                            })
                        }
                    />
                    <TableRow
                        label="Aliucord Commands"
                        subLabel="Commands from Aliucord"
                        icon={<TableRow.Icon source={{ uri: "https://avatars.githubusercontent.com/u/78881422?s=200&v=4" }} />}
                        arrow
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "Aliucord",
                                render: AliucordPage,
                            })
                        }
                    />
                    <TableRow
                        label="Other Commands"
                        subLabel="Utility and system commands"
                        icon={<TableRow.Icon source={findAssetId("WrenchIcon")} />}
                        arrow
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "Other Commands",
                                render: OtherSettingsPage,
                            })
                        }
                    />
                </TableRowGroup>

                {storage.hiddenSettings?.visible && (
                    <TableRowGroup title="Hidden Settings">
                        <TableRow
                            label="Hidden Commands"
                            subLabel="Access to experimental and NSFW commands"
                            icon={<TableRow.Icon source={findAssetId("EyeIcon")} />}
                            arrow
                            onPress={() =>
                                navigation.push("RAIN_CUSTOM_PAGE", {
                                    title: "Hidden Settings",
                                    render: HiddenSettingsPage,
                                })
                            }
                        />
                    </TableRowGroup>
                )}

                <TableRowGroup title="Other">
                    <TableRow
                        label="Credits"
                        subLabel="View original authors of the plugins"
                        icon={<TableRow.Icon source={findAssetId("HeartIcon")} />}
                        arrow
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "Credits",
                                render: CreditsPage,
                            })
                        }
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
