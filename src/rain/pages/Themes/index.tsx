import AddonPage from "@rain/pages/Addon/AddonPage";
import ThemeCard from "./ThemeCard";
import {
  getCurrentTheme,
  installTheme,
  themes,
  VdThemeInfo,
} from "@plugins/_core/painter/themes";
import { colorsPref } from "@plugins/_core/painter/themes/preferences";
import { updateBunnyColor } from "@plugins/_core/painter/themes/updater";
import { Author } from "@plugins/_core/painter/themes/types";
import { findAssetId } from "@api/assets";
import { settings } from "@api/settings";
import { useObservable } from "@api/storage";
import {
  ActionSheet,
  BottomSheetTitleHeader,
  Button,
  TableRowGroup,
  TableSwitchRow,
  TableRowIcon,
} from "@metro/common/components";
import { View } from "react-native";

/**
 * Theme options have been changed from radio groups to individual switches
 * for better UX. Each option can now be toggled independently.
 */

export default function Themes() {
  useObservable([settings, themes]);

  return (
    <AddonPage<VdThemeInfo>
      title="Themes"
      searchKeywords={[
        "data.name",
        "data.description",
        (p) => p.data.authors?.map((a: Author) => a.name).join(", ") ?? "",
      ]}
      sortOptions={{
        "Name (A-Z)": (a, b) => a.data.name.localeCompare(b.data.name),
        "Name (Z-A)": (a, b) => b.data.name.localeCompare(a.data.name),
      }}
      installAction={{
        label: "Install a theme",
        fetchFn: installTheme,
      }}
      items={Object.values(themes)}
      safeModeHint={{
        message: settings.safeMode?.currentThemeId 
          ? "A theme is currently applied in safe mode"
          : "Themes are disabled in safe mode",
        footer: settings.safeMode?.currentThemeId && (
          <Button
            size="small"
            text="Disable Theme"
            onPress={() => delete settings.safeMode?.currentThemeId}
            style={{ marginTop: 8 }}
          />
        ),
      }}
      CardComponent={ThemeCard}
      OptionsActionSheetComponent={() => {
        useObservable([colorsPref]);

        return (
          <ActionSheet>
            <BottomSheetTitleHeader title="Options" />
            <View style={{ paddingVertical: 20, gap: 12 }}>
              {/* Changed from TableRadioGroup to individual TableSwitchRow components
                  for better UX - users can now toggle options individually */}
              <TableRowGroup title="Override Theme Type">
                <TableSwitchRow
                  label="Auto"
                  icon={<TableRowIcon source={findAssetId("RobotIcon")} />}
                  value={!colorsPref.type}
                  onValueChange={(enabled: boolean) => {
                    if (enabled) {
                      colorsPref.type = undefined;
                    } else {
                      colorsPref.type = "dark";
                    }
                    getCurrentTheme()?.data &&
                      updateBunnyColor(getCurrentTheme()!.data!, {
                        update: true,
                      });
                  }}
                />
                <TableSwitchRow
                  label="Dark"
                  icon={<TableRowIcon source={findAssetId("ThemeDarkIcon")} />}
                  value={colorsPref.type === "dark"}
                  onValueChange={(enabled: boolean) => {
                    colorsPref.type = enabled ? "dark" : undefined;
                    getCurrentTheme()?.data &&
                      updateBunnyColor(getCurrentTheme()!.data!, {
                        update: true,
                      });
                  }}
                />
                <TableSwitchRow
                  label="Light"
                  icon={<TableRowIcon source={findAssetId("ThemeLightIcon")} />}
                  value={colorsPref.type === "light"}
                  onValueChange={(enabled: boolean) => {
                    colorsPref.type = enabled ? "light" : undefined;
                    getCurrentTheme()?.data &&
                      updateBunnyColor(getCurrentTheme()!.data!, {
                        update: true,
                      });
                  }}
                />
              </TableRowGroup>
              <TableRowGroup title="Chat Background">
                <TableSwitchRow
                  label="Show Background"
                  icon={<TableRowIcon source={findAssetId("ImageIcon")} />}
                  value={!colorsPref.customBackground}
                  onValueChange={(enabled: boolean) => {
                    colorsPref.customBackground = enabled ? null : "hidden";
                  }}
                />
                <TableSwitchRow
                  label="Hide Background"
                  icon={<TableRowIcon source={findAssetId("DenyIcon")} />}
                  value={colorsPref.customBackground === "hidden"}
                  onValueChange={(enabled: boolean) => {
                    colorsPref.customBackground = enabled ? "hidden" : null;
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