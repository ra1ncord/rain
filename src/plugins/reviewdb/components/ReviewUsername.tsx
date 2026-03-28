import { createStyles } from "@api/ui/styles";
import { ReactNative as RN } from "@metro/common";
import { Forms } from "@metro/common/components";

import { Badge } from "../def";
import { useThemedColor } from "../lib/utils";
import ReviewBadge from "./ReviewBadge";

interface ReviewUsernameProps {
    username: string;
    badges: Badge[];
    timestamp: string;
}

const useStyles = createStyles({
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
});

const { FormLabel } = Forms;

export default ({ username, badges, timestamp }: ReviewUsernameProps) => {
    const styles = useStyles();

    return (
        <RN.View style={styles.row}>
            <FormLabel
                text={username}
                style={{ color: useThemedColor("TEXT_NORMAL") }}
            />
            <RN.View style={styles.row}>
                {badges.map(b => (
                    <ReviewBadge badge={b} />
                ))}
            </RN.View>
            <FormLabel
                text={timestamp}
                style={{ color: useThemedColor("TEXT_MUTED"), marginLeft: 5 }}
            />
        </RN.View>
    );
};
