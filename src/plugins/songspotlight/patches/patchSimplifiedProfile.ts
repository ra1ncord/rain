import { after } from "@api/patcher";
import { findInReactTree } from "@lib/utils";
import { findByTypeName } from "@metro";


import SongSection from "../components/SongSection";
import { songSpotlightSettings } from "../storage";

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
                const displayPosition = songSpotlightSettings.displayPosition;
                if (displayPosition === "betweenBioAndRoles") {
                    // Insert after about me card, before roles
                    const bioIdx = profileSections.findIndex(
                        (i: any) =>
                            i?.type?.name === "SimplifiedUserProfileAboutMeCard",
                    );
                    const insertAt = bioIdx !== -1 ? bioIdx + 1 : 0;
                    profileSections.splice(insertAt, 0, React.createElement(SongSection, { userId }));
                } else if (displayPosition === "aboveBio") {
                    // Insert before about me card
                    const bioIdx = profileSections.findIndex(
                        (i: any) =>
                            i?.type?.name === "SimplifiedUserProfileAboutMeCard",
                    );
                    const insertAt = bioIdx !== -1 ? bioIdx : 0;
                    profileSections.splice(insertAt, 0, React.createElement(SongSection, { userId }));
                } else {
                    // Default: above ReviewDB
                    const reviewIndex = profileSections.findIndex(
                        (i: any) => i?.type?.name === "ReviewSection",
                    );
                    const insertAt = reviewIndex !== -1 ? reviewIndex : profileSections.length;
                    profileSections.splice(insertAt, 0, React.createElement(SongSection, { userId }));
                }
            }
        })
        : (): boolean => {
            return false;
        };
