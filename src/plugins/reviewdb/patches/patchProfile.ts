import { after } from "@api/patcher";
import { findInReactTree } from "@lib/utils";
import { findByTypeName } from "@metro";
import { React } from "@metro/common";

import ReviewSection from "../components/ReviewSection";

let UserProfile = findByTypeName("UserProfile");
if (UserProfile === undefined)
    UserProfile = findByTypeName("UserProfileContent");

export default () =>
    after("type", UserProfile, (args, ret) => {
        const profileSections = findInReactTree(
            ret,
            r =>
                r?.type?.displayName === "View" &&
                // UserProfileBio still exists even when the user has no bio. Yep.
                r?.props?.children.findIndex(
                    (i: any) =>
                        i?.type?.name === "UserProfileBio" ||
                        i?.type?.name === "UserProfileAboutMeCard",
                ) !== -1,
        )?.props?.children;

        let userId = args[0]?.userId;
        if (userId === undefined) userId = args[0]?.user?.id;

        profileSections?.push(React.createElement(ReviewSection, { userId }));
    });
