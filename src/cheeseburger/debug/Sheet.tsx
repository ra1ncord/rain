import { hideSheet } from "@api/ui/sheets";
import { React } from "@metro/common";
import { ActionSheet, BottomSheetTitleHeader, Button, Text, TextInput } from "@metro/common/components";
import { Text as RNText, View } from "react-native";

import { connectDebug, disconnectDebug } from ".";
import { useDebugSettings } from "./storage";

export const SHEET = "CheeseburgerDebugUpload";

export function DebugUploadSheet() {
    const s = useDebugSettings();
    const [repo, setRepo] = React.useState("");
    const [token, setToken] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState("");
    const connected = !!(s.verified && s.token && s.repo);

    return (
        <ActionSheet>
            <BottomSheetTitleHeader title="Debug upload" />
            <View style={{ padding: 16, gap: 12 }}>
                {connected
                    ? (
                        <>
                            <Text variant="text-md/medium" color="text-normal">connected ✓</Text>
                            <Button
                                text="Disconnect"
                                variant="destructive"
                                size="md"
                                onPress={() => {
                                    disconnectDebug();
                                    hideSheet(SHEET);
                                }}
                            />
                        </>
                    )
                    : (
                        <>
                            <TextInput
                                size="md"
                                value={repo}
                                placeholder="repo name"
                                autoCapitalize="none"
                                autoCorrect={false}
                                isClearable={false}
                                onChange={(v: string) => setRepo(v)}
                            />
                            <TextInput
                                size="md"
                                value={token}
                                placeholder="token"
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                                isClearable={false}
                                onChange={(v: string) => setToken(v)}
                            />
                            {!!error && <RNText style={{ color: "#f23f43", fontSize: 14, fontWeight: "600" }}>{error}</RNText>}
                            <Button
                                text="Connect"
                                variant="primary"
                                size="md"
                                loading={busy}
                                disabled={busy}
                                onPress={() => {
                                    setBusy(true);
                                    setError("");
                                    void connectDebug(repo, token).then(err => {
                                        setBusy(false);
                                        if (err) setError(err);
                                        else {
                                            setRepo("");
                                            setToken("");
                                            hideSheet(SHEET);
                                        }
                                    }, () => setBusy(false));
                                }}
                            />
                        </>
                    )}
            </View>
        </ActionSheet>
    );
}
