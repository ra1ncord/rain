import AddonBrowser from "@rain/pages/Browser/AddonBrowser";
import { installFont, removeFont,useFonts } from "@rain/plugins/_core/painter/fonts";

const cachedFonts = { data: null };

export default () => (
    <AddonBrowser
        type="fonts"
        url="https://codeberg.org/raincord/OfficialAddons/raw/branch/main/Fonts/fonts.json"
        useStore={useFonts}
        installFn={installFont}
        removeFn={removeFont}
        identityKey="name"
        cache={cachedFonts}
    />
);
