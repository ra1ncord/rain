import { findAssetId } from "@api/assets";
import { Codeblock } from "@api/ui/components";
import { showToast } from "@api/ui/toasts";
import { clipboard, React,ReactNative } from "@metro/common";
import { Stack, TableRow, TableRowGroup } from "@metro/common/components";
import { Strings } from "@rain/i18n";

import { cleanMessage } from "./cleanmessage";

const { ScrollView } = ReactNative;

export default function RawPage({ message }: any) {
    const stringMessage = React.useMemo(() => JSON.stringify(cleanMessage(message), null, 4), [message.id]);

    return (<>
        <ScrollView style={{ flex: 1, marginVertical: 10 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }}>
                <TableRowGroup title={Strings.PLUGINS.CUSTOM.VIEWRAW.ACTIONS}>
                    <TableRow
                        label={Strings.PLUGINS.CUSTOM.VIEWRAW.COPY_RAW_CONTENT}
                        icon={<TableRow.Icon source={findAssetId("ClipboardListIcon")}/>}
                        disabled={!message.content}
                        onPress={() => {
                            clipboard.setString(message.content);
                            showToast(Strings.PLUGINS.CUSTOM.VIEWRAW.COPIED_RAW_CONTENT, findAssetId("ClipboardCheckIcon"));
                        }}
                    />
                    <TableRow
                        label={Strings.PLUGINS.CUSTOM.VIEWRAW.COPY_RAW_DATA}
                        icon={<TableRow.Icon source={findAssetId("ClipboardListIcon")}/>}
                        onPress={() => {
                            clipboard.setString(stringMessage);
                            showToast(Strings.PLUGINS.CUSTOM.VIEWRAW.COPIED_RAW_DATA, findAssetId("ClipboardCheckIcon"));
                        }}
                    />
                </TableRowGroup>
                {message.content && <Codeblock selectable>{message.content}</Codeblock>}
                <Codeblock selectable>{stringMessage}</Codeblock>
            </Stack>
        </ScrollView>
    </>);
}
