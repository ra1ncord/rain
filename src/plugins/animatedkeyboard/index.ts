import { findByProps } from "@metro";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

const ExperimentManager = findByProps("overrideBucket");
const EXPERIMENT_ID = "2025-08-animated-keyboard-android";

// this plugin is also kinda a demo on how to override apex experiments :P

export default definePlugin({
    name: "AnimatedKeyboard",
    description: "Enables animated keyboard via experiment override",
    author: [Developers.cocobo1],
    id: "animatedkeyboard",
    version: "1.0.0",
    start() {
        ExperimentManager.overrideBucket("apex", EXPERIMENT_ID, 1);
    },
    stop() {
        ExperimentManager.overrideBucket("apex", EXPERIMENT_ID, null);
    }
});