import { getDebugInfo } from "@api/debug";
import { BundleUpdaterManager } from "@api/native/modules";
import { useSettings } from "@api/settings";
import { Codeblock, ErrorBoundary } from "@api/ui/components";
import { createStyles } from "@api/ui/styles";
import { tokens } from "@metro/common";
import { Button, Card, SafeAreaProvider, SafeAreaView, Text } from "@metro/common/components";
import { checkForUpdate, downloadUpdate } from "@rain/pages/Updater";
import { ScrollView, View } from "react-native";

import ErrorComponentStackCard from "./ErrorComponentStackCard";
import ErrorStackCard from "./ErrorStackCard";
import { hasStack, isComponentStack } from "./stack";

const useStyles = createStyles({
    container: {
        flex: 1,
        backgroundColor: tokens.colors.BG_BASE_SECONDARY,
        paddingHorizontal: 16,
        height: "100%",
        gap: 12
    }
});

export default function ErrorBoundaryScreen(props: {
    error: Error;
    rerender: () => void;
}) {
    const styles = useStyles();
    const debugInfo = getDebugInfo();

    const { safeMode, updateSettings } = useSettings();

    return <ErrorBoundary>
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View style={{ gap: 4 }}>
                    <Text variant="display-lg">Uh oh.</Text>
                    <Text variant="text-md/normal">A crash occurred while rendering a component. This could be caused by Rain or Discord itself.</Text>
                    <Text variant="text-sm/normal" color="text-muted">{debugInfo.os.name}; {debugInfo.discord.build} ({debugInfo.discord.version}); {debugInfo.rain.version}</Text>
                </View>
                <ScrollView fadingEdgeLength={56} contentContainerStyle={{ gap: 12 }} style={{ paddingTop: 30 }}>
                    <Codeblock selectable={true}>{props.error.message}</Codeblock>
                    {hasStack(props.error) && <ErrorStackCard error={props.error} />}
                    {isComponentStack(props.error) ? <ErrorComponentStackCard componentStack={props.error.componentStack} /> : null}
                </ScrollView>
                <Card style={{ gap: 6 }}>
                    <Button text="Reload Discord" onPress={() => BundleUpdaterManager.reload()} />
                    {!safeMode && <Button text="Reload in Safe Mode" onPress={() => updateSettings({ safeMode: true })} />}
                    {checkForUpdate() && <Button text="Download latest Rain update" onPress={() => { downloadUpdate(); BundleUpdaterManager.reload(); }} />}
                    <Button variant="destructive" text="Retry Render" onPress={() => props.rerender()} />
                </Card>
            </SafeAreaView>
        </SafeAreaProvider>
    </ErrorBoundary>;
}
