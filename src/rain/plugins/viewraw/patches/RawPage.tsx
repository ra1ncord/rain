import { ReactNative, clipboard, React } from "@metro/common"
import { showToast } from "@api/ui/toasts"
import { Codeblock } from "@api/ui/components"
import { cleanMessage } from "./cleanmessage"
import {findAssetId} from "@api/assets";
import {Button} from "@metro/common/components";

const { ScrollView } = ReactNative

export default function RawPage({ message }: any) {
    const stringMessage = React.useMemo(() => JSON.stringify(cleanMessage(message), null, 4), [message.id])

    const style = { marginBottom: 8 }

    return (<>
        <ScrollView style={{ flex: 1, marginHorizontal: 13, marginVertical: 10 }}>
            <Button
                style={style}
                text="Copy Raw Content"
                size="small"
                disabled={!message.content}
                onPress={() => {
                    clipboard.setString(message.content)
                    showToast("Copied content to clipboard", findAssetId("CopyIcon"))
                }}
            />
            <Button
                text="Copy Raw Data"
                style={style}
                size="small"
                onPress={() => {
                    clipboard.setString(stringMessage)
                    showToast("Copied data to clipboard", findAssetId("CopyIcon"))
                }}
            />
            {message.content && <Codeblock selectable style={style}>{message.content}</Codeblock>}
            <Codeblock selectable>{stringMessage}</Codeblock>
        </ScrollView>
    </>)
}
