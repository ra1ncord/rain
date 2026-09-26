import { findAssetId } from "@api/assets";
import { pickTextFile } from "@api/external/filePicker";
import { dismissAlert, openAlert } from "@api/ui/alerts";
import isValidHttpUrl from "@lib/utils/isValidHttpUrl";
import { clipboard } from "@metro/common";
import { AlertActionButton, AlertModal, Button, Stack, Text, TextInput } from "@metro/common/components";
import * as React from "react";
import { ScrollView } from "react-native";

const ALERT_KEY = "AddonInstallAlert";

export interface AddonInstallOptions {
    title: string;
    description: string;
    onUrl: (url: string) => Promise<void>;
    onCode: (content: string, fileName?: string) => Promise<void>;
}

function AddonInstallAlert({ title, description, onUrl, onCode }: AddonInstallOptions) {
    const [url, setUrl] = React.useState("");
    const [loaded, setLoaded] = React.useState<{ name?: string; content: string; } | null>(null);
    const [error, setError] = React.useState("");
    const [busy, setBusy] = React.useState(false);

    const fail = (e: unknown) => setError(e instanceof Error ? e.message : String(e));

    async function pasteFromClipboard() {
        setError("");
        const text: string = (await clipboard.getString())?.trim?.() ?? "";
        if (!text) return setError("Clipboard is empty");
        if (isValidHttpUrl(text)) {
            setLoaded(null);
            setUrl(text);
        } else {
            setUrl("");
            setLoaded({ name: "Clipboard", content: text });
        }
    }

    async function chooseFile() {
        setError("");
        try {
            const file = await pickTextFile();
            if (file) {
                setUrl("");
                setLoaded(file);
            }
        } catch (e) {
            fail(e);
        }
    }

    function install() {
        setError("");
        let task: Promise<void>;
        if (loaded) task = onCode(loaded.content, loaded.name === "Clipboard" ? undefined : loaded.name);
        else if (isValidHttpUrl(url.trim())) task = onUrl(url.trim());
        else return setError("Invalid link");

        setBusy(true);
        task.then(() => dismissAlert(ALERT_KEY)).catch(fail).finally(() => setBusy(false));
    }

    const sizeKb = loaded ? Math.max(1, Math.round(loaded.content.length / 1024)) : 0;

    return <AlertModal
        title={title}
        content={description}
        extraContent={
            <Stack style={{ marginTop: -12 }} spacing={8}>
                {loaded ? (
                    <Stack direction="horizontal" spacing={8} style={{ alignItems: "center" }}>
                        <Text variant="text-sm/semibold" style={{ flex: 1 }} numberOfLines={1}>
                            {`📄 ${loaded.name ?? "File"} · ${sizeKb} KB`}
                        </Text>
                        <Button size="sm" variant="tertiary" text="Clear" onPress={() => setLoaded(null)} />
                    </Stack>
                ) : (
                    <TextInput
                        placeholder="https://…"
                        isClearable={true}
                        value={url}
                        onChange={(v: string) => {
                            setUrl(v);
                            if (error) setError("");
                        }}
                        returnKeyType="done"
                        onSubmitEditing={install}
                        state={error ? "error" : undefined}
                        errorMessage={error || undefined}
                    />
                )}
                {loaded && error ? <Text variant="text-sm/medium" color="text-danger">{error}</Text> : null}
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    <Button
                        size="sm"
                        variant="tertiary"
                        text="Paste"
                        icon={findAssetId("ClipboardListIcon")}
                        onPress={pasteFromClipboard}
                    />
                    <Button
                        size="sm"
                        variant="tertiary"
                        text="Choose file"
                        icon={findAssetId("FileIcon") ?? findAssetId("DownloadIcon")}
                        onPress={chooseFile}
                    />
                </ScrollView>
            </Stack>
        }
        actions={
            <Stack>
                <Button
                    loading={busy}
                    text="Install"
                    variant="primary"
                    disabled={!loaded && !url.trim()}
                    onPress={install}
                />
                <AlertActionButton disabled={busy} text="Cancel" variant="secondary" />
            </Stack>
        }
    />;
}

export function openAddonInstallAlert(options: AddonInstallOptions) {
    openAlert(ALERT_KEY, <AddonInstallAlert {...options} />);
}
