import { initMetro } from "./metro";
import { initPlugins, updatePlugins } from "./plugins";

export default async () => {
    // Load everything in parallel
    await Promise.all([
        initMetro(),
        updatePlugins(),
        
    ])

    await initPlugins()
};