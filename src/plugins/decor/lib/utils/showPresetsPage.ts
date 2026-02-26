import { findByProps } from "@metro";

import Presets from "../../ui/pages/Presets";

const { pushModal } = findByProps("pushModal");

export default () =>
    pushModal({
        key: "decor-presets",
        modal: {
            key: "decor-presets",
            modal: Presets,
            animation: "slide-up",
            shouldPersistUnderModals: false,
            // You might want to add a title here if the modal supports it
            props: {},
            closable: true
        }
    });
