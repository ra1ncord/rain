import { findAssetId } from "@api/assets";
import { dismissAlert, openAlert } from "@api/ui/alerts";
import { showToast } from "@api/ui/toasts";
import { clipboard, NavigationNative, React, ReactNative } from "@metro/common";
import { AlertActionButton, AlertActions, AlertModal, Stack, TableRow, TableRowGroup, TableSwitchRow, TextInput } from "@metro/common/components";
import type { Rule } from "../../def";
import { useTextReplaceSettings } from "../../storage";

const { ScrollView, View, Keyboard } = ReactNative;

const InputRow = ({
    label,
    value,
    onChange,
    placeholder,
    isClearable,
}: {
    label: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    isClearable?: boolean
}) => (
    <TableRow
        label={label}
        subLabel={
            <View style={{ marginTop: 8 }}>
                <TextInput placeholder={placeholder} value={value} onChange={onChange} isClearable={isClearable} />
            </View>
        }
    />
);

export default function EditRule({ ruleIndex }: { ruleIndex: number }) {
    const storage = useTextReplaceSettings();

    // Wait for storage to hydrate before accessing rules
    if (!storage._hasHydrated) {
        return null;
    }

    const initialRule = storage.rules[ruleIndex] as Rule;
    if (!initialRule) return null;

    // We use local state and save on exit to prevent lag caused by synchronous storage updates
    const [localRule, setLocalRule] = React.useState(initialRule);
    const navigation = NavigationNative.useNavigation();

    const ruleRef = React.useRef(localRule);
    const isDeletingRef = React.useRef(false);

    // Can't get KeyboardAvoidingView to work properly, so here we are ig.
    const [keyboardHeight, setKeyboardHeight] = React.useState(0);

    React.useEffect(() => {
        const showSub = Keyboard.addListener("keyboardDidShow", e => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    React.useEffect(() => {
        const unsubscribe = navigation.addListener("beforeRemove", () => {
            if (isDeletingRef.current || !storage.rules[ruleIndex]) return;

            const newRules = [...storage.rules];
            newRules[ruleIndex] = ruleRef.current;
            storage.updateSettings({ rules: newRules });
        });

        return unsubscribe;
    }, [navigation, ruleIndex]);

    const updateRule = (key: keyof Rule, value: any) => {
        setLocalRule(prev => {
            const newState = { ...prev, [key]: value };
            ruleRef.current = newState;
            return newState;
        });
    };

    const deleteRule = () => {
        isDeletingRef.current = true;
        const newRules = [...storage.rules];
        newRules.splice(ruleIndex, 1);
        storage.updateSettings({ rules: newRules });
        navigation.goBack();
    };

    const handleDeletePress = () => {
        openAlert(
            "delete-rule-confirmation",
            <AlertModal
                title="Delete Rule?"
                content={`Are you sure you want to delete "${localRule.name || "Unnamed Rule"}" rule? This action cannot be undone.`}
                actions={
                    <AlertActions>
                        <AlertActionButton
                            text="Cancel"
                            variant="secondary"
                            onPress={() => dismissAlert("delete-rule-confirmation")}
                        />
                        <AlertActionButton
                            text="Delete"
                            variant="destructive"
                            onPress={() => {
                                dismissAlert("delete-rule-confirmation");
                                deleteRule();
                            }}
                        />
                    </AlertActions>
                }
            />,
        );
    };

    const copyRule = () => {
        const ruleJson = JSON.stringify(localRule, null, 4);
        clipboard.setString(`\`\`\`json\n${ruleJson}\n\`\`\``);
        showToast(`Rule ${localRule.name} copied to clipboard`, findAssetId("CopyIcon"));
    };

    return (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
                paddingBottom: keyboardHeight + 12,
            }}
            keyboardShouldPersistTaps="handled"
        >
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 16 }} spacing={24}>
                <TableRowGroup title="Configuration">
                    <InputRow
                        label="Name"
                        value={localRule.name}
                        onChange={v => updateRule("name", v)}
                        placeholder="Rule Name"
                        isClearable={true}
                    />
                    <InputRow
                        label="Match"
                        value={localRule.match}
                        onChange={v => updateRule("match", v)}
                        placeholder="Text to replace"
                    />
                    <InputRow
                        label="Replace with"
                        value={localRule.replace}
                        onChange={v => updateRule("replace", v)}
                        placeholder="New text"
                    />
                </TableRowGroup>

                <TableRowGroup title="Settings">
                    <TableSwitchRow
                        label="Regex Mode"
                        subLabel="Treat the match string as a Regular Expression"
                        value={localRule.regex}
                        onValueChange={(v: boolean) => updateRule("regex", v)}
                    />
                    {localRule.regex && (
                        <InputRow
                            label="Regex Flags"
                            value={localRule.flags}
                            onChange={v => updateRule("flags", v)}
                            placeholder="gi"
                        />
                    )}
                </TableRowGroup>

                <TableRowGroup title="Actions">
                    <TableRow
                        label="Copy Rule JSON"
                        icon={<TableRow.Icon source={findAssetId("CopyIcon")} />}
                        onPress={copyRule}
                        arrow
                    />
                    <TableRow
                        label="Delete Rule"
                        icon={<TableRow.Icon source={findAssetId("TrashIcon")} variant="danger" />}
                        onPress={handleDeletePress}
                        variant="danger"
                        arrow
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}
