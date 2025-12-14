import { definePlugin } from "@plugins";
import { initPlugins, updatePlugins } from "./bunny";
import { VdPluginManager } from "./vendetta";
import * as lib from "@lib";
import { initVendettaObject } from "./vendetta/api";

export default definePlugin({
    name: "Traveller",
    description: "Allows you to use plugins from other Discord clients",
    author: [{ name: "cocobo1", id: 767650984175992833n }],
    id: "traveller",
    version: "v1.0.0",
    start() {
        window.bunny = lib;
        initVendettaObject();
        initExternalPlugins();
    }
});

async function initExternalPlugins() {
    updatePlugins();
    initPlugins();
    VdPluginManager.initPlugins();
}