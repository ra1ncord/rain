import React from "react";
import { findByProps } from "@metro";
import { semanticColors } from "@api/ui/components/color";
import { useProfileColorStore } from "./storage";
import SettingsTextInput from "@api/ui/components/SettingsTextInput";

const { TableRow, TableSwitchRow, TableRowGroup } = findByProps("TableRow");
const { Card } = findByProps("Card");
const { TextInput } = findByProps("TextInput");
const { View } = findByProps("View");

export default function ProfileColorSettings() {
    const store = useProfileColorStore();
    const [primaryInput, setPrimaryInput] = React.useState(store.primary !== null ? `#${store.primary.toString(16)}` : "");
    const [accentInput, setAccentInput] = React.useState(store.accent !== null ? `#${store.accent.toString(16)}` : "");

    function isValidHex(hex: string) {
        return /^#?[0-9a-fA-F]{6}$/.test(hex);
    }
    function handlePrimaryChange(value: string) {
        setPrimaryInput(value);
        if (value === "") {
            store.updateSettings({ primary: null });
        } else {
            const hex = value.replace(/^#/, "");
            if (isValidHex(value)) {
                const num = parseInt(hex, 16);
                store.updateSettings({ primary: num });
            } else {
                store.updateSettings({ primary: null });
            }
        }
    }
    function handleAccentChange(value: string) {
        setAccentInput(value);
        if (value === "") {
            store.updateSettings({ accent: null });
        } else {
            const hex = value.replace(/^#/, "");
            if (isValidHex(value)) {
                const num = parseInt(hex, 16);
                store.updateSettings({ accent: num });
            } else {
                store.updateSettings({ accent: null });
            }
        }
    }

    return (
        <View style={{ flex: 1, paddingVertical: 24, paddingHorizontal: 12 }}>
            <TableRowGroup title="Settings">
                <TableSwitchRow
                    label="Enable Profile Colors"
                    value={store.enabled}
                    onValueChange={(v: boolean) => store.updateSettings({ enabled: v })}
                />
            </TableRowGroup>
            <TableRowGroup title="Colors">
                <Card style={{ marginBottom: 16, backgroundColor: semanticColors.CARD_PRIMARY_BG }}>
                    <SettingsTextInput
                        placeholder="#000000"
                        value={primaryInput}
                        onChange={handlePrimaryChange}
                        isClearable
                    />
                    <SettingsTextInput
                        placeholder="#000000"
                        value={accentInput}
                        onChange={handleAccentChange}
                        isClearable
                    />
                </Card>
                <TableRow
                    label="Reset Colors"
                    variant="danger"
                    arrow={false}
                    onPress={() => {
                        setPrimaryInput("");
                        setAccentInput("");
                        store.updateSettings({ primary: null, accent: null, enabled: false });
                    }}
                />
            </TableRowGroup>
        </View>
    );
}