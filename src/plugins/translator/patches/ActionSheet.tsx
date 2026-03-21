import { findAssetId } from "@api/assets";
import { after, before } from "@api/patcher";
import { semanticColors } from "@api/ui/components/color";
import { showToast } from "@api/ui/toasts";
import { findInReactTree } from "@lib/utils";
import { logger } from "@lib/utils/logger";
import { FluxDispatcher, React, ReactNative } from "@metro/common";
import { findByProps, findByStoreName } from "@metro/wrappers";

import { DeepL, GTranslate } from "../api";
import { getLangName } from "../lang";
import { translatorSettings as settings } from "../storage";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const MessageStore = findByStoreName("MessageStore");
const ChannelStore = findByStoreName("ChannelStore");
const separator = "\n";

const styles = {
    iconComponent: {
        width: 24,
        height: 24,
        tintColor: semanticColors.INTERACTIVE_NORMAL
    }
};

let cachedData: object[] = [];

export default () => before("openLazy", LazyActionSheet, ([component, key, msg]) => {
    const message = msg?.message;
    if (key !== "MessageLongPressActionSheet" || !message) return;
    component.then((instance: any) => {
        const unpatch = after("default", instance, (_, component) => {
            React.useEffect(() => {
                return () => {
                    unpatch();
                };
            }, []);

            const actionSheetContainer = findInReactTree(
                component,
                x => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup",
            );

            if (!actionSheetContainer || !actionSheetContainer[1]) {
                logger.log("[Translator] Error: Could not find ActionSheet");
                return;
            }

            const middleGroup = actionSheetContainer[1];
            const ActionSheetRow = middleGroup.props.children[0].type;

            const originalMessage = MessageStore.getMessage(
                message.channel_id,
                message.id
            );
            if (!originalMessage?.content && !message.content) return;

            const messageId = originalMessage?.id ?? message.id;
            const messageContent = originalMessage?.content ?? message.content;
            const existingCachedObject = cachedData.find((o: any) => Object.keys(o)[0] === messageId);

            const translateType = existingCachedObject ? "Revert" : "Translate";
            const icon = translateType === "Translate" ? findAssetId("LanguageIcon") : findAssetId("StarIcon");

            const translate = async () => {
                LazyActionSheet.hideActionSheet();
                try {
                    const target_lang = settings.target_lang ?? "en";
                    const isTranslated = translateType === "Translate";
                    const isImmersive = settings.immersive_enabled;

                    if (!originalMessage) return;

                    const emojiRegex = /<(a?):\w+:\d+>|<@!?\d+>|<#\d+>/g;
                    const placeholders: string[] = [];
                    const textToTranslate = messageContent.replace(emojiRegex, (match: string) => {
                        placeholders.push(match);
                        return ` [[${placeholders.length - 1}]] `;
                    });
                    var translateResult: { text: string } | undefined;
                    switch(settings.translator) {
                        case 0:
                            console.log("Translating with DeepL: ", textToTranslate);
                            translateResult = { text: (await DeepL.translate(textToTranslate, undefined, target_lang, !isTranslated)).text ?? "" };
                            break;
                        case 1:
                            console.log("Translating with GTranslate: ", textToTranslate);
                            translateResult = { text: (await GTranslate.translate(textToTranslate, undefined, target_lang, !isTranslated)).text ?? "" };
                            break;
                    }

                    if (!translateResult) return;

                    let translatedText = translateResult.text;
                    placeholders.forEach((original, index) => {
                        const pRegex = new RegExp(`\\[\\[\\s*${index}\\s*\\]\\]`, "g");
                        translatedText = translatedText.replace(pRegex, original);
                    });

                    const finalContent = isTranslated
                        ? (isImmersive
                            ? `${messageContent}${separator}> ${translatedText.trim()} \`(${getLangName(target_lang ?? "en", settings.translator ?? 1)})\``
                            : `${translatedText.trim()} \`(${getLangName(target_lang ?? "en", settings.translator ?? 1)})\``)
                        : (existingCachedObject as Record<string, string>)[messageId as string];
                    FluxDispatcher.dispatch({
                        type: "MESSAGE_UPDATE",
                        message: {
                            id: messageId,
                            channel_id: originalMessage.channel_id,
                            guild_id: ChannelStore.getChannel(originalMessage.channel_id)?.guild_id,
                            content: finalContent,
                        },
                        log_edit: false,
                        otherPluginBypass: true
                    });

                    isTranslated
                        ? cachedData.unshift({ [messageId]: messageContent })
                        : cachedData = cachedData.filter((e: any) => e !== existingCachedObject);
                } catch (e) {
                    showToast("Failed to translate message. Please check Debug Logs for more info.", findAssetId("Small"));
                    logger.error(e);
                }
            };

            const translateButton = (
                <ActionSheetRow
                    label={`${translateType} Message`}
                    icon={{
                        $$typeof: middleGroup.props.children[0].props.icon.$$typeof,
                        type: middleGroup.props.children[0].props.icon.type,
                        key: null,
                        ref: null,
                        props: {
                            IconComponent: () => (
                                <ReactNative.Image
                                    resizeMode="cover"
                                    style={styles.iconComponent}
                                    source={icon}
                                />
                            ),
                        },
                    }}
                    onPress={translate}
                    key="translate-message"
                />
            );

            if (middleGroup.props.children.some((c: any) => c?.props?.label?.includes("Translate"))) return;

            const copyIndex = middleGroup.props.children.findIndex((child: any) =>
                child?.props?.label?.toUpperCase?.()?.includes("COPY") ||
                child?.props?.message?.toUpperCase?.()?.includes("COPY")
            );

            if (copyIndex !== -1) {
                middleGroup.props.children.splice(copyIndex, 0, translateButton);
            } else {
                middleGroup.props.children.push(translateButton);
            }
        });
    });
});
