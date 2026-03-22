import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import {
    Stack,
    // TableRadioGroup,
    // TableRadioRow,
    TableRow,
    TableRowGroup
} from "@metro/common/components";
import { ScrollView } from "react-native";

// import { CustomEffectsProfileMode, useCustomEffectSettings } from "./storage";
import { loadAllEffectData } from "./patches/effects";

export default function CustomEffectSettings() {
    // const { mode, updateSettings } = useCustomEffectSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                {/* <TableRadioGroup
                    title="Choose your prefered mode"
                    value={mode}
                    onChange={(v: string) =>
                        updateSettings({ mode: v as CustomEffectsProfileMode })
                    }
                >
                    <TableRadioRow
                        label="Prefer CustomEffects Profile Effects"
                        subLabel="Shows CustomEffects' effects even if there already is an effect selected on Discord"
                        value={CustomEffectsProfileMode.PreferCustomEffects}
                    />
                    <TableRadioRow
                        label="Prefer Native Profile Effects"
                        subLabel="Shows Discord's effects even if there are effects registered on CustomEffects"
                        value={CustomEffectsProfileMode.PreferNativeEffects}
                    />
                </TableRadioGroup> */}

                <TableRowGroup title="Info">
                    <TableRow
                        label="Request your own CustomEffect"
                        icon={<TableRow.Icon source={findAssetId("Discord")} />}
                        trailing={TableRow.Arrow}
                        onPress={() => {
                            const { Linking } = require("react-native");
                            Linking.openURL("https://discord.gg/FGzGgph4Vm");
                        }}
                    />
                    <TableRow
                        label="Reload DB"
                        icon={<TableRow.Icon source={findAssetId("RetryIcon")} />}
                        onPress={async () => {
                            await loadAllEffectData();
                            showToast("Reloaded DB", findAssetId("check"));
                        }}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
