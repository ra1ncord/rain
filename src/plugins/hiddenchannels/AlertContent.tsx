import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { showToast } from "@api/ui/toasts";
import { clipboard, constants, ReactNative as RN } from "@metro/common";
import { findByPropsLazy } from "@metro/wrappers";
import { Strings } from "@rain/i18n";

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
                    Strings.PLUGINS.CUSTOM.HIDDENCHANNELS.COPIED_TIMESTAMP, findAssetId("CopyIcon")
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
            <Text style={[MessageStyles.text, MessageStyles.bold]}>{Strings.PLUGINS.CUSTOM.HIDDENCHANNELS.TOPIC}</Text> <Text>{channel.topic || Strings.PLUGINS.CUSTOM.HIDDENCHANNELS.NO_TOPIC}</Text>
            <Text style={[MessageStyles.text, MessageStyles.bold]}>{"\n\n"}{Strings.PLUGINS.CUSTOM.HIDDENCHANNELS.CREATION_DATE}</Text> <FancyDate date={new Date(snowflakeUtils.extractTimestamp(channel.id))} />
            <Text style={[MessageStyles.text, MessageStyles.bold]}>{"\n\n"}{Strings.PLUGINS.CUSTOM.HIDDENCHANNELS.LAST_MESSAGE}</Text> {channel.lastMessageId ? <FancyDate date={new Date(snowflakeUtils.extractTimestamp(channel.lastMessageId))} /> : <Text>{Strings.PLUGINS.CUSTOM.HIDDENCHANNELS.NO_MESSAGES}</Text>}
            <Text style={[MessageStyles.text, MessageStyles.bold]}>{"\n\n"}{Strings.PLUGINS.CUSTOM.HIDDENCHANNELS.LAST_PIN}</Text> {channel.lastPinTimestamp ? <FancyDate date={new Date(channel.lastPinTimestamp)} /> : <Text>{Strings.PLUGINS.CUSTOM.HIDDENCHANNELS.NO_PINS}</Text>}
        </>
    );
}
