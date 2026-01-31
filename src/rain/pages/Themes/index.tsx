import { findAssetId } from "@api/assets";
import { useSettings } from "@api/settings";
import {
    ActionSheet,
    BottomSheetTitleHeader,
    Button,
    TableRowGroup,
    TableRowIcon,
    TableSwitchRow,
} from "@metro/common/components";
import { installTheme, useThemes, VdThemeInfo } from "@plugins/_core/painter/themes";
import { useColorsPref } from "@plugins/_core/painter/themes/preferences";
import { Author } from "@plugins/_core/painter/themes/types";
import AddonPage from "@rain/pages/Addon/AddonPage";
import { View } from "react-native";

import ThemeCard from "./ThemeCard";

/**
 * Theme options have been changed from radio groups to individual switches
 * for better UX. Each option can now be toggled independently.
 */

export default function Themes() {
    const themesMap = useThemes(s => s.themes);
    const themesList = Object.values(themesMap);
    const safeMode = useSettings(state => state.safeMode);

    return (
        <AddonPage<VdThemeInfo>
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
            installAction={{
                label: "Install a theme",
                fetchFn: installTheme,
            }}
            items={themesList}
            safeModeHint={{
                message: safeMode?.currentThemeId
                    ? "A theme is currently applied in safe mode"
                    : "Themes are disabled in safe mode",
                footer: safeMode?.currentThemeId && (
                    <Button
                        size="small"
                        text="Disable Theme"
                        onPress={() => {
                            delete safeMode.currentThemeId;
                            useSettings.getState().updateSettings({ safeMode });
                        }}
                        style={{ marginTop: 8 }}
                    />
                ),
            }}
            CardComponent={ThemeCard}
            OptionsActionSheetComponent={() => {
                const { type, customBackground, setType, setCustomBackground } = useColorsPref();

                return (
                    <ActionSheet>
                        <BottomSheetTitleHeader title="Options" />
                        <View style={{ paddingVertical: 20, gap: 12 }}>
                            <TableRowGroup title="Override Theme Type">
                                <TableSwitchRow
                                    label="Auto"
                                    icon={<TableRowIcon source={findAssetId("RobotIcon")} />}
                                    value={!type}
                                    onValueChange={(enabled: boolean) => {
                                        if (enabled) setType(undefined);
                                        else setType("dark");
                                    }}
                                />
                                <TableSwitchRow
                                    label="Dark"
                                    icon={<TableRowIcon source={findAssetId("ThemeDarkIcon")} />}
                                    value={type === "dark"}
                                    onValueChange={(enabled: boolean) => {
                                        setType(enabled ? "dark" : undefined);
                                    }}
                                />
                                <TableSwitchRow
                                    label="Light"
                                    icon={<TableRowIcon source={findAssetId("ThemeLightIcon")} />}
                                    value={type === "light"}
                                    onValueChange={(enabled: boolean) => {
                                        setType(enabled ? "light" : undefined);
                                    }}
                                />
                            </TableRowGroup>
                            <TableRowGroup title="Chat Background">
                                <TableSwitchRow
                                    label="Show Background"
                                    icon={<TableRowIcon source={findAssetId("ImageIcon")} />}
                                    value={!customBackground}
                                    onValueChange={(enabled: boolean) => {
                                        setCustomBackground(enabled ? null : "hidden");
                                    }}
                                />
                                <TableSwitchRow
                                    label="Hide Background"
                                    icon={<TableRowIcon source={findAssetId("DenyIcon")} />}
                                    value={customBackground === "hidden"}
                                    onValueChange={(enabled: boolean) => {
                                        setCustomBackground(enabled ? "hidden" : null);
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
