import { installTheme, removeTheme,useThemes } from "@plugins/_core/painter/themes";
import AddonBrowser from "@rain/pages/Browser/AddonBrowser";

const cachedThemes = { data: null };

export default () => (
    <AddonBrowser
        type="themes"
        url="https://codeberg.org/raincord/OfficialAddons/raw/branch/main/Themes/themes.json"
        useStore={useThemes}
        installFn={installTheme}
        removeFn={removeTheme}
        identityKey="installUrl"
        cache={cachedThemes}
    />
);
