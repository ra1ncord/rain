import { instead } from "@api/patcher";
import { findByProps, findByStoreName } from "@metro";

const nitroInfo = findByProps("canUseEmojisEverywhere");
const { getCurrentUser } = findByStoreName("UserStore");

export default [
	instead("canUseEmojisEverywhere", nitroInfo, (args, orig) => {
		if (getCurrentUser?.().premiumType !== null)
			return orig.apply(this, args);

		return true;
	}),
	instead("canUseAnimatedEmojis", nitroInfo, (args, orig) => {
		if (getCurrentUser?.().premiumType !== null)
			return orig.apply(this, args);

		return true;
	}),
];
