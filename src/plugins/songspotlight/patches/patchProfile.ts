import { after } from "@api/patcher";
import { findInReactTree } from "@lib/utils";
import { findByTypeName } from "@metro";

import SongSection from "../components/SongSection";

let UserProfile = findByTypeName("UserProfile");
if (UserProfile === undefined)
    UserProfile = findByTypeName("UserProfileContent");

export default () =>
    after("type", UserProfile, (args, ret) => {
        const profileSections = findInReactTree(
            ret,
            r =>
                r?.type?.displayName === "View" &&
                r?.props?.children.findIndex(
                    (i: any) =>
                        i?.type?.name === "UserProfileBio" ||
                        i?.type?.name === "UserProfileAboutMeCard",
                ) !== -1,
        )?.props?.children;

        let userId = args[0]?.userId;
        if (userId === undefined) userId = args[0]?.user?.id;

        if (profileSections) {
            // Insert right before ReviewDB's ReviewSection, or at end if not present
            const reviewIndex = profileSections.findIndex(
                (i: any) => i?.type?.name === "ReviewSection",
            );
            const insertAt = reviewIndex !== -1 ? reviewIndex : profileSections.length;
            profileSections.splice(insertAt, 0, React.createElement(SongSection, { userId }));
        }
    });
