import { instead } from "@api/patcher";
import { findByName } from "@metro";
import { React } from "@metro/common";

import ReviewCard from "../components/ReviewCard";
import { logger } from "@lib/utils/logger";

const GuildActionSheetProgress = findByName("GuildActionSheetProgress", false);
logger.log(GuildActionSheetProgress);

export default () =>
    instead("default", GuildActionSheetProgress, (args, ret) => {
        const guildId = args[0]?.guild?.id;
        return React.createElement(ReviewCard, { userId: guildId });
    });
