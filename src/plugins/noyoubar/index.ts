import { findByProps } from "@metro";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

const ExperimentManager = findByProps("overrideBucket");
const EXPERIMENT_ID = "2026-01-you-bar";

// this plugin is also kinda a demo on how to override apex experiments :P

export default definePlugin({
    name: "NoYouBar",
    description: "Disables YouBar via experiment override",
    author: [Developers.cocobo1],
    id: "noyoubar",
    version: "1.0.0",
    start() {
        // the number can be changed to change the treatment
        ExperimentManager.overrideBucket("apex", EXPERIMENT_ID, 0);
    },
    stop() {
        ExperimentManager.overrideBucket("apex", EXPERIMENT_ID, null);
    }
});
