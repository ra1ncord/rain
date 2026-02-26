import { showToast } from "@api/ui/toasts";
import { ReactNative as RN } from "@metro/common";

import { Badge } from "../def";

interface ReviewBadgeProps {
    badge: Badge;
}

export default function ReviewBadge({ badge }: ReviewBadgeProps) {
    return (
        <RN.Pressable
            style={{ marginLeft: 4 }}
            onPress={() => {
                // @ts-expect-error this is a vendetta-types moment
                showToast(badge.name, { uri: badge.icon });
            }}
        >
            <RN.Image source={{ uri: badge.icon, width: 16, height: 16 }} />
        </RN.Pressable>
    );
}
