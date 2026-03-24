import { findAssetId } from "@api/assets";
import { dismissAlert, openAlert } from "@api/ui/alerts";
import { showToast } from "@api/ui/toasts";
import { clipboard, NavigationNative, React, ReactNative } from "@metro/common";
import { AlertActionButton, AlertActions, AlertModal, Stack, TableRow, TableRowGroup, TableSwitchRow, TextInput } from "@metro/common/components";
import { Strings, formatString } from "@rain/i18n";

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
                title={Strings.PLUGINS.CUSTOM.TEXTREPLACE.DELETE_RULE_QUESTION}
                content={formatString("PLUGINS.CUSTOM.TEXTREPLACE.ARE_YOU_SURE_DELETE_RULE", { rulename: `${localRule.name || Strings.PLUGINS.CUSTOM.TEXTREPLACE.UNNAMED_RULE}` })}
                actions={
                    <AlertActions>
                        <AlertActionButton
                            text={Strings.PLUGINS.CUSTOM.TEXTREPLACE.CANCEL}
                            variant="secondary"
                            onPress={() => dismissAlert("delete-rule-confirmation")}
                        />
                        <AlertActionButton
                            text={Strings.PLUGINS.CUSTOM.TEXTREPLACE.DELETE}
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
        showToast(formatString("PLUGINS.CUSTOM.TEXTREPLACE.RULE_COPIED", { rulename: localRule.name }), findAssetId("CopyIcon"));
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
                <TableRowGroup title={Strings.PLUGINS.CUSTOM.TEXTREPLACE.CONFIGURATION}>
                    <InputRow
                        label={Strings.PLUGINS.CUSTOM.TEXTREPLACE.NAME_PLACEHOLDER}
                        value={localRule.name}
                        onChange={v => updateRule("name", v)}
                        placeholder={Strings.PLUGINS.CUSTOM.TEXTREPLACE.RULE_NAME}
                        isClearable={true}
                    />
                    <InputRow
                        label={Strings.PLUGINS.CUSTOM.TEXTREPLACE.MATCH}
                        value={localRule.match}
                        onChange={v => updateRule("match", v)}
                        placeholder={Strings.PLUGINS.CUSTOM.TEXTREPLACE.MATCH_DESC}
                    />
                    <InputRow
                        label={Strings.PLUGINS.CUSTOM.TEXTREPLACE.REPLACE_WITH}
                        value={localRule.replace}
                        onChange={v => updateRule("replace", v)}
                        placeholder={Strings.PLUGINS.CUSTOM.TEXTREPLACE.NEW_TEXT}
                    />
                </TableRowGroup>

                <TableRowGroup title={Strings.PLUGINS.CUSTOM.TEXTREPLACE.SETTINGS}>
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.TEXTREPLACE.REGEX_MODE}
                        subLabel={Strings.PLUGINS.CUSTOM.TEXTREPLACE.REGEX_MODE_DESC}
                        value={localRule.regex}
                        onValueChange={(v: boolean) => updateRule("regex", v)}
                    />
                    {localRule.regex && (
                        <InputRow
                            label={Strings.PLUGINS.CUSTOM.TEXTREPLACE.REGEX_FLAGS}
                            value={localRule.flags}
                            onChange={v => updateRule("flags", v)}
                            placeholder="gi"
                        />
                    )}
                </TableRowGroup>

                <TableRowGroup title={Strings.PLUGINS.CUSTOM.TEXTREPLACE.ACTIONS}>
                    <TableRow
                        label={Strings.PLUGINS.CUSTOM.TEXTREPLACE.COPY_RULE_JSON}
                        icon={<TableRow.Icon source={findAssetId("CopyIcon")} />}
                        onPress={copyRule}
                        arrow
                    />
                    <TableRow
                        label={Strings.PLUGINS.CUSTOM.TEXTREPLACE.DELETE_RULE}
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
