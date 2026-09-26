import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { ScrollView } from "react-native";

import DeafenSettings from "./deafen/settings";
import { setFeature } from "./features";
import SplitSettings from "./split/settings";
import { useCheeseburger } from "./storage";
import { buildRevision } from "./updates";
import VolumeSettings from "./volume/settings";

export default function Settings() {
    const s = useCheeseburger();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 12, paddingHorizontal: 12 }} spacing={16}>
                <TableRowGroup title="Features">
                    <TableSwitchRow label="Volume boost" value={s.volume} onValueChange={(v: boolean) => setFeature("volume", v)} />
                    <TableSwitchRow label="Deafen button" value={s.deafen} onValueChange={(v: boolean) => setFeature("deafen", v)} />
                    <TableSwitchRow label="Split view" value={s.split} onValueChange={(v: boolean) => setFeature("split", v)} />
                    <TableSwitchRow label="Live updates" subLabel={`build ${buildRevision}`} value={s.updates} onValueChange={(v: boolean) => setFeature("updates", v)} />
                </TableRowGroup>
                {s.volume && <VolumeSettings />}
                {s.deafen && <DeafenSettings />}
                {s.split && <SplitSettings />}
            </Stack>
        </ScrollView>
    );
}
