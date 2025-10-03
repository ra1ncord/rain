import { definePlugin } from "@plugins/index";

export default definePlugin({
    manifest: {
        id: "dummy",
        version: "1.1.0",
        display: {
            name: "Badges",
            description: "Adds badges to user's profile",
            authors: [{ name: "cocobo1", id: 3248732894723894732847328947832947283947n }]
        }
    },
    
    start() {
        alert("hi")
    }
});