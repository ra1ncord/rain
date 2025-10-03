import { plugin } from "./types";

export const plugins: Record<string, plugin> = {
    //"settings": require("./corePlugins/settings"),
    "dummy": require("./corePlugins/dummy"),
    "badges": require("./corePlugins/badges"),
    //"alwaystrust": require("./userPlugins/alwaystrust"),
};