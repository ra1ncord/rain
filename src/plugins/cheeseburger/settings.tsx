import { Stack, TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { ScrollView } from "react-native";

import DeafenSettings from "./deafen/settings";
import { setFeature } from "./features";
import RotateSettings from "./rotate/settings";
import SplitSettings from "./split/settings";
import { useCheeseburger } from "./storage";
import { buildRevision, updateNow, useUpdateReady } from "./updates";
import VolumeSettings from "./volume/settings";

export default function Settings() {
    const s = useCheeseburger();
    const ready = useUpdateReady();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 12, paddingHorizontal: 12 }} spacing={16}>
                <TableRowGroup title="Features">
                    <TableSwitchRow label="Volume boost" value={s.volume} onValueChange={(v: boolean) => setFeature("volume", v)} />
                    <TableSwitchRow label="Deafen button" value={s.deafen} onValueChange={(v: boolean) => setFeature("deafen", v)} />
                    <TableSwitchRow label="Split view" value={s.split} onValueChange={(v: boolean) => setFeature("split", v)} />
                    <TableSwitchRow label="Rotate button" value={s.rotate} onValueChange={(v: boolean) => setFeature("rotate", v)} />
                    <TableSwitchRow label="Live updates" subLabel={`build ${buildRevision}`} value={s.updates} onValueChange={(v: boolean) => setFeature("updates", v)} />
                    {s.updates && ready && <TableRow label="Update" subLabel="ready" onPress={updateNow} />}
                </TableRowGroup>
                {s.volume && <VolumeSettings />}
                {s.deafen && <DeafenSettings />}
                {s.split && <SplitSettings />}
                {s.rotate && <RotateSettings />}
            </Stack>
        </ScrollView>
    );
}
