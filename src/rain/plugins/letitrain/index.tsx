import { onJsxCreate } from "@api/react/jsx";
import { definePlugin } from "@plugins";
import RainOverlay from "./RainOverlay";
import settings from "./settings";

const patches: (() => void)[] = [];

export default definePlugin({
    name: "LetItRain",
    description: "Keep the rain effect on with customizable settings (amount, size, transparency).",
    author: [{ name: "Rain Community", id: 0n }],
    id: "letitrain",
    version: "v1.0.0",
    
    start() {
        const injectRain = (_: any, ret: any) => {
            if (!ret || !ret.props) return ret;
            
            const originalChildren = ret.props.children;
            ret.props.children = (
                <>
                    {originalChildren}
                    <RainOverlay />
                </>
            );
            return ret;
        };

        onJsxCreate("App", injectRain);
        onJsxCreate("SafeAreaProvider", injectRain);
        
        patches.push(() => {
        });
    },

    stop() {
        for (const unpatch of patches) unpatch();
    },

    settings: settings
});
