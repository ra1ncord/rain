import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { showToast } from "@api/ui/toasts";
import { clipboard, constants, ReactNative as RN } from "@metro/common";
import { findByPropsLazy } from "@metro/wrappers";

const moment = findByPropsLazy("isMoment");
const { Text } = RN;

const MessageStyles = {
    container: {
        flex: 1,
        padding: 16,
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },
    title: {
        fontFamily: constants.Fonts.PRIMARY_SEMIBOLD,
        fontSize: 24,
        textAlign: "left" as const,
        color: semanticColors.HEADER_PRIMARY,
        paddingVertical: 25
    },
    text: {
        flex: 1,
        flexDirection: "row" as const,
        fontSize: 16,
        textAlign: "justify" as const,
        color: semanticColors.HEADER_PRIMARY,
    },
    dateContainer: {
        height: 16,
        alignSelf: "baseline" as const
    },
    bold: {
        fontFamily: constants.Fonts.PRIMARY_SEMIBOLD,
    },
    highlight: {
        backgroundColor: semanticColors.BACKGROUND_MESSAGE_HIGHLIGHT_HOVER,
    }
} as const;

function FancyDate({ date }: { date: Date }) {
    return (
        <Text
            onPress={() => {
                showToast(
                    moment(date).toLocaleString(), findAssetId("ClockIcon")
                );
            }}
            onLongPress={() => {
                clipboard.setString(date.getTime().toString());
                showToast(
                    "Copied Timestamp to Clipboard", findAssetId("CopyIcon")
                );
            }}
            style={[MessageStyles.highlight]}
        >
            {moment(date).fromNow()}
        </Text>
    );
}

export default function AlertContent({ channel }: { channel: any }) {
    const snowflakeUtils = findByPropsLazy("extractTimestamp");

    return (
        <>
            <Text style={[MessageStyles.text, MessageStyles.bold]}>Topic:</Text> <Text>{channel.topic || "No topic."}</Text>
            <Text style={[MessageStyles.text, MessageStyles.bold]}>{"\n\n"}Creation date:</Text> <FancyDate date={new Date(snowflakeUtils.extractTimestamp(channel.id))} />
            <Text style={[MessageStyles.text, MessageStyles.bold]}>{"\n\n"}Last message:</Text> {channel.lastMessageId ? <FancyDate date={new Date(snowflakeUtils.extractTimestamp(channel.lastMessageId))} /> : <Text>No messages.</Text>}
            <Text style={[MessageStyles.text, MessageStyles.bold]}>{"\n\n"}Last pin:</Text> {channel.lastPinTimestamp ? <FancyDate date={new Date(channel.lastPinTimestamp)} /> : <Text>No pins.</Text>}
        </>
    );
}
