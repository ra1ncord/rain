import { findAssetId } from "@api/assets";
import { IconButton } from "@metro/common/components";

import { jumpToTop } from "../utils";
import { UpsideDown } from "./UpsideDown";

const commonProps = {
    variant: "secondary",
    icon: findAssetId("ArrowLargeDownIcon"),
} as const;

export function OldButtons({
    isNotCurrentChannel = false,
    details,
    JumpToPresentButton,
}: {
    isNotCurrentChannel: boolean;
    details: { guildId: string; channelId: string; };
    JumpToPresentButton: React.ReactElement<{ onPress: () => void; }>;
}) {
    const jumpToPresent = JumpToPresentButton.props?.onPress;

    return (
        <>
            <UpsideDown>
                <IconButton
                    onPress={jumpToTop(isNotCurrentChannel, details)}
                    {...commonProps}
                />
            </UpsideDown>
            <IconButton onPress={jumpToPresent} {...commonProps} />
        </>
    );
}
