import { after } from "@api/patcher";
import { findInReactTree } from "@lib/utils";
import { findByTypeName } from "@metro";

import SongSection from "../components/SongSection";

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
            if (profileSections) {
                const reviewIndex = profileSections.findIndex(
                    (i: any) => i?.type?.name === "ReviewSection",
                );
                const insertAt = reviewIndex !== -1 ? reviewIndex : profileSections.length;
                profileSections.splice(insertAt, 0, React.createElement(SongSection, { userId }));
            }
        })
        : (): boolean => {
            return false;
        };
