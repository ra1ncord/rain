import { findAssetId } from "@api/assets";
import { hotStatus } from "@api/hot/status";
import { showSheet } from "@api/ui/sheets";
import { showToast } from "@api/ui/toasts";
import { clipboard, React } from "@metro/common";
import { Button, Stack, TableRow, TableRowGroup, TableSwitchRow, Text, TextInput } from "@metro/common/components";
import { ScrollView, View } from "react-native";

import { useDeafenButtonSettings } from "./deafen/storage";
import { setFeature } from "./features";
import { rotateDebug } from "./rotate";
import { ArrangeSheet, LABELS } from "./split/Arrange";
import { layoutDebug } from "./split/layout";
import { pipDebug } from "./split/pip";
import { useSplitViewSettings } from "./split/storage";
import { currentOrder } from "./split/tiles";
import { useCheeseburger } from "./storage";
import { styleDebug } from "./style";
import { baseColor } from "./style/colors";
import { useStyleSettings } from "./style/storage";
import { buildRevision, syncNow, updateNow, useSync, useUpdateReady } from "./updates";
import { volumeDebug } from "./volume";
import { useVolumeBoostSettings } from "./volume/storage";

function icon(...names: string[]) {
    const id = names.map(n => findAssetId(n)).find(x => x !== undefined);
    return id !== undefined ? <TableRow.Icon source={id} /> : undefined;
}

function NumberField({ value, onCommit }: { value: number; onCommit: (n: number) => void; }) {
    const [text, setText] = React.useState(String(value));
    React.useEffect(() => setText(String(value)), [value]);
    return (
        <View style={{ width: 88 }}>
            <TextInput
                size="sm"
                value={text}
                keyboardType="number-pad"
                maxLength={5}
                isClearable={false}
                onChange={(v: string) => {
                    const t = v.replace(/\D/g, "");
                    setText(t);
                    const n = parseInt(t, 10);
                    if (Number.isFinite(n)) onCommit(n);
                }}
            />
        </View>
    );
}

const copy = (lines: string[]) => {
    clipboard.setString(lines.join("\n"));
    showToast("Copied");
};

export default function Settings() {
    const s = useCheeseburger();
    const ready = useUpdateReady();
    const sync = useSync();
    const volume = useVolumeBoostSettings();
    const deafen = useDeafenButtonSettings();
    const split = useSplitViewSettings();
    const style = useStyleSettings();
    const boosted = Object.keys(volume.boosted ?? {}).length;
    const live = `${hotStatus.source}${hotStatus.revision ? ` ${hotStatus.revision.slice(0, 7)}` : ""}`;

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 12, paddingHorizontal: 12 }} spacing={24}>
                <View style={{ gap: 8 }}>
                    <Button
                        text="Update now"
                        variant="primary"
                        size="md"
                        loading={sync.busy}
                        icon={findAssetId("DownloadIcon") ?? findAssetId("RetryIcon")}
                        onPress={() => void syncNow()}
                    />
                    {!!sync.text && (
                        <Text variant="text-sm/medium" color="text-muted" style={{ textAlign: "center" }}>
                            {sync.text}
                        </Text>
                    )}
                </View>

                <TableRowGroup title="Audio">
                    <TableSwitchRow
                        label="Volume boost"
                        icon={icon("VoiceNormalIcon", "SpeakerIcon", "ic_sound_24px", "SoundboardIcon")}
                        value={s.volume}
                        onValueChange={(v: boolean) => setFeature("volume", v)}
                    />
                    {s.volume && (
                        <>
                            <TableRow label="Max volume" trailing={<NumberField value={volume.maxPercent} onCommit={n => volume.updateSettings({ maxPercent: n })} />} />
                            <TableSwitchRow label="Show %" value={volume.showPercent} onValueChange={(v: boolean) => volume.updateSettings({ showPercent: v })} />
                            <TableRow
                                label="Reset boosts"
                                disabled={!boosted}
                                trailing={boosted ? <TableRow.TrailingText text={String(boosted)} /> : undefined}
                                onPress={() => volume.updateSettings({ boosted: {} })}
                            />
                        </>
                    )}
                    <TableSwitchRow
                        label="Deafen button"
                        icon={icon("HeadphonesDenyIcon", "HeadphonesSlashIcon", "HeadphonesIcon", "ic_headset_deafen_24px")}
                        value={s.deafen}
                        onValueChange={(v: boolean) => setFeature("deafen", v)}
                    />
                    {s.deafen && (
                        <>
                            <TableSwitchRow label="Left of camera" value={!deafen.placeAfter} onValueChange={(v: boolean) => deafen.updateSettings({ placeAfter: !v })} />
                            <TableRow label="Icon size" trailing={<NumberField value={deafen.iconSize} onCommit={n => deafen.updateSettings({ iconSize: n || 26 })} />} />
                        </>
                    )}
                </TableRowGroup>

                <TableRowGroup title="Video">
                    <TableSwitchRow
                        label="Split view"
                        icon={icon("GridSquareIcon", "GridVerticalIcon", "LayoutIcon")}
                        value={s.split}
                        onValueChange={(v: boolean) => setFeature("split", v)}
                    />
                    {s.split && (
                        <>
                            <TableSwitchRow label="Split button" subLabel="hold it to arrange" value={split.showButton} onValueChange={(v: boolean) => split.updateSettings({ showButton: v })} />
                            <TableRow
                                label="Arrange"
                                subLabel={currentOrder().map(k => LABELS[k]).join(" · ")}
                                arrow
                                onPress={() => showSheet("CheeseburgerArrange", ArrangeSheet)}
                            />
                        </>
                    )}
                    <TableSwitchRow
                        label="Rotate button"
                        icon={icon("ScreenRotationIcon", "RotateIcon", "ic_screen_rotation", "RetryIcon")}
                        value={s.rotate}
                        onValueChange={(v: boolean) => setFeature("rotate", v)}
                    />
                </TableRowGroup>

                <TableRowGroup title="Style">
                    <TableSwitchRow
                        label="Beveled buttons"
                        subLabel={baseColor() ? undefined : "needs a theme"}
                        icon={icon("PaintPaletteIcon", "ThemeDarkIcon", "PaintbrushThickIcon")}
                        value={s.style}
                        onValueChange={(v: boolean) => setFeature("style", v)}
                    />
                    {s.style && (
                        <>
                            <TableRow label="Bevel size" trailing={<NumberField value={style.bevelSize} onCommit={n => style.updateSettings({ bevelSize: Math.min(24, Math.max(2, n)) })} />} />
                            <TableSwitchRow label="Square corners" value={style.squareCorners} onValueChange={(v: boolean) => style.updateSettings({ squareCorners: v })} />
                        </>
                    )}
                </TableRowGroup>

                <TableRowGroup title="Updates">
                    <TableSwitchRow
                        label="Live updates"
                        subLabel={live}
                        icon={icon("DownloadIcon", "RefreshIcon", "RetryIcon")}
                        value={s.updates}
                        onValueChange={(v: boolean) => setFeature("updates", v)}
                    />
                    {s.updates && ready && <TableRow label="Update ready" subLabel="Reloads Discord" arrow onPress={updateNow} />}
                </TableRowGroup>

                <TableRowGroup title="Debug">
                    {s.split && <TableRow label="Copy split debug" onPress={() => copy([...layoutDebug(), ...pipDebug()])} />}
                    {s.volume && <TableRow label="Copy volume debug" onPress={() => copy(volumeDebug())} />}
                    {s.rotate && <TableRow label="Copy rotate debug" onPress={() => copy(rotateDebug())} />}
                    {s.style && <TableRow label="Copy style debug" onPress={() => copy(styleDebug())} />}
                    {s.volume && <TableSwitchRow label="Volume toasts" value={volume.debugSliders} onValueChange={(v: boolean) => volume.updateSettings({ debugSliders: v })} />}
                    <TableRow label="Build" trailing={<TableRow.TrailingText text={`${buildRevision} · ${live}${hotStatus.error ? " · error" : ""}`} />} onPress={() => copy([`rain ${buildRevision}`, `cheeseburger ${live}`, ...(hotStatus.error ? [hotStatus.error] : [])])} />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
