import { ReactNative, clipboard, React } from "@metro/common"
import { showToast } from "@api/ui/toasts"
import { Codeblock } from "@api/ui/components"
import { cleanMessage } from "./cleanmessage"
import {findAssetId} from "@api/assets";
import {Button, Stack, TableRow, TableRowGroup} from "@metro/common/components";

const { ScrollView } = ReactNative

export default function RawPage({ message }: any) {
    const stringMessage = React.useMemo(() => JSON.stringify(cleanMessage(message), null, 4), [message.id])

    return (<>
        <ScrollView style={{ flex: 1, marginVertical: 10 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }}>
                <TableRowGroup title="Actions">
                <TableRow
                    label="Copy Raw Content"
                    icon={<TableRow.Icon source={findAssetId("ClipboardListIcon")}/>}
                    disabled={!message.content}
                    onPress={() => {
                        clipboard.setString(message.content)
                        showToast("Copied content to clipboard", findAssetId("ClipboardCheckIcon"))
                    }}
                />
                <TableRow
                    label="Copy Raw Data"
                    icon={<TableRow.Icon source={findAssetId("ClipboardListIcon")}/>}
                    onPress={() => {
                        clipboard.setString(stringMessage)
                        showToast("Copied data to clipboard", findAssetId("ClipboardCheckIcon"))
                    }}
                />
                </TableRowGroup>
                {message.content && <Codeblock selectable>{message.content}</Codeblock>}
                <Codeblock selectable>{stringMessage}</Codeblock>
            </Stack>
        </ScrollView>
    </>)
}
