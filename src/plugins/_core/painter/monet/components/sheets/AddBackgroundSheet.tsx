import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { React, ReactNative as RN } from "@metro/common";
import { Button, Text, TextInput } from "@metro/common/components";
import { hideSheet } from "@api/ui/sheets";

const SHEET_KEY = "AddBackgroundSheet";

export default function AddBackgroundSheet({
    add,
}: {
    add: (title: string, location: string) => void;
}) {
    const [url, setUrl] = React.useState("");
    const [label, setLabel] = React.useState("");

    return (
        <RN.View style={{ padding: 16, gap: 12 }}>
            <Text variant="text-lg/semibold" color="TEXT_NORMAL">
                Add custom background
            </Text>
            <TextInput
                size="md"
                label="Image URL"
                placeholder="https://example.com/background.png"
                value={url}
                onChange={(x: string) => setUrl(x)}
            />
            <TextInput
                size="md"
                label="Label"
                placeholder="New background"
                value={label}
                onChange={(x: string) => setLabel(x)}
            />
            <Button
                text="Add"
                variant="primary"
                size="md"
                icon={findAssetId("PlusIcon")}
                onPress={() => {
                    if (!url || !label) return;
                    add(label, url);
                    hideSheet(SHEET_KEY);
                }}
                disabled={!url || !label}
            />
        </RN.View>
    );
}

export { SHEET_KEY };
