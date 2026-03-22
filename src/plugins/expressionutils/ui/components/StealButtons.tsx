import { showToast } from "@api/ui/toasts";
import { clipboard, ReactNative } from "@metro/common";
import { Button } from "@metro/common/components";

import { downloadMediaAsset, LazyActionSheet } from "../../modules";
import { useExpressionUtilsSettings } from "../../storage";
import { showAddToServerActionSheet } from "../sheets/AddToServerActionSheet";


export default function StealButtons({ emoji }: { emoji: any }) {
    const emojiName = emoji.alt ?? emoji.name ?? "emoji";
    let emojiId = emoji.id;
    if (!emojiId && typeof emoji.src === "string") {
        const match = emoji.src.match(/discordapp\.com\/emojis\/(\d+)\.(?:png|gif|webp)/);
        if (match) {
            emojiId = match[1];
        }
    }
    const settings = useExpressionUtilsSettings();

    async function saveImage() {
        await downloadMediaAsset(emoji.src, 0);
        if (LazyActionSheet && LazyActionSheet.hideActionSheet) LazyActionSheet.hideActionSheet();
    }

    async function copyImageToClipboard() {
        const response = await fetch(emoji.src);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result as string;
            clipboard.setString(base64data);
            showToast(`Copied ${emojiName}'s image to clipboard`);
        };
    }

    const buttons = [
        settings.showCloneButton && {
            text: "Add to Server",
            callback: () => {
                showAddToServerActionSheet(emoji);
            }
        },
        settings.showDownloadButton && {
            text: `Save image to ${ReactNative.Platform.select({ android: "Downloads", default: "Camera Roll" })}`,
            callback: saveImage
        },
        settings.showCopyURLButton && {
            text: "Copy Emoji URL",
            callback: () => {
                clipboard.setString(emoji.src);
                showToast("Copied emoji URL!");
            }
        },
        settings.showCopyMarkdownButton && {
            text: "Copy Markdown",
            callback: () => {
                if (emojiId) {
                    const markdown = `<${emoji.animated ? "a" : ""}:${emojiName}:${emojiId}>`;
                    clipboard.setString(markdown);
                    showToast("Copied emoji markdown!");
                } else if (emoji.native) {
                    clipboard.setString(emoji.native);
                    showToast("Copied emoji character!");
                } else {
                    showToast("This emoji cannot be copied as markdown.");
                }
            }
        },
        ...ReactNative.Platform.select({
            ios: [
                {
                    text: "Copy image to clipboard",
                    callback: copyImageToClipboard
                }
            ],
            default: []
        })
    ].filter(Boolean);

    return (
        <>
            {(buttons.filter(Boolean) as { text: string; callback: () => void }[]).map(({ text, callback }) => (
                <Button
                    key={text}
                    text={text}
                    onPress={callback}
                    style={{ marginTop: ReactNative.Platform.select({ android: 8, default: 12 }) }}
                />
            ))}
        </>
    );
}
