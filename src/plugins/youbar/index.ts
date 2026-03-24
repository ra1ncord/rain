import { findByProps } from "@metro";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";


const ExperimentManager = findByProps("overrideBucket");
const EXPERIMENT_ID = "2026-01-you-bar";

// this plugin is also kinda a demo on how to override apex experiments :P

export default definePlugin({
    name: "YouBar",
    description: Strings.PLUGINS.CUSTOM.YOUBAR.DESCRIPTION,
    author: [Developers.cocobo1],
    id: "youbar",
    version: "1.0.0",

    // since this is a demo i should probably mention this isnt needed for all experiment overrides
    requiresRestart: true,

    start() {
        // the number can be changed to change the treatment
        ExperimentManager.overrideBucket("apex", EXPERIMENT_ID, 1);
    },
    stop() {
        ExperimentManager.overrideBucket("apex", EXPERIMENT_ID, null);
    }
});
