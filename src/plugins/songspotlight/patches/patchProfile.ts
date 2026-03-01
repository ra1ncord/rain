import { after } from "@api/patcher";
import { findInReactTree } from "@lib/utils";
import { findByTypeName } from "@metro";


import SongSection from "../components/SongSection";
import { songSpotlightSettings } from "../storage";

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
            const displayPosition = songSpotlightSettings.displayPosition;
            if (displayPosition === "betweenBioAndRoles") {
                // Insert after bio/about me, before roles
                const bioIdx = profileSections.findIndex(
                    (i: any) =>
                        i?.type?.name === "UserProfileBio" ||
                        i?.type?.name === "UserProfileAboutMeCard",
                );
                const insertAt = bioIdx !== -1 ? bioIdx + 1 : 0;
                profileSections.splice(insertAt, 0, React.createElement(SongSection, { userId }));
            } else if (displayPosition === "aboveBio") {
                // Insert before bio/about me
                const bioIdx = profileSections.findIndex(
                    (i: any) =>
                        i?.type?.name === "UserProfileBio" ||
                        i?.type?.name === "UserProfileAboutMeCard",
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
    });
