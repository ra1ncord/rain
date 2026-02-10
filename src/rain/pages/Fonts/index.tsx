import { useSettings } from "@api/settings";
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
            title={"Fonts"}
            searchKeywords={["name", "description"]}
            sortOptions={{
                "Name (A-Z)": (a, b) => a.name.localeCompare(b.name),
                "Name (Z-A)": (a, b) => b.name.localeCompare(a.name)
            }}
            items={Object.values(fonts)}
            CardComponent={FontCard}
            installBrowserAction={{
                label: "Install a font from the browser",
                onPress: () => {
                    navigation.push("RAIN_CUSTOM_PAGE", {
                        title: "Addon Browser",
                        render: () => <FontBrowser />
                    });
                }
            }}
            installAction={{
                label: "Install a font from URL",
                onPress: () => {
                    navigation.push("RAIN_CUSTOM_PAGE", {
                        title: "Import Font",
                        render: () => <FontEditor />
                    });
                }
            }}
        />
    );
}
