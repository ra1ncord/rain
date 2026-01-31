import { before } from "@api/patcher";
import { findByProps, findByStoreName } from "@metro";
import modifyIfNeeded from "../utils";

const messageModule = findByProps("sendMessage", "receiveMessage");
const uploadModule = findByProps("uploadLocalFiles");
const { getCurrentUser } = findByStoreName("UserStore");

const patches = [
	before("sendMessage", messageModule, (args) => {
		if (getCurrentUser?.().premiumType === null) modifyIfNeeded(args[1]);
	}),
];

if (uploadModule?.uploadLocalFiles !== undefined) {
	patches.push(
		before("uploadLocalFiles", uploadModule, (args) => {
			if (getCurrentUser?.().premiumType === null)
				modifyIfNeeded(args[0].parsedMessage);
		}),
	);
}
export default [...patches];
