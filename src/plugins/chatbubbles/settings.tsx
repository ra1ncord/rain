import { semanticColors } from "@api/ui/components/color";
import { SliderRow } from "@api/ui/components/SliderRow";
import { createStyles } from "@api/ui/styles";
import { Card, Stack, TableRowGroup, TextInput } from "@metro/common/components";
import { ScrollView } from "react-native";
import { Strings } from "@rain/i18n";

import { useChatBubblesSettings } from "./storage";

const useStyles = createStyles({
    container: {
        paddingVertical: 24,
        paddingHorizontal: 12,
    },
    sliderCard: {
        backgroundColor: semanticColors.CARD_SECONDARY_BG,
        borderRadius: 12,
        overflow: "hidden",
        padding: 16,
        gap: 20,
    },
    sliderLabel: {
        color: "text-strong"
    },
    sliderValue: {
        color: "text-muted"
    },
    sliderEndLabel: {
        color: "text-muted"
    },
});

export default () => {
    const styles = useStyles();
    const { avatarRadius, bubbleChatRadius, bubbleChatColor, updateSettings } = useChatBubblesSettings();

    return (
        <ScrollView>
            <Stack style={styles.container} spacing={24}>

                <TableRowGroup title={Strings.PLUGINS.CUSTOM.CHATBUBBLES.SETTINGS.APPEARANCE}>
                    <Card style={styles.sliderCard}>
                        <SliderRow maximumValue={50}
                            label={Strings.PLUGINS.CUSTOM.CHATBUBBLES.SETTINGS.AVATAR_RADIUS}
                            value={avatarRadius}
                            onChange={v => updateSettings({ avatarRadius: v })}
                        />
                        <SliderRow maximumValue={50}
                            label={Strings.PLUGINS.CUSTOM.CHATBUBBLES.SETTINGS.BUBBLE_RADIUS}
                            value={bubbleChatRadius}
                            onChange={v => updateSettings({ bubbleChatRadius: v })}
                        />
                        <TextInput
                            label={Strings.PLUGINS.CUSTOM.CHATBUBBLES.SETTINGS.BUBBLE_COLOR}
                            placeholder={Strings.PLUGINS.CUSTOM.CHATBUBBLES.SETTINGS.BUBBLE_COLOR_DESC}
                            value={bubbleChatColor}
                            onChange={v => updateSettings({ bubbleChatColor: v })}
                            isClearable
                        />
                    </Card>
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
};
