import { findAssetId } from "@api/assets";
import { components, NavigationNative, ReactNative } from "@metro/common";
import { Button, Text } from "@metro/common/components";

import { useTextReplaceSettings } from "../../storage";
import EditRule from "./EditRule";

const { ScrollView, View } = ReactNative;
const { TableRow, Stack, TableRowGroup } = components;

export default function Settings() {
    const storage = useTextReplaceSettings();
    const navigation = NavigationNative.useNavigation();

    const createNewRule = () => {
        const newRule = {
            name: "New Rule",
            match: "",
            flags: "gi",
            replace: "",
            regex: false,
        };
        useTextReplaceSettings.getState().updateSettings({ rules: [...useTextReplaceSettings.getState().rules, newRule] });

        const newIndex = useTextReplaceSettings.getState().rules.length - 1;
        navigation.push("RAIN_CUSTOM_PAGE", {
            title: "Edit Rule",
            render: () => <EditRule ruleIndex={newIndex} />,
        });
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
                <Stack style={{ paddingVertical: 24, paddingHorizontal: 16 }} spacing={24}>
                    <TableRowGroup title="Rules">
                        {storage.rules.length === 0 ? (
                            <View style={{ padding: 16, alignItems: "center" }}>
                                <Text variant="text-md/medium">
                                    No rules created yet.
                                </Text>
                            </View>
                        ) : (
                            storage.rules.map((rule: any, index: number) => (
                                <TableRow
                                    key={index}
                                    label={rule.name ? `${rule.name}` : "Unnamed Rule"}
                                    subLabel={rule.match ? `Matches: ${rule.match}` : "No match pattern set"}
                                    onPress={() =>
                                        navigation.push("RAIN_CUSTOM_PAGE", {
                                            title: "Edit Rule",
                                            render: () => <EditRule ruleIndex={index} />,
                                        })
                                    }
                                    arrow
                                />
                            ))
                        )}
                    </TableRowGroup>

                    <Button
                        text="New Rule"
                        variant="primary"
                        size="md"
                        onPress={createNewRule}
                        icon={findAssetId("PlusSmallIcon")}
                        iconPosition="start"
                    />
                </Stack>
            </ScrollView>
        </View>
    );
}
