import { findAssetId } from "@api/assets";
import { useSettings } from "@api/settings";
import { NavigationNative } from "@metro/common";
import {
    ActionSheet,
    BottomSheetTitleHeader,
    TableRadioGroup,
    TableRadioRow,
    TableRowGroup,
    TableRowIcon,
    TableSwitchRow,
} from "@metro/common/components";
import { getCurrentTheme, installTheme, ThemeInfo,useThemes } from "@plugins/_core/painter/themes";
import { useColorsPref } from "@plugins/_core/painter/themes/preferences";
import { Author } from "@plugins/_core/painter/themes/types";
import AddonPage from "@rain/pages/Addon/AddonPage";
import ThemeBrowser from "@rain/pages/Browser/Themes";
import { updateColor } from "@rain/plugins/_core/painter/themes/updater";
import { View } from "react-native";

import ThemeCard from "./ThemeCard";

export default function Themes() {
    const themesMap = useThemes(s => s.themes);
    const themesList = Object.values(themesMap);
    const safeMode = useSettings(state => state.safeMode);
    const navigation = NavigationNative.useNavigation();

    return (
        <AddonPage<ThemeInfo>
            title="Themes"
            searchKeywords={[
                "data.name",
                "data.description",
                p => p.data.authors?.map((a: Author) => a.name).join(", ") ?? "",
            ]}
            sortOptions={{
                "Name (A-Z)": (a, b) => a.data.name.localeCompare(b.data.name),
                "Name (Z-A)": (a, b) => b.data.name.localeCompare(a.data.name),
            }}
            installBrowserAction={{
                label: "Install a theme from the browser",
                onPress: () => {
                    navigation.push("RAIN_CUSTOM_PAGE", {
                        title: "Addon Browser",
                        render: () => <ThemeBrowser />
                    });
                }
            }}
            installAction={{
                label: "Install a theme from URL",
                fetchFn: installTheme,
            }}
            items={themesList}
            safeModeHint={{
                message: "Themes are disabled in safe mode",
            }}
            CardComponent={ThemeCard}
            OptionsActionSheetComponent={() => {
                const { type, customBackground, setType, setCustomBackground } = useColorsPref();

                return (
                    <ActionSheet>
                        <BottomSheetTitleHeader title="Options" />
                        <View style={{ paddingVertical: 20, gap: 12 }}>
                            <TableRadioGroup
                                title="Override Theme Type"
                                value={type ?? "auto"}
                                onChange={(value: string) => {
                                    const newType = value === "auto" ? undefined : (value as "dark" | "light");
                                    setType(newType);

                                    const currentTheme = getCurrentTheme();
                                    if (currentTheme?.data) {
                                        updateColor(currentTheme.data, { update: true });
                                    }
                                }}
                            >
                                <TableRadioRow
                                    label="Auto"
                                    value="auto"
                                    icon={<TableRowIcon source={findAssetId("RobotIcon")} />}
                                />
                                <TableRadioRow
                                    label="Dark"
                                    value="dark"
                                    icon={<TableRowIcon source={findAssetId("ThemeDarkIcon")} />}
                                />
                                <TableRadioRow
                                    label="Light"
                                    value="light"
                                    icon={<TableRowIcon source={findAssetId("ThemeLightIcon")} />}
                                />
                            </TableRadioGroup>
                            <TableRowGroup title="Chat Background">
                                <TableSwitchRow
                                    label="Show Background"
                                    subLabel="Shows or hides the theme's background image in chat"
                                    icon={<TableRowIcon source={findAssetId("ImageIcon")} />}
                                    value={!customBackground}
                                    onValueChange={() => {
                                        setCustomBackground(customBackground ? null : "hidden");

                                        const currentTheme = getCurrentTheme();
                                        if (currentTheme?.data) {
                                            updateColor(currentTheme.data, { update: true });
                                        }
                                    }}
                                />
                            </TableRowGroup>
                        </View>
                    </ActionSheet>
                );
            }}
        />
    );
}
