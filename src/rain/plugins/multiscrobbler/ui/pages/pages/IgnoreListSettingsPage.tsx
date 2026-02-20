import { React, ReactNative as RN } from "@metro/common";
import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import {
    ScrollView,
    Stack,
    TableRowGroup,
    TableRow,
    TextInput,
} from "./components/TableComponents";
import { setStorage } from "../Settings";
import { useMultiScrobblerSettings } from "../../../storage";
import { SelfPresenceStore } from "../../../modules";
import { clearActivity } from "../../../utils/activity";

export default function IgnoreListSettingsPage() {
    const settings = useMultiScrobblerSettings();
    const [newAppName, setNewAppName] = React.useState("");

    const checkAndClearIfIgnored = () => {
        const ignoredActivity = SelfPresenceStore.findActivity((act) => {
            if (!act.name) return false;
            return settings.ignoreList.some((ignoredApp: string) =>
                act.name.toLowerCase().includes(ignoredApp.toLowerCase()),
            );
        });
        if (ignoredActivity) {
            clearActivity();
        }
    };

    const triggerImmediateUpdate = () => {
        import("../../../manager").then(({ updateActivity }) => {
            updateActivity();
        });
    };

    const addAppToIgnoreList = () => {
        if (!newAppName.trim()) {
            showToast("Please enter an app name", findAssetId("Small"));
            return;
        }

        if (!settings.ignoreList.includes(newAppName.trim())) {
            setStorage("ignoreList", [...settings.ignoreList, newAppName.trim()]);
            setNewAppName("");
            showToast("App added to ignore list", findAssetId("Check"));
            checkAndClearIfIgnored();
        } else {
            showToast("App already in ignore list", findAssetId("Warning"));
        }
    };

    const removeAppFromIgnoreList = (appName: string) => {
        setStorage(
            "ignoreList",
            settings.ignoreList.filter((app: string) => app !== appName),
        );
        showToast("App removed from ignore list", findAssetId("Check"));
        triggerImmediateUpdate();
    };

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
            <Stack spacing={8}>
                <TableRowGroup title="Add App to Ignore">
                    <Stack spacing={4}>
                        <TextInput
                            placeholder="Enter app name"
                            value={newAppName}
                            onChange={setNewAppName}
                            isClearable
                            onSubmitEditing={addAppToIgnoreList}
                            returnKeyType="done"
                        />
                    </Stack>
                </TableRowGroup>

                <TableRowGroup>
                    <TableRow
                        label="Add to Ignore List"
                        subLabel="Add the current app name to your ignore list"
                        trailing={<TableRow.Arrow />}
                        onPress={addAppToIgnoreList}
                    />
                </TableRowGroup>

                {settings.ignoreList.length > 0 && (
                    <TableRowGroup title="Ignored Apps">
                        {settings.ignoreList.map((appName: string, index: number) => (
                            <TableRow
                                key={index}
                                label={appName}
                                trailing={
                                    <RN.TouchableOpacity
                                        onPress={() => removeAppFromIgnoreList(appName)}
                                        style={{
                                            padding: 6,
                                            backgroundColor: "#ed4245",
                                            borderRadius: 8,
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <RN.Image
                                            source={findAssetId("TrashIcon")}
                                            style={{ width: 18, height: 18, tintColor: "#ffffff" }}
                                        />
                                    </RN.TouchableOpacity>
                                }
                            />
                        ))}
                    </TableRowGroup>
                )}

                <TableRowGroup title="About Ignore List">
                    <TableRow
                        label="How it Works"
                        subLabel="When any app in your ignore list is active, your music status will be hidden"
                    />
                    <TableRow
                        label="Detection"
                        subLabel="Apps are detected by their Discord activity name"
                    />
                    <TableRow
                        label="Examples"
                        subLabel="Spotify, YouTube Music, Kizzy, Metrolist, echo"
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
