import { findAssetId } from "@api/assets";
import { useSettings } from "@api/settings";
import { Strings } from "@i18n";
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
import MonetCard from "@plugins/_core/painter/monet/MonetCard";
import { getCurrentTheme, installTheme, ThemeInfo,useThemes } from "@plugins/_core/painter/themes";
import { useColorsPref } from "@plugins/_core/painter/themes/preferences";
import { Author } from "@plugins/_core/painter/themes/types";
import { updateColor } from "@plugins/_core/painter/themes/updater";
import AddonPage from "@rain/pages/Addon/AddonPage";
import ThemeBrowser from "@rain/pages/Browser/Themes";
import { View } from "react-native";

import ThemeCard from "./ThemeCard";

export default function Themes() {
    const themesMap = useThemes(s => s.themes);
    const themesList = Object.values(themesMap);
    const safeMode = useSettings(state => state.safeMode);
    const navigation = NavigationNative.useNavigation();

    return (
        <AddonPage<ThemeInfo>
            title={Strings.THEMES}
            searchKeywords={[
                "data.name",
                "data.description",
                p => p.data.authors?.map((a: Author) => a.name).join(", ") ?? "",
            ]}
            sortOptions={{
                [Strings.SORT_NAME_AZ]: (a, b) => a.data.name.localeCompare(b.data.name),
                [Strings.SORT_NAME_ZA]: (a, b) => b.data.name.localeCompare(a.data.name),
            }}
            installBrowserAction={{
                label: Strings.INSTALL_FROM_BROWSER,
                onPress: () => {
                    navigation.push("RAIN_CUSTOM_PAGE", {
                        title: Strings.ADDON_BROWSER,
                        render: () => <ThemeBrowser />
                    });
                }
            }}
            installAction={{
                label: Strings.INSTALL_FROM_URL,
                fetchFn: installTheme,
            }}
            items={themesList}
            safeModeHint={{
                message: Strings.THEMES_DISABLED_IN_SAFE_MODE,
            }}
            CardComponent={ThemeCard}
            ListHeaderComponent={MonetCard}
            OptionsActionSheetComponent={() => {
                const { type, customBackground, setType, setCustomBackground } = useColorsPref();

                return (
                    <ActionSheet>
                        <BottomSheetTitleHeader title={Strings.OPTIONS} />
                        <View style={{ paddingVertical: 20, gap: 12 }}>
                            <TableRadioGroup
                                title={Strings.OVERRIDE_THEME_TYPE}
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
                                    label={Strings.AUTO}
                                    value="auto"
                                    icon={<TableRowIcon source={findAssetId("RobotIcon")} />}
                                />
                                <TableRadioRow
                                    label={Strings.DARK}
                                    value="dark"
                                    icon={<TableRowIcon source={findAssetId("ThemeDarkIcon")} />}
                                />
                                <TableRadioRow
                                    label={Strings.LIGHT}
                                    value="light"
                                    icon={<TableRowIcon source={findAssetId("ThemeLightIcon")} />}
                                />
                            </TableRadioGroup>
                            <TableRowGroup title={Strings.CHAT_BACKGROUND}>
                                <TableSwitchRow
                                    label={Strings.SHOW_BACKGROUND}
                                    subLabel={Strings.SHOW_BACKGROUND_DESC}
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
