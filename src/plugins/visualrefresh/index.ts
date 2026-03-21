import { findByProps } from "@metro";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

const ExperimentManager = findByProps("overrideBucket");
const EXPERIMENT_ID = "2026-02-mobile-visual-refresh";

// this plugin is also kinda a demo on how to override apex experiments :P

export default definePlugin({
    name: Strings.PLUGINS.CUSTOM.VISUALREFRESH.NAME,
    description: Strings.PLUGINS.CUSTOM.VISUALREFRESH.DESCRIPTION,
    author: [Developers.cocobo1],
    id: "visualrefresh",
    version: "1.0.0",

    start() {
        // the number can be changed to change the treatment
        ExperimentManager.overrideBucket("apex", EXPERIMENT_ID, 1);
    },
    stop() {
        ExperimentManager.overrideBucket("apex", EXPERIMENT_ID, null);
    }
});
