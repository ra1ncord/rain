import { after } from "@api/patcher";
import { findInReactTree } from "@lib/utils";
import { findByTypeName } from "@metro";

import ReviewSection from "../components/ReviewSection";

const SimplifiedUserProfileContent = findByTypeName(
    "SimplifiedUserProfileContent",
);

export default () =>
    SimplifiedUserProfileContent !== undefined
        ? after("type", SimplifiedUserProfileContent, (args, ret) => {
            const profileSections = findInReactTree(
                ret,
                r =>
                    r?.type?.displayName === "View" &&
                      r?.props?.children.findIndex(
                          (i: any) =>
                              i?.type?.name ===
                              "SimplifiedUserProfileAboutMeCard",
                      ) !== -1,
            )?.props?.children;

            const userId = args[0]?.user?.id;
            profileSections?.push(
                React.createElement(ReviewSection, { userId }),
            );
        })
        : (): boolean => {
            return false;
        };
