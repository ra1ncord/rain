import { findByName } from "@metro";
import ReviewCard from "../components/ReviewCard";
import { instead } from "@api/patcher";
import { React } from "@metro/common";

let GuildActionSheetProgress = findByName("GuildActionSheetProgress", false);
console.log(GuildActionSheetProgress);

export default () =>
    instead("default", GuildActionSheetProgress, (args, ret) => {
        const guildId = args[0]?.guild?.id;
        return React.createElement(ReviewCard, { userId: guildId });
    });
