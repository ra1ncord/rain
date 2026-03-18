import { useSettings } from "@api/settings";
import { Strings } from "@i18n";
import { NavigationNative } from "@metro/common";
import { FontDefinition, useFonts } from "@plugins/_core/painter/fonts";
import AddonPage from "@rain/pages/Addon/AddonPage";

import FontBrowser from "../Browser/Fonts";
import FontCard from "./FontCard";
import FontEditor from "./FontEditor";

export default function Fonts() {
    useSettings();
    const fonts = useFonts(state => state.fonts);
    const navigation = NavigationNative.useNavigation();

    return (
        <AddonPage<FontDefinition>
            title={Strings.GENERAL.CORE.FONTS}
            searchKeywords={["name", "description"]}
            sortOptions={{
                [Strings.GENERAL.CORE.SORT_NAME_AZ]: (a, b) => a.name.localeCompare(b.name),
                [Strings.GENERAL.CORE.SORT_NAME_ZA]: (a, b) => b.name.localeCompare(a.name)
            }}
            items={Object.values(fonts)}
            CardComponent={FontCard}
            installBrowserAction={{
                label: Strings.GENERAL.CORE.IMPORT_FROM_BROWSER,
                onPress: () => {
                    navigation.push("RAIN_CUSTOM_PAGE", {
                        title: Strings.GENERAL.CORE.ADDON_BROWSER,
                        render: () => <FontBrowser />
                    });
                }
            }}
            installAction={{
                label: Strings.GENERAL.CORE.IMPORT_FROM_URL,
                onPress: () => {
                    navigation.push("RAIN_CUSTOM_PAGE", {
                        title: Strings.GENERAL.CORE.IMPORT_FONT,
                        render: () => <FontEditor />
                    });
                }
            }}
        />
    );
}
