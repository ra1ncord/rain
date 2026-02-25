import { findByName, findByProps } from "@metro";

import CreateDecoration from "../pages/CreateDecoration";

const Navigator = findByName("Navigator") ?? findByProps("Navigator")?.Navigator;
const modalCloseButton =
  findByProps("getRenderCloseButton")?.getRenderCloseButton ??
  findByProps("getHeaderCloseButton")?.getHeaderCloseButton;

const { popModal } = findByProps("pushModal");

export default () => (
    <Navigator
        initialRouteName="CREATE_DECORATION"
        screens={{
            CREATE_DECORATION: {
                headerLeft: modalCloseButton(() => popModal("create-decoration")),
                render: CreateDecoration,
                title: "Create Decoration"
            }
        }}
    />
);
