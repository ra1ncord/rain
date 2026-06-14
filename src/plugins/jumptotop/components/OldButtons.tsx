import { findAssetId } from "@api/assets";
import { IconButton } from "@metro/common/components";

import { jumpToTop } from "../utils";
import { UpsideDown } from "./UpsideDown";

const commonProps = {
    variant: "secondary",
    icon: findAssetId("ArrowLargeDownIcon"),
} as const;

type OldButtonsProps = {
    isNotCurrentChannel?: boolean;
    details?: { guildId?: string; channelId?: string; };
    JumpToPresentButton: React.ReactElement<{ onPress: () => void; }>;
    noJumpToPresent?: boolean;
};

export function OldButtons({
    isNotCurrentChannel = false,
    details = {},
    JumpToPresentButton,
    noJumpToPresent = false,
}: OldButtonsProps) {
    const jumpToPresent = JumpToPresentButton.props?.onPress;

    if (noJumpToPresent)
        return <IconButton onPress={jumpToPresent} {...commonProps} />;

    return (
        <>
            <UpsideDown>
                <IconButton
                    onPress={jumpToTop(isNotCurrentChannel, details as { guildId: string; channelId: string; })}
                    {...commonProps}
                />
            </UpsideDown>
            <IconButton onPress={jumpToPresent} {...commonProps} />
        </>
    );
}
