import { findByProps, findByStoreName } from "@metro/wrappers"
import { FluxDispatcher, React, ReactNative, i18n } from "@metro/common"
import { Forms } from "@metro/common/components"
import { before, after } from "@api/patcher"
import { semanticColors } from "@api/ui/components/color"
import { findAssetId } from "@api/assets"
import { findInReactTree } from "@lib/utils"
import { settings } from "../storage"

import { DeepL, GTranslate } from "../api"
import { getLangName } from "../lang"
import { showToast } from "@api/ui/toasts"
import { logger } from "@lib/utils/logger"

const LazyActionSheet = findByProps("openLazy", "hideActionSheet")
const ActionSheetRow = findByProps("ActionSheetRow")?.ActionSheetRow ?? Forms?.FormRow // no icon if legacy
const MessageStore = findByStoreName("MessageStore")
const ChannelStore = findByStoreName("ChannelStore")
const separator = "\n"

const styles = {
    iconComponent: {
        width: 24,
        height: 24,
        tintColor: semanticColors.INTERACTIVE_NORMAL
    }
}

let cachedData: object[] = []

export default () => before("openLazy", LazyActionSheet, ([component, key, msg]) => {
    const message = msg?.message
    if (key !== "MessageLongPressActionSheet" || !message) return
    component.then((instance: any) => {
        const unpatch = after("default", instance, (_, component) => {
            React.useEffect(() => () => { unpatch() }, [])

            // this thing is not backward compatible
            const buttons = findInReactTree(component, x => x?.[0]?.type?.name === "ActionSheetRow")
            if (!buttons) return
            const position = Math.max(buttons.findIndex((x: any) => x.props.message === i18n.Messages.MARK_UNREAD), 0)

            const originalMessage = MessageStore.getMessage(
                message.channel_id,
                message.id
            )
            if (!originalMessage?.content && !message.content) return

            const messageId = originalMessage?.id ?? message.id
            const messageContent = originalMessage?.content ?? message.content
            const existingCachedObject = cachedData.find((o: any) => Object.keys(o)[0] === messageId, "cache object")

            const translateType = existingCachedObject ? "Revert" : "Translate"
            const icon = translateType === "Translate" ? findAssetId("LanguageIcon") : findAssetId("ic_highlight")

            const translate = async () => {
                LazyActionSheet.hideActionSheet()
                try {
                    const target_lang = settings.target_lang ?? "en"
                    const isTranslated = translateType === "Translate"
                    const isImmersive = settings.immersive_enabled

                    if (!originalMessage) return

                    const emojiRegex = /<(a?):\w+:\d+>|<@!?\d+>|<#\d+>/g
                    const placeholders: string[] = []
                    const textToTranslate = messageContent.replace(emojiRegex, (match: string) => {
                        placeholders.push(match)
                        return ` [[${placeholders.length - 1}]] `
                    })
                    var translateResult: { text: string } | undefined
                    switch(settings.translator) {
                        case 0:
                            console.log("Translating with DeepL: ", textToTranslate)
                            translateResult = { text: (await DeepL.translate(textToTranslate, undefined, target_lang, !isTranslated)).text ?? "" }
                            break
                        case 1:
                            console.log("Translating with GTranslate: ", textToTranslate)
                            translateResult = { text: (await GTranslate.translate(textToTranslate, undefined, target_lang, !isTranslated)).text ?? "" }
                            break
                    }

                    if (!translateResult) return

                    let translatedText = translateResult.text
                    placeholders.forEach((original, index) => {
                        const pRegex = new RegExp(`\\[\\[\\s*${index}\\s*\\]\\]`, 'g')
                        translatedText = translatedText.replace(pRegex, original)
                    })

                    const finalContent = isTranslated
                                ? (isImmersive
                                    ? `${messageContent}${separator}> ${translatedText.trim()} \`(${getLangName(target_lang ?? "en", settings.translator ?? 1)})\``
                                    : `${translatedText.trim()} \`(${getLangName(target_lang ?? "en", settings.translator ?? 1)})\``)
                                : (existingCachedObject as Record<string, string>)[messageId as string]
                    FluxDispatcher.dispatch({
                        type: "MESSAGE_UPDATE",
                        message: {
                            id: messageId,
                            channel_id: originalMessage.channel_id,
                            guild_id: ChannelStore.getChannel(originalMessage.channel_id)?.guild_id,
                            content: finalContent,
                        },
                        log_edit: false,
                        otherPluginBypass: true // antied
                    })

                    isTranslated
                        ? cachedData.unshift({ [messageId]: messageContent })
                        : cachedData = cachedData.filter((e: any) => e !== existingCachedObject, "cached data override")
                } catch (e) {
                    showToast("Failed to translate message. Please check Debug Logs for more info.", findAssetId("Small"))
                    logger.error(e)
                }
            }


            buttons.splice(position, 0, (
                <ActionSheetRow
                    label={`${translateType} Message`}
                    icon={
                        <ActionSheetRow.Icon
                            source={icon}
                            IconComponent={() => (
                                <ReactNative.Image
                                    resizeMode="cover"
                                    style={styles.iconComponent}
                                    source={icon}
                                />
                            )}
                        />
                    }
                    onPress={translate}
                />
            ))
        })
    })
})
