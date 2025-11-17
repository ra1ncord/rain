import { definePlugin } from "@plugins";

export default definePlugin({
    name: "Dummy",
    description: "Example plugin",
    author: { name: "cocobo1", id: 123456789012345678n },
    id: "rain.dummy",
    icon: "hi",
    version: "v1.0.0",
    start() {
        //alert("This is a plugin called " + this.name);
    },
    stop() {
    }
});