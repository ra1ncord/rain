import { findByProps } from "@metro";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

const ExperimentManager = findByProps("overrideBucket");
const EXPERIMENT_ID = "2025-08-animated-keyboard-android";

// this plugin is also kinda a demo on how to override apex experiments :P

export default definePlugin({
    name: "AnimatedKeyboard",
    description: Strings.PLUGINS.CUSTOM.ANIMATEDKEYBOARD.DESCRIPTION,
    author: [Developers.cocobo1],
    id: "animatedkeyboard",
    version: "1.0.0",

    // since this is a demo i should probably mention this isnt needed for all experiment overrides
    requiresRestart: true,

    start() {
        ExperimentManager.overrideBucket("apex", EXPERIMENT_ID, 1);
    },
    stop() {
        ExperimentManager.overrideBucket("apex", EXPERIMENT_ID, null);
    }
});
