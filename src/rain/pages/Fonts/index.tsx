import AddonPage from "@rain/pages/Addon/AddonPage";
import FontEditor from "./FontEditor";
import { useFonts } from "@plugins/_core/painter/fonts";
import { FontDefinition } from "@plugins/_core/painter/fonts";
import { useSettings } from "@api/settings";
import { NavigationNative } from "@metro/common";
import FontCard from "./FontCard";

export default function Fonts() {
    useSettings();
    const fonts = useFonts((state) => state.fonts);
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
            installAction={{
                label: "Install a font",
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