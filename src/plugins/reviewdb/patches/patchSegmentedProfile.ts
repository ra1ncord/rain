import { after } from "@api/patcher";
import { findInReactTree } from "@lib/utils";
import { findByFilePath } from "@metro";

import ReviewSection from "../components/ReviewSection";

const SegmentedControlPages = findByFilePath("design/components/SegmentedControl/native/SegmentedControlPages.native.tsx")

export default () =>
	SegmentedControlPages !== undefined ? after("SegmentedControlPages", SegmentedControlPages, (args, ret) => {
		const profileSections = findInReactTree(
			ret?.props?.children[0]?.props?.item?.page?.props?.children,
			r =>
				r?.type?.displayName === "View" &&
				// UserProfileBio still exists even when the user has no bio. Yep.
				r?.props?.children.findIndex(
					(i: any) =>
						i?.type?.name === "UserProfileBio" ||
						i?.type?.name === "UserProfileAboutMeCard"
				) !== -1,
		)?.props?.children;

		let userId = args[0]?.userId;
		if (userId === undefined) userId = args[0]?.user?.id;

		profileSections?.push(React.createElement(ReviewSection, { userId }));
	}) : (): boolean => {
        return false;
    };
