import { createStyles } from "@api/ui/styles";
import { Badge } from "../def";
import { useThemedColor } from "../lib/utils";
import ReviewBadge from "./ReviewBadge";
import { ReactNative as RN } from "@metro/common";
import { Forms } from "@metro/common/components";

interface ReviewUsernameProps {
    username: string;
    badges: Badge[];
}

const useStyles = createStyles({
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
});

const { FormLabel } = Forms;

export default ({ username, badges }: ReviewUsernameProps) => {
    const styles = useStyles();
    
    return (
        <RN.View style={styles.row}>
            <FormLabel
                text={username}
                style={{ color: useThemedColor("TEXT_NORMAL") }}
            />
            <RN.View style={styles.row}>
                {badges.map((b) => (
                    <ReviewBadge badge={b} />
                ))}
            </RN.View>
        </RN.View>
    );
};