import { definePlugin } from "@plugins";

export default definePlugin({
    name: "Dummy",
    description: "Example plugin",
    author: [{ name: "Your Name!", id: 123456789012345678n }],
    id: "dummy",
    version: "v1.0.0",
    start() {
        //alert("This is a plugin called " + this.name);
    },
    eagerStart() {
        //alert("This is a eager start")
    },
    stop() {
        //alert("this plugin was stopped")
    }
});